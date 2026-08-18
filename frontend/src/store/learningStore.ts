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

interface LearningState {
  courses: Course[]
  isLoading: boolean
  error: string | null
  fetchCourses: (params?: { limit?: number }) => Promise<void>
}

export const useLearningStore = create<LearningState>((set) => ({
  courses: [],
  isLoading: false,
  error: null,

  fetchCourses: async (params) => {
    set({ isLoading: true, error: null })
    try {
      // Calls relative endpoint '/courses' via the base API client (https://.../api/courses)
      const response = await api.get('/courses', { params })
      const coursesData = response.data.data || response.data || []
      
      // Map _id to id if MongoDB returned _id
      const formattedCourses = Array.isArray(coursesData)
        ? coursesData.map((c: any) => ({ ...c, id: c.id || c._id }))
        : []

      set({ courses: formattedCourses, isLoading: false })
    } catch (error: any) {
      console.warn('Failed to load courses from API:', error.message)
      set({ 
        error: error.response?.data?.message || 'Failed to fetch courses', 
        isLoading: false 
      })
    }
  },
}))