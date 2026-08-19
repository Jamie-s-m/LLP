import { create } from 'zustand'
import { api } from './authStore'

export interface Course {
  id: string
  _id?: string
  title: string
  description: string
  language: string
  level: string
  thumbnail?: string
}

export interface FetchCoursesParams {
  limit?: number
  language?: string
  level?: string
  search?: string
  [key: string]: any
}

interface LearningState {
  courses: Course[]
  isLoading: boolean
  error: string | null
  fetchCourses: (params?: FetchCoursesParams) => Promise<void>
}

export const useLearningStore = create<LearningState>((set) => ({
  courses: [],
  isLoading: false,
  error: null,

  fetchCourses: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/courses', { params })
      const coursesData = response.data.data || response.data || []
      
      const formattedCourses = Array.isArray(coursesData)
        ? coursesData.map((c: any) => ({ ...c, id: c.id || c._id }))
        : []

      set({ courses: formattedCourses, isLoading: false })
    } catch (error: any) {
      console.warn('Could not fetch courses:', error.message)
      set({ 
        error: error.response?.data?.message || 'Failed to fetch courses', 
        isLoading: false 
      })
    }
  },
}))