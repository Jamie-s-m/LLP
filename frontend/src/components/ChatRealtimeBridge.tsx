import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { emitChatMessage, emitConversationRefresh, type LiveChatMessage } from '../utils/chatEvents'

const defaultSocketUrl = import.meta.env.PROD ? 'https://api.linguanest.uz' : 'http://localhost:5000'
const SOCKET_URL = (import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || defaultSocketUrl).replace(/\/+$/, '')

export default function ChatRealtimeBridge() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const {
    fetchUnreadSummary,
    setSocketConnected,
    activeConversationId,
  } = useChatStore()
  const socketRef = useRef<ReturnType<typeof io> | null>(null)
  const activeConversationRef = useRef(activeConversationId)

  useEffect(() => {
    activeConversationRef.current = activeConversationId
    if (activeConversationId) {
      socketRef.current?.emit('conversation:join', activeConversationId)
    }
  }, [activeConversationId])

  useEffect(() => {
    if (!isAuthenticated) {
      setSocketConnected(false)
      socketRef.current = null
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setSocketConnected(false)
      return
    }

    const connection = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = connection

    const showNotification = (message: LiveChatMessage) => {
      const title = `${message.sender.firstName} ${message.sender.lastName}`
      const body = message.body.length > 120 ? `${message.body.slice(0, 117)}...` : message.body

      if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        new Notification(title, {
          body,
          icon: `${import.meta.env.BASE_URL}linguanest-mark.svg`,
        })
        return
      }

      if (document.visibilityState === 'visible') {
        toast(body, { icon: '💬' })
      }
    }

    connection.on('connect', () => {
      setSocketConnected(true)
      if (activeConversationRef.current) {
        connection.emit('conversation:join', activeConversationRef.current)
      }
      fetchUnreadSummary()
    })

    connection.on('disconnect', () => {
      setSocketConnected(false)
    })

    connection.on('message:new', (message: LiveChatMessage) => {
      emitChatMessage(message)
      fetchUnreadSummary()

      const isActiveConversationRef = Boolean(message.conversation && message.conversation === activeConversationRef.current)
      const isOwnMessage =
        message.sender.firstName === user?.firstName &&
        message.sender.lastName === user?.lastName

      if (!isOwnMessage && !isActiveConversationRef) {
        showNotification(message)
      }
    })

    connection.on('conversation:refresh', (detail: { conversationId?: string } = {}) => {
      fetchUnreadSummary()
      emitConversationRefresh(detail)
    })

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadSummary()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityRefresh)
    window.addEventListener('focus', handleVisibilityRefresh)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityRefresh)
      window.removeEventListener('focus', handleVisibilityRefresh)
      setSocketConnected(false)
      socketRef.current = null
      connection.disconnect()
    }
  }, [fetchUnreadSummary, isAuthenticated, setSocketConnected, user?.firstName, user?.lastName])

  return null
}
