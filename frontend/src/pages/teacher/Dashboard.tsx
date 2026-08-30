import { useEffect, useState } from 'react'
import { FiArrowRight, FiBarChart2, FiBook, FiBookOpen, FiUsers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

interface Overview {
  totalCourses: number
  publishedCourses: number
  totalStudents: number
  avgRating: number
}
interface CourseItem {
  _id: string
  title: string
  language: string
  level: string
  isPublished: boolean
}

const copy = {
  en: { kicker: 'Instructor studio', title: 'Shape lessons with clarity.', text: 'Manage curriculum, review engagement, and keep every class moving with confidence.', createCourse: 'Create a course', openCourses: 'Open my courses', snapshot: 'Teaching snapshot', activeLearners: 'Active learners', averageRating: 'Average rating', publishedCourses: 'Published courses', totalStudents: 'Total students', buildKicker: 'Curriculum build', buildTitle: 'Create a new course', buildText: 'Launch a guided learning path with lessons, flashcards, and exercises.', workspaceKicker: 'Teaching workspace', workspaceTitle: 'Review your course library', workspaceText: 'Open drafts, publish updates, and jump into lesson management.', deskKicker: 'Course desk', deskTitle: 'My courses', viewAll: 'View all', loading: 'Loading your courses...', empty: 'You haven\'t created any courses yet.', published: 'Published', draft: 'Draft' },
  ru: { kicker: 'Студия преподавателя', title: 'Создавайте уроки с ясностью.', text: 'Управляйте программой, анализируйте вовлечённость и уверенно ведите каждый класс.', createCourse: 'Создать курс', openCourses: 'Открыть мои курсы', snapshot: 'Снимок преподавания', activeLearners: 'Активные ученики', averageRating: 'Средний рейтинг', publishedCourses: 'Опубликованные курсы', totalStudents: 'Всего учеников', buildKicker: 'Создание программы', buildTitle: 'Создать новый курс', buildText: 'Запустите структурированный путь обучения с уроками, карточками и упражнениями.', workspaceKicker: 'Преподавательское пространство', workspaceTitle: 'Просмотрите библиотеку курсов', workspaceText: 'Открывайте черновики, публикуйте обновления и переходите к управлению уроками.', deskKicker: 'Курсовой стол', deskTitle: 'Мои курсы', viewAll: 'Смотреть все', loading: 'Загрузка ваших курсов...', empty: 'Вы ещё не создали ни одного курса.', published: 'Опубликован', draft: 'Черновик' },
  uz: { kicker: 'Ustoz studiyasi', title: 'Darslarni ravshanlik bilan yarating.', text: 'Dastur boshqaring, faollikni ko‘rib chiqing va har bir sinfni ishonch bilan oldinga siljiting.', createCourse: 'Kurs yaratish', openCourses: 'Mening kurslarimni ochish', snapshot: 'O‘qitish ko‘rinishi', activeLearners: 'Faol o‘quvchilar', averageRating: 'O‘rtacha reyting', publishedCourses: 'Chop etilgan kurslar', totalStudents: 'Jami talabalar', buildKicker: 'Dastur yaratish', buildTitle: 'Yangi kurs yarating', buildText: 'Darslar, kartochkalar va mashqlar bilan yo‘naltirilgan o‘quv yo‘lini ishga tushiring.', workspaceKicker: 'Ustoz ish maydoni', workspaceTitle: 'Kurs kutubxonangizni ko‘rib chiqing', workspaceText: 'Qoralamalarni oching, yangilanishlarni chop eting va dars boshqaruviga o‘ting.', deskKicker: 'Kurs stoli', deskTitle: 'Mening kurslarim', viewAll: 'Barchasini ko‘rish', loading: 'Kurslaringiz yuklanmoqda...', empty: 'Siz hali hech qanday kurs yaratmagansiz.', published: 'Chop etilgan', draft: 'Qoralama' },
} as const

export default function TeacherDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  useEffect(() => {
    Promise.all([api.get('/courses/mine/overview'), api.get('/courses/mine')])
      .then(([overviewResponse, coursesResponse]) => {
        setOverview(overviewResponse.data.data)
        setCourses(coursesResponse.data.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="atlas-page px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="atlas-hero mb-8">
          <div>
            <p className="atlas-kicker">{ui.kicker}</p>
            <h1>{ui.title}</h1>
            <p>{ui.text}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/teacher/create-course" className="btn btn-primary">{ui.createCourse}</Link>
              <Link to="/teacher/courses" className="btn btn-outline">{ui.openCourses}</Link>
            </div>
          </div>
          <div className="atlas-hero-card">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{ui.snapshot}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <FiUsers className="mb-3 text-xl text-[#a7e8d5]" />
                <strong className="block text-3xl text-white">{overview?.totalStudents ?? 0}</strong>
                <span className="text-sm text-white/80">{ui.activeLearners}</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <FiBarChart2 className="mb-3 text-xl text-[#f8c16c]" />
                <strong className="block text-3xl text-white">{overview?.avgRating ?? 0}</strong>
                <span className="text-sm text-white/80">{ui.averageRating}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="atlas-stat-grid mb-8">
          <div className="atlas-stat"><FiBook /><strong>{overview?.publishedCourses ?? 0}</strong><span>{ui.publishedCourses}</span></div>
          <div className="atlas-stat"><FiUsers /><strong>{overview?.totalStudents ?? 0}</strong><span>{ui.totalStudents}</span></div>
          <div className="atlas-stat"><FiBarChart2 /><strong>{overview?.avgRating ?? 0}</strong><span>{ui.averageRating}</span></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Link to="/teacher/create-course" className="atlas-panel p-6">
            <p className="atlas-kicker">{ui.buildKicker}</p>
            <h2 className="text-2xl text-ink dark:text-white">{ui.buildTitle}</h2>
            <p className="mt-2 text-muted">{ui.buildText}</p>
          </Link>
          <Link to="/teacher/courses" className="atlas-panel p-6">
            <p className="atlas-kicker">{ui.workspaceKicker}</p>
            <h2 className="text-2xl text-ink dark:text-white">{ui.workspaceTitle}</h2>
            <p className="mt-2 text-muted">{ui.workspaceText}</p>
          </Link>
        </div>
        <div className="atlas-panel p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="atlas-kicker">{ui.deskKicker}</p>
              <h2 className="text-2xl text-ink dark:text-white">{ui.deskTitle}</h2>
            </div>
            <Link to="/teacher/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500">
              {ui.viewAll} <FiArrowRight />
            </Link>
          </div>
          {loading ? (
            <p className="text-slate-600 dark:text-slate-300">{ui.loading}</p>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <FiBookOpen />
              <p>{ui.empty}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <Link key={course._id} to={`/teacher/manage/${course._id}`} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5">
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
    </div>
  )
}
