import { create } from 'zustand'
import api from '../services/api'
import { useAuthStore } from './authStore'

const UNREAD_SUMMARY_BACKOFF_MS = 5 * 60 * 1000

let unreadSummaryCooldownUntil = 0
let unreadSummaryRequest: Promise<void> | null = null

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

    if (Date.now() < unreadSummaryCooldownUntil) return
    if (unreadSummaryRequest) return unreadSummaryRequest

    unreadSummaryRequest = (async () => {
      try {
        const response = await api.get('/chat/unread-summary')
        unreadSummaryCooldownUntil = 0
        const data = response.data.data || {}
        set({
          totalUnread: data.totalUnread || 0,
          byConversation: data.byConversation || {},
        })
      } catch (error: any) {
        if (error?.response?.status === 429) {
          unreadSummaryCooldownUntil = Date.now() + UNREAD_SUMMARY_BACKOFF_MS
        }
      } finally {
        unreadSummaryRequest = null
      }
    })()

    return unreadSummaryRequest
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
