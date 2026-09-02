import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiTrash2, FiPlus, FiEdit3, FiEye, FiEyeOff, FiClipboard, FiBarChart2 } from 'react-icons/fi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

interface CourseDetails {
  _id: string
  title: string
  language: string
  level: string
  category: string
  rating: number
  isPublished: boolean
}

interface LessonItem {
  _id: string
  title: string
  order: number
  duration?: number
}

interface StudentItem {
  studentId: string
  firstName: string
  lastName: string
  email: string
  progressPercentage: number
  isCompleted: boolean
}

const copy = {
  en: { loading: 'Loading course...', notFound: 'Course not found.', loadFailed: 'Course could not be loaded', createFailed: 'Lesson could not be created', deleteFailed: 'Lesson could not be deleted', deleteConfirm: 'Delete this lesson?', kicker: 'Course operations', title: 'Manage Course', text: 'Update lesson structure, monitor course inventory, and keep the learning path organized.', lessons: 'Lessons', rating: 'Rating', empty: 'No lessons yet. Add the first one below.', newLesson: 'New lesson title', add: 'Add Lesson', published: 'Published', draft: 'Draft', publish: 'Publish', unpublish: 'Unpublish', publishFailed: 'Could not update publish status', students: 'Enrolled students', noStudents: 'No students enrolled yet.', viewProgress: 'View progress', assignments: 'Assignments', classAnalytics: 'Class analytics' },
  ru: { loading: 'Загрузка курса...', notFound: 'Курс не найден.', loadFailed: 'Не удалось загрузить курс', createFailed: 'Не удалось создать урок', deleteFailed: 'Не удалось удалить урок', deleteConfirm: 'Удалить этот урок?', kicker: 'Операции курса', title: 'Управление курсом', text: 'Обновляйте структуру уроков, отслеживайте наполнение курса и поддерживайте порядок учебного пути.', lessons: 'Уроки', rating: 'Рейтинг', empty: 'Уроков пока нет. Добавьте первый ниже.', newLesson: 'Название нового урока', add: 'Добавить урок', published: 'Опубликован', draft: 'Черновик', publish: 'Опубликовать', unpublish: 'Снять с публикации', publishFailed: 'Не удалось изменить статус публикации', students: 'Записанные ученики', noStudents: 'Пока нет учеников.', viewProgress: 'Смотреть прогресс', assignments: 'Задания', classAnalytics: 'Аналитика класса' },
  uz: { loading: 'Kurs yuklanmoqda...', notFound: 'Kurs topilmadi.', loadFailed: 'Kursni yuklab bo‘lmadi', createFailed: 'Darsni yaratib bo‘lmadi', deleteFailed: 'Darsni o‘chirib bo‘lmadi', deleteConfirm: 'Bu dars o‘chirilsinmi?', kicker: 'Kurs operatsiyalari', title: 'Kursni boshqarish', text: 'Dars tuzilmasini yangilang, kurs tarkibini kuzating va o‘quv yo‘lini tartibli saqlang.', lessons: 'Darslar', rating: 'Reyting', empty: 'Hali darslar yo‘q. Birinchisini quyida qo‘shing.', newLesson: 'Yangi dars nomi', add: 'Dars qo‘shish', published: 'Chop etilgan', draft: 'Qoralama', publish: 'Chop etish', unpublish: 'Chop etishni bekor qilish', publishFailed: 'Nashr holatini o‘zgartirib bo‘lmadi', students: 'Ro‘yxatdan o‘tgan o‘quvchilar', noStudents: 'Hali o‘quvchilar yo‘q.', viewProgress: 'Progressni ko‘rish', assignments: 'Topshiriqlar', classAnalytics: 'Sinf tahlili' },
} as const

export default function ManageCourse() {
  const { courseId } = useParams()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [togglingPublish, setTogglingPublish] = useState(false)

  const load = () => {
    if (!courseId) return
    setLoading(true)
    Promise.all([
      api.get(`/courses/${courseId}/manage`),
      api.get(`/courses/${courseId}/students`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([courseResponse, studentsResponse]) => {
        setCourse(courseResponse.data.data.course)
        setLessons(courseResponse.data.data.lessons || [])
        setStudents(studentsResponse.data.data || [])
      })
      .catch(() => toast.error(ui.loadFailed))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [courseId, ui.loadFailed])

  const handleTogglePublish = async () => {
    if (!course) return
    setTogglingPublish(true)
    try {
      const response = await api.put(`/courses/${course._id}`, { isPublished: !course.isPublished })
      setCourse(response.data.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.publishFailed)
    } finally {
      setTogglingPublish(false)
    }
  }

  const handleAddLesson = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newLessonTitle.trim() || !courseId) return
    try {
      const nextOrder = lessons.reduce((max, lesson) => Math.max(max, lesson.order || 0), 0) + 1
      await api.post('/lessons', {
        courseId,
        title: newLessonTitle,
        content: 'New lesson content — edit this from the lesson editor.',
        order: nextOrder,
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
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-ink dark:text-white">{course.title}</h2>
              <p className="text-muted">{course.language} • {course.level} • {course.category}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${course.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                {course.isPublished ? ui.published : ui.draft}
              </span>
              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={togglingPublish}
                className="btn btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {course.isPublished ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                {course.isPublished ? ui.unpublish : ui.publish}
              </button>
            </div>
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

        <div className="mb-8 flex flex-wrap gap-3">
          <Link to={`/teacher/course/${courseId}/assignments`} className="btn btn-outline inline-flex items-center gap-2">
            <FiClipboard size={16} />
            {ui.assignments}
          </Link>
          <Link to={`/teacher/course/${courseId}/analytics`} className="btn btn-outline inline-flex items-center gap-2">
            <FiBarChart2 size={16} />
            {ui.classAnalytics}
          </Link>
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

        <h3 className="mb-4 mt-10 text-2xl font-bold text-ink dark:text-white">{ui.students}</h3>
        <div className="space-y-3">
          {students.length === 0 ? (
            <div className="atlas-panel p-5 text-muted">{ui.noStudents}</div>
          ) : students.map((student) => (
            <Link
              key={student.studentId}
              to={`/teacher/progress/${student.studentId}`}
              className="atlas-panel flex flex-wrap items-center justify-between gap-3 p-5 transition hover:-translate-y-0.5"
            >
              <div className="min-w-0 flex-1 break-words">
                <p className="font-bold text-ink dark:text-white">{student.firstName} {student.lastName}</p>
                <p className="text-sm text-muted">{student.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary-500">{student.progressPercentage}%</span>
                <span className="text-sm text-primary-500">{ui.viewProgress}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
