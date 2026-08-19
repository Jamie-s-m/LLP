import { create } from 'zustand'
import api from '../services/api'

export interface Course {
  _id: string
  title: string
  description: string
  language: string
  level: string
  thumbnail?: string
  lessons?: any[]
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
  myLearning: ProgressRecord[]
  isLoading: boolean
  error: string | null
  fetchMyLearning: () => Promise<void>
  enrollInCourse: (courseId: string) => Promise<boolean>
  completeLesson: (courseId: string, lessonId: string) => Promise<boolean>
}

export const useLearningStore = create<LearningState>((set, get) => ({
  myLearning: [],
  isLoading: false,
  error: null,

  fetchMyLearning: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/progress/my-learning')
      if (response.data.success) {
        set({ myLearning: response.data.data, isLoading: false })
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch learning progress',
        isLoading: false,
      })
    }
  },

  enrollInCourse: async (courseId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post(`/progress/enroll/${courseId}`)
      if (response.data.success) {
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

  completeLesson: async (courseId: string, lessonId: string) => {
    try {
      const response = await api.post('/progress/complete-lesson', {
        courseId,
        lessonId,
      })
      if (response.data.success) {
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