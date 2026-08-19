import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLearningStore } from '../../store/learningStore'

interface Lesson {
  _id: string
  title: string
  content: string
  order: number
  course: string
}

export default function LessonView() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { completeLesson } = useLearningStore()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/lessons/${lessonId}`)
        if (response.data.success) {
          setLesson(response.data.data)
        }
      } catch (err: any) {
        toast.error('Failed to load lesson content')
      } finally {
        setLoading(false)
      }
    }

    if (lessonId) {
      fetchLesson()
    }
  }, [lessonId])

  const handleCompleteLesson = async () => {
    if (!lesson) return

    setSubmitting(true)
    const success = await completeLesson(lesson.course, lesson._id)
    setSubmitting(false)

    if (success) {
      toast.success('🎉 Lesson Completed! +50 XP Earned!')
      navigate('/my-learning')
    } else {
      toast.error('Failed to mark lesson complete.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-300">Lesson not found.</h2>
        <button
          onClick={() => navigate('/my-learning')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
        >
          Back to My Learning
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/my-learning')}
          className="text-slate-400 hover:text-white transition flex items-center gap-2"
        >
          ← Back to Courses
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full border border-indigo-700/50">
          Lesson #{lesson.order || 1}
        </span>
      </div>

      {/* Lesson Container */}
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl mb-8">
        <h1 className="text-2xl font-bold text-white mb-6">{lesson.title}</h1>

        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed mb-8">
          {lesson.content || 'No text content available for this lesson.'}
        </div>

        {/* Complete Action Button */}
        <div className="border-t border-slate-700 pt-6 flex justify-end">
          <button
            onClick={handleCompleteLesson}
            disabled={submitting}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition flex items-center gap-2"
          >
            {submitting ? 'Updating Progress...' : 'Mark as Complete (+50 XP) ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}