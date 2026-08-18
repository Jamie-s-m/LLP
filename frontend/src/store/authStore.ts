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

// 1. Sanitize the API_URL string: remove trailing slashes, quotes, or accidental whitespace
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_URL = rawApiUrl.replace(/['"]+/g, '').replace(/\/+$|\/+(?=\/)/g, '')

// 2. Create a dedicated Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null

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
        // Use relative routes with the configured baseURL instance
        const response = await api.post('/auth/login', { email, password })

        const user = response.data.data?.user || response.data.user
        const token = response.data.data?.token || response.data.token

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        set({ user, token, isAuthenticated: true, isLoading: false })
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Login failed'
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    register: async (data: any) => {
      set({ isLoading: true, error: null })
      try {
        const response = await api.post('/auth/register', data)
        const payload = response.data.data || response.data
        const user = payload.user
        const token = payload.token

        if (token) {
          localStorage.setItem('token', token)
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        }
        set({ user, token, isAuthenticated: true, isLoading: false })
      } catch (error: any) {
        // Log detailed error from server
        console.error('Registration server response error:', error.response?.data || error)
        const errorMessage = error.response?.data?.message || 'Registration failed'
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