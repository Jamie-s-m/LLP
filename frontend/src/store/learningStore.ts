import { create } from 'zustand'
import api from '../services/api'
import { demoCourses } from '../data/demoCourses'
import { isDemoFallbackAllowed } from '../utils/runtimeMode'

const isDemoFallbackEnabled = () => isDemoFallbackAllowed()

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
    const fetchedData = response.data?.data || response.data || []
    const nextCourses = Array.isArray(fetchedData) && fetchedData.length > 0 ? fetchedData : []
    set({
      courses: nextCourses,
      isLoading: false,
    })
    if (Array.isArray(fetchedData) && fetchedData.length === 0 && isDemoFallbackEnabled()) {
      console.warn('PRODUCTION_FALLBACK_ATTEMPTED: public course discovery is using the demo catalog in demo/staging mode')
      set({ courses: demoCourses })
    }
  } catch (err: any) {
    if (isDemoFallbackEnabled()) {
      console.warn('PRODUCTION_FALLBACK_ATTEMPTED: API failed; demo/staging fallback is enabled for public course discovery')
      set({
        courses: demoCourses,
        error: err.response?.data?.message || 'Demo mode active: using the local course catalog',
        isLoading: false,
      })
      return
    }

    set({
      courses: [],
      error: 'We\'re having trouble loading courses. Please retry or contact support.',
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