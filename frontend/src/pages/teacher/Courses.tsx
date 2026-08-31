import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBookOpen, FiPlus } from 'react-icons/fi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

interface CourseItem {
  _id: string
  title: string
  language: string
  level: string
  isPublished: boolean
}

const copy = {
  en: { kicker: 'Course desk', title: 'My courses', text: 'Every course you own, published and draft alike.', createCourse: 'Create a course', loading: 'Loading your courses...', empty: 'You haven\'t created any courses yet.', published: 'Published', draft: 'Draft', loadFailed: 'Courses could not be loaded' },
  ru: { kicker: 'Курсовой стол', title: 'Мои курсы', text: 'Все ваши курсы — опубликованные и черновики.', createCourse: 'Создать курс', loading: 'Загрузка ваших курсов...', empty: 'Вы ещё не создали ни одного курса.', published: 'Опубликован', draft: 'Черновик', loadFailed: 'Не удалось загрузить курсы' },
  uz: { kicker: 'Kurs stoli', title: 'Mening kurslarim', text: 'Sizga tegishli barcha kurslar — chop etilgan va qoralamalar.', createCourse: 'Kurs yaratish', loading: 'Kurslaringiz yuklanmoqda...', empty: 'Siz hali hech qanday kurs yaratmagansiz.', published: 'Chop etilgan', draft: 'Qoralama', loadFailed: 'Kurslarni yuklab bo‘lmadi' },
} as const

export default function TeacherCourses() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  useEffect(() => {
    api.get('/courses/mine')
      .then((response) => setCourses(response.data.data || []))
      .catch(() => toast.error(ui.loadFailed))
      .finally(() => setLoading(false))
  }, [ui.loadFailed])

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="atlas-heading">
            <p className="atlas-kicker">{ui.kicker}</p>
            <h1>{ui.title}</h1>
            <p>{ui.text}</p>
          </div>
          <Link to="/teacher/create-course" className="btn btn-primary flex items-center gap-2">
            <FiPlus size={20} /> {ui.createCourse}
          </Link>
        </div>

        {loading ? (
          <div className="atlas-panel p-6 text-muted">{ui.loading}</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <FiBookOpen />
            <p>{ui.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Link
                key={course._id}
                to={`/teacher/manage/${course._id}`}
                className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
              >
                <h3 className="mb-2 text-xl font-bold text-ink dark:text-white">{course.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400">{course.language} · {course.level}</p>
                <span className={`inline-block mt-3 rounded-full px-3 py-1 text-xs font-semibold ${course.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                  {course.isPublished ? ui.published : ui.draft}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
