import { create } from 'zustand'
import axios from 'axios'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  avatar?: string
  nativeLanguage?: string
  targetLanguages?: string[]
  totalPoints?: number
  currentStreak?: number
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

// Clean and format API URL string safely
const getSanitizedApiUrl = (): string => {
  let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  
  // Remove brackets [], quotes '', "", parentheses (), and whitespace
  rawUrl = rawUrl.replace(/[\[\]'"\(\)\s]+/g, '').trim()

  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`
  }

  // Remove trailing slashes
  rawUrl = rawUrl.replace(/\/+$/, '')

  // Ensure /api suffix exists
  if (!rawUrl.endsWith('/api')) {
    rawUrl = `${rawUrl}/api`
  }

  return rawUrl
}

const API_URL = getSanitizedApiUrl()

export const api = axios.create({
  baseURL: API_URL,
  timeout: 45000, // 45s timeout for Render free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
})

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

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
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
        api.defaults.headers.common['Authorization'] = `Bearer ${tokenPayload}`

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
          api.defaults.headers.common['Authorization'] = `Bearer ${tokenPayload}`
        }
        if (userPayload) {
          localStorage.setItem('user', JSON.stringify(userPayload))
        }

        set({ user: userPayload, token: tokenPayload, isAuthenticated: true, isLoading: false })
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
      delete api.defaults.headers.common['Authorization']
      set({ user: null, token: null, isAuthenticated: false, error: null })
    },

    setUser: (user) => set({ user }),

    setToken: (token) => {
      if (token) {
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      }
      set({ token, isAuthenticated: !!token })
    },
  }
})