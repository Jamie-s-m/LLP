import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLearningStore } from '../store/learningStore'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

interface CourseDetails {
  _id: string
  title: string
  description: string
  language: string
  level: string
  category: string
}

interface LessonSummary {
  _id: string
  title: string
  order: number
  duration?: number
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enrollInCourse, myLearning } = useLearningStore()
  const { isAuthenticated } = useAuthStore()
  const [enrolling, setEnrolling] = useState(false)
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const loadCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`)
        const payload = response.data.data || response.data
        setCourse(payload.course)
        setLessons(payload.lessons || [])
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Unable to load course')
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [id])

  // Check if student is already enrolled in this course
  const isEnrolled = myLearning.some(
    (item) => item.course?._id === id || (item.course as any) === id
  )

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll in this course.')
      navigate('/login')
      return
    }

    if (!id) return

    setEnrolling(true)
    const success = await enrollInCourse(id)
    setEnrolling(false)

    if (success) {
      toast.success('Successfully enrolled!')
      navigate('/my-learning')
    } else {
      toast.error('Enrollment failed or already enrolled.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {loading ? <p>Loading course...</p> : null}
      {!loading && !course ? <p>Course not found.</p> : null}
      {course ? <h1 className="text-3xl font-bold text-white mb-4">{course.title}</h1> : null}
      {/* Course metadata card */}
      {course ? <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
        <div className="flex flex-wrap gap-2 text-sm text-slate-300 mb-4">
          <span>{course.language}</span>
          <span>{course.level}</span>
          <span>{course.category}</span>
        </div>
        <p className="text-slate-300 mb-6">{course.description}</p>

        <h2 className="text-xl font-semibold text-white mb-3">Lessons</h2>
        {lessons.length > 0 ? <div className="space-y-2 mb-6">
          {lessons.map((lesson) => (
            <button
              key={lesson._id}
              onClick={() => navigate(`/lesson/${lesson._id}`)}
              className="w-full text-left p-3 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-100"
            >
              {lesson.order}. {lesson.title}
            </button>
          ))}
        </div> : <p className="text-slate-400 mb-6">Lessons will appear here when the mentor publishes them.</p>}

        {isEnrolled ? (
          <button
            onClick={() => navigate('/my-learning')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition"
          >
            Continue Learning
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {enrolling ? 'Enrolling...' : 'Enroll in Course'}
          </button>
        )}
      </div> : null}
    </div>
  )
}