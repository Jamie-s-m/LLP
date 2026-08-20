import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLearningStore } from '../store/learningStore'

export default function Home() {
  const { courses, fetchCourses, isLoading } = useLearningStore()

  useEffect(() => {
    fetchCourses({ limit: 6 })
  }, [fetchCourses])

  // Safely fallback to empty array if courses is undefined
  const safeCourses = Array.isArray(courses) ? courses : []

  return (
    <div className="atlas-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="atlas-hero mb-12">
        <div>
          <p className="atlas-kicker">A living atlas for language learners</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          Find your next fluent sentence.
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
          Build vocabulary, complete lessons, and track your progress in real-time.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-8 py-3 text-center font-semibold text-white shadow-lg transition hover:bg-indigo-500"
          >
            Explore All Courses
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-lg border border-white/40 px-8 py-3 text-center font-semibold text-white transition hover:bg-white/10"
          >
            View Pricing
          </Link>
        </div>
        </div>
        <img src={`${import.meta.env.BASE_URL}atlas-study.svg`} alt="Illustration of language learning cards and conversation" />
      </div>

      <div className="atlas-panel mb-12 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="atlas-kicker">Commercial readiness</p>
            <h2 className="text-2xl text-ink dark:text-white">Student, family, and teaching plans</h2>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Choose a plan structure for individual learners, parent-managed study, or teacher-led programs. Billing surfaces are now wired for future payment integration.</p>
          </div>
          <Link to="/pricing" className="btn btn-primary w-full sm:w-auto">Compare plans</Link>
        </div>
      </div>

      {/* Featured Courses Section */}
      <h2 className="mb-6 text-3xl font-bold text-ink">Featured Courses</h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : safeCourses.length === 0 ? (
        <p className="text-slate-400">No courses available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeCourses.slice(0, 6).map((course) => {
            const courseId = course._id || course.id
            return (
              <div
                key={courseId}
                className="atlas-panel rounded-3xl p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-flex rounded-full bg-[#102a43]/10 px-2.5 py-1 text-xs font-semibold text-ink">
                    {course.level || 'All Levels'}
                  </span>
                  <h3 className="mt-3 mb-2 text-xl font-bold text-ink">{course.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                </div>
                <Link
                  to={`/courses/${courseId}`}
                  className="btn btn-primary mt-6 block text-center text-sm font-semibold"
                >
                  View Details
                </Link>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}