import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiLifeBuoy, FiMessageCircle, FiSearch, FiSend, FiUsers } from 'react-icons/fi'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { onChatMessage, onConversationRefresh, type LiveChatMessage } from '../utils/chatEvents'

interface Conversation {
  _id: string
  type: 'direct' | 'group' | 'support'
  name?: string
  participants: Array<{ _id: string; firstName: string; lastName: string; role: string }>
  unreadCount?: number
}

interface Message {
  _id: string
  body: string
  createdAt: string
  sender: { _id?: string; firstName: string; lastName: string }
  conversation?: string
  readBy?: string[]
}

export default function Chat() {
  const { user } = useAuthStore()
  const {
    byConversation,
    fetchUnreadSummary,
    clearConversationUnread,
    socketConnected,
    setActiveConversationId,
  } = useChatStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeId, setActiveId] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ _id: string; firstName: string; lastName: string; role: string }>>([])
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [conversationLoadError, setConversationLoadError] = useState('')
  const activeConversationRef = useRef(activeId)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const isDocumentVisible = () => document.visibilityState === 'visible'

  useEffect(() => {
    activeConversationRef.current = activeId
  }, [activeId])

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get('/chat/conversations')
      const data = response.data.data || []
      setConversations(data)
      setConversationLoadError('')
      if (!activeConversationRef.current && data[0]) setActiveId(data[0]._id)
      fetchUnreadSummary()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to load conversations'
      setConversationLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [fetchUnreadSummary])

  const loadMessages = useCallback(async (conversationId: string, syncUnread = false) => {
    if (!conversationId || !isDocumentVisible()) return

    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`)
      setMessages(response.data.data || [])
      clearConversationUnread(conversationId)
      setConversations((current) => current.map((conversation) => conversation._id === conversationId ? { ...conversation, unreadCount: 0 } : conversation))
      if (syncUnread) {
        fetchUnreadSummary()
      }
    } catch {
      return
    }
  }, [clearConversationUnread, fetchUnreadSummary])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = window.setTimeout(() => {
      api.get(`/chat/users?q=${encodeURIComponent(search.trim())}`)
        .then((response) => setSearchResults(response.data.data || []))
        .catch(() => setSearchResults([]))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setActiveConversationId(activeId)
    if (!activeId) {
      return () => setActiveConversationId('')
    }

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        loadMessages(activeId, true)
      }
    }

    loadMessages(activeId, true)
    const timer = socketConnected ? undefined : window.setInterval(() => { loadMessages(activeId, false) }, 60000)
    document.addEventListener('visibilitychange', handleVisibilityRefresh)
    window.addEventListener('focus', handleVisibilityRefresh)

    return () => {
      if (timer) window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityRefresh)
      window.removeEventListener('focus', handleVisibilityRefresh)
      setActiveConversationId('')
    }
  }, [activeId, loadMessages, setActiveConversationId, socketConnected])

  useEffect(() => {
    const unsubscribeMessage = onChatMessage((message: LiveChatMessage) => {
      const incomingConversationId = message.conversation
      if (!incomingConversationId) return

      if (incomingConversationId === activeConversationRef.current && isDocumentVisible()) {
        setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message as Message])
        clearConversationUnread(incomingConversationId)
        setConversations((current) => current.map((conversation) => conversation._id === incomingConversationId ? { ...conversation, unreadCount: 0 } : conversation))
        return
      }

      loadConversations()
    })

    const unsubscribeRefresh = onConversationRefresh(({ conversationId }) => {
      if (conversationId && conversationId === activeConversationRef.current && isDocumentVisible()) {
        loadMessages(conversationId, false)
        return
      }

      loadConversations()
    })

    return () => {
      unsubscribeMessage()
      unsubscribeRefresh()
    }
  }, [clearConversationUnread, loadConversations, loadMessages])

  useEffect(() => {
    const node = messageListRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages])

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || !activeId) return

    try {
      const response = await api.post(`/chat/conversations/${activeId}/messages`, { body: draft })
      setMessages((current) => current.some((item) => item._id === response.data.data._id) ? current : [...current, response.data.data])
      fetchUnreadSummary()
      setDraft('')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Message could not be sent')
    }
  }

  const createDirectConversation = async (participantId: string) => {
    try {
      setCreatingConversation(true)
      const response = await api.post('/chat/conversations', { type: 'direct', participantIds: [participantId] })
      const conversation = response.data.data
      setConversations((current) => current.some((item) => item._id === conversation._id) ? current : [conversation, ...current])
      setActiveId(conversation._id)
      setSearch('')
      setSearchResults([])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Conversation could not be created')
    } finally {
      setCreatingConversation(false)
    }
  }

  const createSupportConversation = async () => {
    try {
      setCreatingConversation(true)
      const response = await api.post('/chat/conversations', { type: 'support' })
      const conversation = response.data.data
      setConversations((current) => current.some((item) => item._id === conversation._id) ? current : [conversation, ...current])
      setActiveId(conversation._id)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Support chat is unavailable right now')
    } finally {
      setCreatingConversation(false)
    }
  }

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name
    const others = conversation.participants.filter((person) => person._id !== user?.id)
    return (others.length > 0 ? others : conversation.participants).map((person) => person.firstName).join(', ')
  }

  const active = conversations.find((conversation) => conversation._id === activeId)
  const activeParticipantIds = active?.participants.map((participant) => participant._id) || []

  const getOwnMessageReceipt = (message: Message) => {
    const otherParticipantIds = activeParticipantIds.filter((participantId) => participantId !== user?.id)
    const readByOthers = otherParticipantIds.filter((participantId) => message.readBy?.includes(participantId)).length

    if (readByOthers > 0) {
      return {
        label: readByOthers === otherParticipantIds.length ? 'Read by everyone' : `Read by ${readByOthers}`,
        ticks: '✓✓',
        className: 'read',
      }
    }

    return {
      label: 'Sent',
      ticks: '✓',
      className: 'sent',
    }
  }

  return (
    <div className="atlas-page max-w-7xl mx-auto px-4 py-8">
      <div className="atlas-heading mb-8">
        <p className="atlas-kicker">Conversation studio</p>
        <h1>Stay in the loop</h1>
        <p>Talk with your study circle, mentor, or support team in one calm workspace.</p>
      </div>
      <div className="chat-layout">
        <aside className="atlas-panel chat-list">
          <div className="mb-5 flex items-center justify-between">
            <h2>Inbox</h2><FiMessageCircle className="text-coral" />
          </div>
          <div className="space-y-4">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Start a direct chat..."
              />
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-2 rounded-2xl bg-[#f6efe7] p-3">
                {searchResults.map((person) => (
                  <button key={person._id} type="button" className="chat-thread" onClick={() => createDirectConversation(person._id)} disabled={creatingConversation}>
                    <span className="chat-avatar">{person.firstName.charAt(0)}</span>
                    <span><strong>{person.firstName} {person.lastName}</strong><small>{person.role}</small></span>
                  </button>
                ))}
              </div>
            ) : null}
            <button type="button" className="btn btn-outline w-full inline-flex items-center justify-center gap-2" onClick={createSupportConversation} disabled={creatingConversation}>
              <FiLifeBuoy />
              Message support
            </button>
          </div>
          {conversationLoadError ? (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p>{conversationLoadError}</p>
              <button type="button" className="btn btn-outline w-full" onClick={() => { setLoading(true); loadConversations() }}>
                Retry chat inbox
              </button>
            </div>
          ) : loading ? <p className="text-muted">Loading conversations...</p> : conversations.length === 0 ? (
            <div className="empty-state"><FiUsers /><p>No conversations yet.</p></div>
          ) : conversations.map((conversation) => (
            <button key={conversation._id} onClick={() => setActiveId(conversation._id)} className={`chat-thread ${activeId === conversation._id ? 'active' : ''}`}>
              <span className="chat-avatar">{conversation.type === 'group' ? <FiUsers /> : <FiMessageCircle />}</span>
              <span className="flex-1"><strong>{getConversationName(conversation)}</strong><small>{conversation.type}</small></span>
              {(conversation.unreadCount || byConversation[conversation._id]) ? <span className="rounded-full bg-coral px-2 py-1 text-xs font-bold text-white">{conversation.unreadCount || byConversation[conversation._id]}</span> : null}
            </button>
          ))}
        </aside>
        <section className="atlas-panel chat-window">
          {active ? <>
            <header className="chat-header"><div><p className="atlas-kicker">{active.type} room</p><h2>{getConversationName(active)}</h2></div><span className="status-dot">{socketConnected ? 'Live' : 'Syncing'}</span></header>
            <div ref={messageListRef} className="message-list">
              {messages.length === 0 ? <div className="empty-state"><FiMessageCircle /><p>Start the conversation.</p></div> : messages.map((message) => {
                const isOwn = message.sender._id ? message.sender._id === user?.id : message.sender.firstName === user?.firstName && message.sender.lastName === user?.lastName
                const receipt = isOwn ? getOwnMessageReceipt(message) : null

                return <article key={message._id} className={`message-bubble ${isOwn ? 'own ml-auto' : ''}`}><strong>{message.sender.firstName} {message.sender.lastName}</strong><p>{message.body}</p><div className="message-meta"><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>{receipt ? <span className={`message-receipt ${receipt.className}`} title={receipt.label} aria-label={receipt.label}>{receipt.ticks}</span> : null}</div></article>
              })}
            </div>
            <form onSubmit={sendMessage} className="chat-compose"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." maxLength={4000} /><button className="btn btn-primary" aria-label="Send message"><FiSend /></button></form>
          </> : <div className="empty-state full"><FiMessageCircle /><h2>Choose a conversation</h2><p>Your conversations will appear here.</p></div>}
        </section>
      </div>
    </div>
  )
}
