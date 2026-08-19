import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiMessageCircle, FiSend, FiUsers } from 'react-icons/fi'
import { io, Socket } from 'socket.io-client'
import api from '../services/api'

interface Conversation {
  _id: string
  type: 'direct' | 'group' | 'support'
  name?: string
  participants: Array<{ _id: string; firstName: string; lastName: string; role: string }>
}

interface Message {
  _id: string
  body: string
  createdAt: string
  sender: { firstName: string; lastName: string }
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeId, setActiveId] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)

  const loadConversations = async () => {
    try {
      const response = await api.get('/chat/conversations')
      const data = response.data.data || []
      setConversations(data)
      if (!activeId && data[0]) setActiveId(data[0]._id)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load conversations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
    const token = localStorage.getItem('token')
    if (!token) return
    const connection = io(import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000', { auth: { token } })
    connection.on('message:new', (message: Message) => setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]))
    setSocket(connection)
    return () => { connection.disconnect() }
  }, [])

  useEffect(() => {
    if (!activeId) return
    const loadMessages = () => api.get(`/chat/conversations/${activeId}/messages`).then((response) => setMessages(response.data.data || [])).catch(() => undefined)
    loadMessages()
    socket?.emit('conversation:join', activeId)
    const timer = window.setInterval(loadMessages, 5000)
    return () => window.clearInterval(timer)
  }, [activeId, socket])

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || !activeId) return

    try {
      if (socket?.connected) {
        socket.emit('message:send', { conversationId: activeId, body: draft })
      } else {
        const response = await api.post(`/chat/conversations/${activeId}/messages`, { body: draft })
        setMessages((current) => [...current, response.data.data])
      }
      setDraft('')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Message could not be sent')
    }
  }

  const active = conversations.find((conversation) => conversation._id === activeId)

  return (
    <div className="atlas-page max-w-7xl mx-auto px-4 py-8">
      <div className="atlas-heading mb-8">
        <p className="atlas-kicker">Conversation studio</p>
        <h1>Stay in the loop</h1>
        <p>Talk with your study circle, mentor, or support team in one calm workspace.</p>
      </div>
      <div className="chat-layout">
        <aside className="atlas-panel chat-list">
          <div className="flex items-center justify-between mb-5">
            <h2>Inbox</h2><FiMessageCircle className="text-coral" />
          </div>
          {loading ? <p className="text-muted">Loading conversations...</p> : conversations.length === 0 ? (
            <div className="empty-state"><FiUsers /><p>No conversations yet.</p></div>
          ) : conversations.map((conversation) => (
            <button key={conversation._id} onClick={() => setActiveId(conversation._id)} className={`chat-thread ${activeId === conversation._id ? 'active' : ''}`}>
              <span className="chat-avatar">{conversation.type === 'group' ? <FiUsers /> : <FiMessageCircle />}</span>
              <span><strong>{conversation.name || conversation.participants.map((person) => person.firstName).join(', ')}</strong><small>{conversation.type}</small></span>
            </button>
          ))}
        </aside>
        <section className="atlas-panel chat-window">
          {active ? <>
            <header className="chat-header"><div><p className="atlas-kicker">{active.type} room</p><h2>{active.name || active.participants.map((person) => person.firstName).join(', ')}</h2></div><span className="status-dot">Live</span></header>
            <div className="message-list">
              {messages.length === 0 ? <div className="empty-state"><FiMessageCircle /><p>Start the conversation.</p></div> : messages.map((message) => <article key={message._id} className="message-bubble"><strong>{message.sender.firstName} {message.sender.lastName}</strong><p>{message.body}</p><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></article>)}
            </div>
            <form onSubmit={sendMessage} className="chat-compose"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." maxLength={4000} /><button className="btn btn-primary" aria-label="Send message"><FiSend /></button></form>
          </> : <div className="empty-state full"><FiMessageCircle /><h2>Choose a conversation</h2><p>Your conversations will appear here.</p></div>}
        </section>
      </div>
    </div>
  )
}
