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
        <Link
          to="/courses"
          className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg transition"
        >
          Explore All Courses
        </Link>
        </div>
        <img src={`${import.meta.env.BASE_URL}atlas-study.svg`} alt="Illustration of language learning cards and conversation" />
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