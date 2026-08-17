import { create } from 'zustand'
import axios from 'axios'

interface Course {
  id: string
  title: string
  description: string
  language: string
  level: string
  category: string
  rating: number
  enrollmentCount: number
  thumbnail?: string
}

interface LearningState {
  courses: Course[]
  enrolledCourses: Course[]
  isLoading: boolean
  error: string | null
  
  fetchCourses: (filters?: any) => Promise<void>
  fetchEnrolledCourses: () => Promise<void>
  enrollCourse: (courseId: string) => Promise<void>
  getProgress: (courseId: string) => Promise<any>
}

export const useLearningStore = create<LearningState>((set) => ({
  courses: [],
  enrolledCourses: [],
  isLoading: false,
  error: null,

  fetchCourses: async (filters?: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/courses`,
        { params: filters }
      )
      set({ courses: response.data.data || [], isLoading: false })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch courses'
      set({ error: errorMessage, isLoading: false })
    }
  },

  fetchEnrolledCourses: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/courses/enrolled`
      )
      set({ enrolledCourses: response.data.data || [], isLoading: false })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch enrolled courses'
      set({ error: errorMessage, isLoading: false })
    }
  },

  enrollCourse: async (courseId: string) => {
    set({ isLoading: true, error: null })
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/courses/${courseId}/enroll`
      )
      set({ isLoading: false })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to enroll in course'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  getProgress: async (courseId: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/progress/course/${courseId}`
      )
      return response.data.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch progress'
      set({ error: errorMessage })
      throw error
    }
  },
}))
