import { create } from 'zustand'
import api from '../services/api'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'student' | 'teacher' | 'parent' | 'moderator' | 'admin'
  avatar?: string
  nativeLanguage?: string
  targetLanguages?: string[]
  xp?: number
  level?: number
  streak?: number
  linguaCoins?: number
  hearts?: number
  maxHearts?: number
  placementLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | null
  learningGoal?: 'job' | 'it' | 'abroad' | 'study' | 'confidence' | 'other' | null
  selfAssessedLevel?: 'beginner' | 'basic' | 'intermediate' | 'advanced' | 'not_sure' | null
  dailyGoalMinutes?: 10 | 15 | 30 | 60 | null
  onboardingCompletedAt?: string | null
  teacherApplicationStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  isEmailVerified?: boolean
  billing?: {
    plan: 'none' | 'local' | 'learner' | 'family' | 'teaching'
    status: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired'
    provider?: 'none' | 'stripe' | 'payme'
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
  }
  moderatorPermissions?: {
    communityModeration: boolean
    supportChat: boolean
    catalogContentQa: boolean
    limitedUserManagement: boolean
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<any>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

export { api }

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  let user = null

  if (userStr) {
    try {
      user = JSON.parse(userStr)
    } catch {
      localStorage.removeItem('user')
    }
  }

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await api.post('/auth/login', { email, password })
        const userPayload = response.data.data?.user || response.data.user
        const tokenPayload = response.data.data?.token || response.data.token

        localStorage.setItem('token', tokenPayload)
        localStorage.setItem('user', JSON.stringify(userPayload))

        set({ user: userPayload, token: tokenPayload, isAuthenticated: true, isLoading: false })
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || 'Login failed'
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    register: async (data: any) => {
      set({ isLoading: true, error: null })
      try {
        const response = await api.post('/auth/register', data)
        const payload = response.data.data || response.data
        const userPayload = payload?.user
        const tokenPayload = payload?.token

        if (tokenPayload) {
          localStorage.setItem('token', tokenPayload)
        }
        if (userPayload) {
          localStorage.setItem('user', JSON.stringify(userPayload))
        }

        set({
          user: userPayload || null,
          token: tokenPayload || null,
          isAuthenticated: !!tokenPayload && !!userPayload,
          isLoading: false,
        })
        return payload
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || 'Registration failed'
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ user: null, token: null, isAuthenticated: false, error: null })
    },

    setUser: (user) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
      set({ user })
    },

    setToken: (token) => {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
      set({ token, isAuthenticated: !!token })
    },
  }
})
