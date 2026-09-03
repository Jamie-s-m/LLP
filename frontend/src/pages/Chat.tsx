import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiLifeBuoy, FiMessageCircle, FiSearch, FiSend, FiUsers } from 'react-icons/fi'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { useLanguageStore } from '../store/languageStore'
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

const copy = {
  en: { loadFailed: 'Unable to load conversations', sendFailed: 'Message could not be sent', createFailed: 'Conversation could not be created', supportFailed: 'Support chat is unavailable right now', title: 'Stay in the loop', text: 'Talk with your study circle, mentor, or support team in one calm workspace.', inbox: 'Inbox', search: 'Start a direct chat...', messageSupport: 'Message support', retry: 'Retry chat inbox', loading: 'Loading conversations...', empty: 'No conversations yet.', room: '{type} room', live: 'Live', syncing: 'Syncing', start: 'Start the conversation.', write: 'Write a message...', choose: 'Choose a conversation', chooseText: 'Your conversations will appear here.', sent: 'Sent', readAll: 'Read by everyone', readBy: 'Read by {count}' },
  ru: { loadFailed: 'Не удалось загрузить диалоги', sendFailed: 'Не удалось отправить сообщение', createFailed: 'Не удалось создать диалог', supportFailed: 'Чат поддержки сейчас недоступен', title: 'Оставайтесь в курсе', text: 'Общайтесь с учебной группой, наставником или поддержкой в одном спокойном пространстве.', inbox: 'Входящие', search: 'Начните личный чат...', messageSupport: 'Написать в поддержку', retry: 'Повторить загрузку чата', loading: 'Загрузка диалогов...', empty: 'Диалогов пока нет.', room: '{type} комната', live: 'Онлайн', syncing: 'Синхронизация', start: 'Начните разговор.', write: 'Напишите сообщение...', choose: 'Выберите диалог', chooseText: 'Ваши диалоги появятся здесь.', sent: 'Отправлено', readAll: 'Прочитано всеми', readBy: 'Прочитали: {count}' },
  uz: { loadFailed: 'Suhbatlarni yuklab bo‘lmadi', sendFailed: 'Xabarni yuborib bo‘lmadi', createFailed: 'Suhbat yaratib bo‘lmadi', supportFailed: 'Yordam chati hozircha mavjud emas', title: 'Aloqada qoling', text: 'O‘quv guruhi, mentor yoki yordam jamoasi bilan bitta sokin ish maydonida suhbatlashing.', inbox: 'Kiruvchi xabarlar', search: 'Shaxsiy chat boshlang...', messageSupport: 'Yordamga yozish', retry: 'Chat inbox’ni qayta yuklash', loading: 'Suhbatlar yuklanmoqda...', empty: 'Hali suhbatlar yo‘q.', room: '{type} xona', live: 'Jonli', syncing: 'Sinxronlanmoqda', start: 'Suhbatni boshlang.', write: 'Xabar yozing...', choose: 'Suhbatni tanlang', chooseText: 'Suhbatlaringiz shu yerda ko‘rinadi.', sent: 'Yuborildi', readAll: 'Hamma o‘qidi', readBy: '{count} kishi o‘qidi' },
} as const

const typeLabels = {
  direct: { en: 'Direct', ru: 'Личный', uz: 'Shaxsiy' },
  group: { en: 'Group', ru: 'Группа', uz: 'Guruh' },
  support: { en: 'Support', ru: 'Поддержка', uz: 'Yordam' },
} as const

