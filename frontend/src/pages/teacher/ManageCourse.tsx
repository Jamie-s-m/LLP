import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiTrash2, FiPlus, FiEdit3 } from 'react-icons/fi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

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

const copy = {
  en: { loading: 'Loading course...', notFound: 'Course not found.', loadFailed: 'Course could not be loaded', createFailed: 'Lesson could not be created', deleteFailed: 'Lesson could not be deleted', deleteConfirm: 'Delete this lesson?', kicker: 'Course operations', title: 'Manage Course', text: 'Update lesson structure, monitor course inventory, and keep the learning path organized.', lessons: 'Lessons', rating: 'Rating', empty: 'No lessons yet. Add the first one below.', newLesson: 'New lesson title', add: 'Add Lesson' },
  ru: { loading: 'Загрузка курса...', notFound: 'Курс не найден.', loadFailed: 'Не удалось загрузить курс', createFailed: 'Не удалось создать урок', deleteFailed: 'Не удалось удалить урок', deleteConfirm: 'Удалить этот урок?', kicker: 'Операции курса', title: 'Управление курсом', text: 'Обновляйте структуру уроков, отслеживайте наполнение курса и поддерживайте порядок учебного пути.', lessons: 'Уроки', rating: 'Рейтинг', empty: 'Уроков пока нет. Добавьте первый ниже.', newLesson: 'Название нового урока', add: 'Добавить урок' },
  uz: { loading: 'Kurs yuklanmoqda...', notFound: 'Kurs topilmadi.', loadFailed: 'Kursni yuklab bo‘lmadi', createFailed: 'Darsni yaratib bo‘lmadi', deleteFailed: 'Darsni o‘chirib bo‘lmadi', deleteConfirm: 'Bu dars o‘chirilsinmi?', kicker: 'Kurs operatsiyalari', title: 'Kursni boshqarish', text: 'Dars tuzilmasini yangilang, kurs tarkibini kuzating va o‘quv yo‘lini tartibli saqlang.', lessons: 'Darslar', rating: 'Reyting', empty: 'Hali darslar yo‘q. Birinchisini quyida qo‘shing.', newLesson: 'Yangi dars nomi', add: 'Dars qo‘shish' },
} as const

export default function ManageCourse() {
  const { courseId } = useParams()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
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
      .catch(() => toast.error(ui.loadFailed))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [courseId, ui.loadFailed])

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
      toast.error(error.response?.data?.message || ui.createFailed)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm(ui.deleteConfirm)) return
    try {
      await api.delete(`/lessons/${lessonId}`)
      setLessons((current) => current.filter((lesson) => lesson._id !== lessonId))
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.deleteFailed)
    }
  }

  if (loading) {
    return <div className="atlas-page px-4 py-12"><div className="mx-auto max-w-4xl atlas-panel p-6 text-center text-muted">{ui.loading}</div></div>
  }

  if (!course) {
    return <div className="atlas-page px-4 py-12"><div className="mx-auto max-w-4xl atlas-panel p-6 text-center text-muted">{ui.notFound}</div></div>
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="atlas-panel mb-8 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-ink dark:text-white">{course.title}</h2>
            <p className="text-muted">{course.language} • {course.level} • {course.category}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-neutral-200 dark:border-neutral-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">{lessons.length}</p>
              <p className="text-sm text-muted">{ui.lessons}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{course.rating || 0}</p>
              <p className="text-sm text-muted">{ui.rating}</p>
            </div>
          </div>
        </div>

        <h3 className="mb-4 text-2xl font-bold text-ink dark:text-white">{ui.lessons}</h3>
        <div className="space-y-3 mb-6">
          {lessons.length === 0 ? (
            <div className="atlas-panel p-5 text-muted">{ui.empty}</div>
          ) : lessons.map((lesson) => (
            <div key={lesson._id} className="atlas-panel flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0 flex-1 break-words">
                <p className="font-bold text-ink dark:text-white">{lesson.order}. {lesson.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/teacher/lesson/${lesson._id}`} className="flex h-11 w-11 items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg" aria-label="Edit lesson">
                  <FiEdit3 size={20} />
                </Link>
                <button onClick={() => handleDeleteLesson(lesson._id)} className="flex h-11 w-11 items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600" aria-label="Delete lesson">
                  <FiTrash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddLesson} className="atlas-panel flex gap-2 p-4">
          <input
            className="input"
            placeholder={ui.newLesson}
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-outline flex items-center gap-2 whitespace-nowrap">
            <FiPlus size={20} /> {ui.add}
          </button>
        </form>
      </div>
    </div>
  )
}
