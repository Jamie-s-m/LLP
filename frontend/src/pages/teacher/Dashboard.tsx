import { useEffect, useState } from 'react'
import { FiArrowRight, FiBarChart2, FiBook, FiBookOpen, FiUsers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import api from '../../services/api'

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

export default function TeacherDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)

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
            <p className="atlas-kicker">Instructor studio</p>
            <h1>Shape lessons with clarity.</h1>
            <p>Manage curriculum, review engagement, and keep every class moving with confidence.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/teacher/create-course" className="btn btn-primary">Create a course</Link>
              <Link to="/teacher/courses" className="btn btn-outline border-white/70 text-white hover:bg-white/10 dark:border-white/30 dark:text-white dark:hover:bg-white/10">Open my courses</Link>
            </div>
          </div>
          <div className="atlas-hero-card">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Teaching snapshot</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <FiUsers className="mb-3 text-xl text-[#a7e8d5]" />
                <strong className="block text-3xl text-white">{overview?.totalStudents ?? 0}</strong>
                <span className="text-sm text-white/80">Active learners</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <FiBarChart2 className="mb-3 text-xl text-[#f8c16c]" />
                <strong className="block text-3xl text-white">{overview?.avgRating ?? 0}</strong>
                <span className="text-sm text-white/80">Average rating</span>
              </div>
            </div>
          </div>
        </div>
        <div className="atlas-stat-grid mb-8">
          <div className="atlas-stat"><FiBook /><strong>{overview?.publishedCourses ?? 0}</strong><span>Published courses</span></div>
          <div className="atlas-stat"><FiUsers /><strong>{overview?.totalStudents ?? 0}</strong><span>Total students</span></div>
          <div className="atlas-stat"><FiBarChart2 /><strong>{overview?.avgRating ?? 0}</strong><span>Average rating</span></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Link to="/teacher/create-course" className="atlas-panel p-6">
            <p className="atlas-kicker">Curriculum build</p>
            <h2 className="text-2xl text-ink dark:text-white">Create a new course</h2>
            <p className="mt-2 text-muted">Launch a guided learning path with lessons, flashcards, and exercises.</p>
          </Link>
          <Link to="/teacher/courses" className="atlas-panel p-6">
            <p className="atlas-kicker">Teaching workspace</p>
            <h2 className="text-2xl text-ink dark:text-white">Review your course library</h2>
            <p className="mt-2 text-muted">Open drafts, publish updates, and jump into lesson management.</p>
          </Link>
        </div>
        <div className="atlas-panel p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="atlas-kicker">Course desk</p>
              <h2 className="text-2xl text-ink dark:text-white">My courses</h2>
            </div>
            <Link to="/teacher/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500">
              View all <FiArrowRight />
            </Link>
          </div>
          {loading ? (
            <p className="text-slate-600 dark:text-slate-300">Loading your courses...</p>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <FiBookOpen />
              <p>You haven&apos;t created any courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <Link key={course._id} to={`/teacher/manage/${course._id}`} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5">
                  <h3 className="mb-2 text-xl font-bold text-ink dark:text-white">{course.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">{course.language} · {course.level}</p>
                  <span className={`inline-block mt-3 rounded-full px-3 py-1 text-xs font-semibold ${course.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
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
