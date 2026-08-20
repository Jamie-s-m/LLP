import { create } from 'zustand'
import api from '../services/api'
import { useAuthStore } from './authStore'

interface ChatUnreadState {
  totalUnread: number
  byConversation: Record<string, number>
  fetchUnreadSummary: () => Promise<void>
  clearConversationUnread: (conversationId: string) => void
}

export const useChatStore = create<ChatUnreadState>((set) => ({
  totalUnread: 0,
  byConversation: {},

  fetchUnreadSummary: async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ totalUnread: 0, byConversation: {} })
      return
    }

    try {
      const response = await api.get('/chat/unread-summary')
      const data = response.data.data || {}
      set({
        totalUnread: data.totalUnread || 0,
        byConversation: data.byConversation || {},
      })
    } catch {
      set({ totalUnread: 0, byConversation: {} })
    }
  },

  clearConversationUnread: (conversationId: string) =>
    set((state) => {
      const unread = state.byConversation[conversationId] || 0
      if (!unread) return state

      const nextByConversation = { ...state.byConversation, [conversationId]: 0 }
      return {
        totalUnread: Math.max(0, state.totalUnread - unread),
        byConversation: nextByConversation,
      }
    }),
}))