export default function Chat() {
  const { user } = useAuthStore()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
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
  // Below the lg breakpoint, .chat-layout stacks list and window in one column - without this,
  // opening a conversation on a phone means scrolling past the entire inbox to reach it, and
  // there's no way back to the list short of scrolling back up through the whole thread.
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  const openConversation = (conversationId: string) => {
    setActiveId(conversationId)
    setMobileView('chat')
  }
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
      const message = error.response?.data?.message || ui.loadFailed
      setConversationLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [fetchUnreadSummary, ui.loadFailed])

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
      toast.error(error.response?.data?.message || ui.sendFailed)
    }
  }

  const createDirectConversation = async (participantId: string) => {
    try {
      setCreatingConversation(true)
      const response = await api.post('/chat/conversations', { type: 'direct', participantIds: [participantId] })
      const conversation = response.data.data
      setConversations((current) => current.some((item) => item._id === conversation._id) ? current : [conversation, ...current])
      openConversation(conversation._id)
      setSearch('')
      setSearchResults([])
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.createFailed)
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
      openConversation(conversation._id)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.supportFailed)
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
        label: readByOthers === otherParticipantIds.length ? ui.readAll : ui.readBy.replace('{count}', String(readByOthers)),
        ticks: '✓✓',
        className: 'read',
      }
    }

    return {
      label: ui.sent,
      ticks: '✓',
      className: 'sent',
    }
  }

  return (
    <div className="atlas-page max-w-7xl mx-auto px-4 py-8">
      <div className="atlas-heading mb-8">
        <p className="atlas-kicker">Conversation studio</p>
        <h1>{ui.title}</h1>
        <p>{ui.text}</p>
      </div>
      <div className="chat-layout">
        <aside className={`atlas-panel chat-list ${mobileView === 'chat' ? 'hidden lg:block' : ''}`}>
          <div className="mb-5 flex items-center justify-between">
            <h2>{ui.inbox}</h2><FiMessageCircle className="text-coral" />
          </div>
          <div className="space-y-4">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" aria-hidden="true" />
              <input
                className="input pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={ui.search}
              />
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-2 rounded-2xl bg-[var(--surface-strong)] p-3">
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
              {ui.messageSupport}
            </button>
          </div>
          {conversationLoadError ? (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p>{conversationLoadError}</p>
              <button type="button" className="btn btn-outline w-full" onClick={() => { setLoading(true); loadConversations() }}>
                {ui.retry}
              </button>
            </div>
          ) : loading ? <p className="text-muted">{ui.loading}</p> : conversations.length === 0 ? (
            <div className="empty-state"><FiUsers /><p>{ui.empty}</p></div>
          ) : conversations.map((conversation) => (
            <button key={conversation._id} onClick={() => openConversation(conversation._id)} className={`chat-thread ${activeId === conversation._id ? 'active' : ''}`}>
              <span className="chat-avatar">{conversation.type === 'group' ? <FiUsers /> : <FiMessageCircle />}</span>
              <span className="flex-1"><strong>{getConversationName(conversation)}</strong><small>{typeLabels[conversation.type][language]}</small></span>
              {(conversation.unreadCount || byConversation[conversation._id]) ? <span className="rounded-full bg-coral px-2 py-1 text-xs font-bold text-white">{conversation.unreadCount || byConversation[conversation._id]}</span> : null}
            </button>
          ))}
        </aside>
        <section className={`atlas-panel chat-window ${mobileView === 'list' ? 'hidden lg:block' : ''}`}>
          {active ? <>
            <header className="chat-header">
              <button type="button" className="icon-button lg:hidden" onClick={() => setMobileView('list')} aria-label={ui.inbox}><FiArrowLeft size={20} /></button>
              <div><p className="atlas-kicker">{ui.room.replace('{type}', typeLabels[active.type][language])}</p><h2>{getConversationName(active)}</h2></div><span className="status-dot">{socketConnected ? ui.live : ui.syncing}</span></header>
            <div ref={messageListRef} className="message-list">
              {messages.length === 0 ? <div className="empty-state"><FiMessageCircle /><p>{ui.start}</p></div> : messages.map((message) => {
                const isOwn = message.sender._id ? message.sender._id === user?.id : message.sender.firstName === user?.firstName && message.sender.lastName === user?.lastName
                const receipt = isOwn ? getOwnMessageReceipt(message) : null

                return <article key={message._id} className={`message-bubble ${isOwn ? 'own ml-auto' : ''}`}><strong>{message.sender.firstName} {message.sender.lastName}</strong><p>{message.body}</p><div className="message-meta"><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>{receipt ? <span className={`message-receipt ${receipt.className}`} title={receipt.label} aria-label={receipt.label}>{receipt.ticks}</span> : null}</div></article>
              })}
            </div>
            <form onSubmit={sendMessage} className="chat-compose"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={ui.write} maxLength={4000} /><button className="btn btn-primary" aria-label={ui.write}><FiSend /></button></form>
          </> : <div className="empty-state full"><FiMessageCircle /><h2>{ui.choose}</h2><p>{ui.chooseText}</p></div>}
        </section>
      </div>
    </div>
  )
}
