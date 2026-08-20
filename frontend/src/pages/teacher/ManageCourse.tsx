import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiTrash2, FiPlus } from 'react-icons/fi'
import api from '../../services/api'

interface CourseDetails {
  _id: string
  title: string
  language: string
  level: string
  category: string
  rating: number
}

interface LessonItem {
  _id: string
  title: string
  order: number
  duration?: number
}

export default function ManageCourse() {
  const { courseId } = useParams()
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newLessonTitle, setNewLessonTitle] = useState('')

  const load = () => {
    if (!courseId) return
    setLoading(true)
    api.get(`/courses/${courseId}`)
      .then((response) => {
        setCourse(response.data.data.course)
        setLessons(response.data.data.lessons || [])
      })
      .catch(() => toast.error('Course could not be loaded'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [courseId])

  const handleAddLesson = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newLessonTitle.trim() || !courseId) return
    try {
      await api.post('/lessons', {
        courseId,
        title: newLessonTitle,
        content: 'New lesson content — edit this from the lesson editor.',
        order: lessons.length + 1,
      })
      setNewLessonTitle('')
      load()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lesson could not be created')
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Delete this lesson?')) return
    try {
      await api.delete(`/lessons/${lessonId}`)
      setLessons((current) => current.filter((lesson) => lesson._id !== lessonId))
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lesson could not be deleted')
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading course...</div>
  }

  if (!course) {
    return <div className="p-8 text-center">Course not found.</div>
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Manage Course</h1>

        <div className="card mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
            <p className="text-neutral-600 dark:text-neutral-400">{course.language} • {course.level} • {course.category}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-neutral-200 dark:border-neutral-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">{lessons.length}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{course.rating || 0}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Rating</p>
            </div>
          </div>
        </div>

        {/* Lessons */}
        <h3 className="text-2xl font-bold mb-4">Lessons</h3>
        <div className="space-y-3 mb-6">
          {lessons.length === 0 ? (
            <p className="text-neutral-500">No lessons yet. Add the first one below.</p>
          ) : lessons.map((lesson) => (
            <div key={lesson._id} className="card flex items-center justify-between">
              <div>
                <p className="font-bold">{lesson.order}. {lesson.title}</p>
              </div>
              <button onClick={() => handleDeleteLesson(lesson._id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600">
                <FiTrash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddLesson} className="flex gap-2">
          <input
            className="input"
            placeholder="New lesson title"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-outline flex items-center gap-2 whitespace-nowrap">
            <FiPlus size={20} /> Add Lesson
          </button>
        </form>
      </div>
    </div>
  )
}
