import { create } from 'zustand'
import api from '../services/api'

export interface Course {
  _id: string
  id?: string
  title: string
  description: string
  language: string
  level: string
  thumbnail?: string
  lessons?: any[]
  [key: string]: any
}

export interface ProgressRecord {
  _id: string
  user: string
  course: Course
  completedLessons: string[]
  progressPercentage: number
  isCompleted: boolean
  lastAccessedAt: string
}

interface LearningState {
  courses: Course[]
  myLearning: ProgressRecord[]
  isLoading: boolean
  error: string | null
  fetchCourses: (params?: Record<string, any>) => Promise<void>
  fetchMyLearning: () => Promise<void>
  enrollInCourse: (courseId: string) => Promise<boolean>
  completeLesson: (courseId: string, lessonId: string) => Promise<boolean>
}

export const useLearningStore = create<LearningState>((set, get) => ({
  courses: [],
  myLearning: [],
  isLoading: false,
  error: null,

  // Fetch all available courses with optional query filters like limit or search
  fetchCourses: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/courses', { params })
      if (response.data?.success) {
        set({ courses: response.data.data, isLoading: false })
      } else {
        set({ courses: response.data || [], isLoading: false })
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch courses',
        isLoading: false,
      })
    }
  },

  // Fetch enrolled courses and progress
  fetchMyLearning: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/progress/my-learning')
      if (response.data?.success) {
        set({ myLearning: response.data.data, isLoading: false })
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch learning progress',
        isLoading: false,
      })
    }
  },

  // Enroll in a new course
  enrollInCourse: async (courseId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post(`/progress/enroll/${courseId}`)
      if (response.data?.success) {
        await get().fetchMyLearning()
        set({ isLoading: false })
        return true
      }
      return false
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Enrollment failed',
        isLoading: false,
      })
      return false
    }
  },

  // Mark lesson complete and trigger XP update
  completeLesson: async (courseId: string, lessonId: string) => {
    try {
      const response = await api.post('/progress/complete-lesson', {
        courseId,
        lessonId,
      })
      if (response.data?.success) {
        await get().fetchMyLearning()
        return true
      }
      return false
    } catch (err: any) {
      console.error('Failed to update lesson progress:', err)
      return false
    }
  },
}))