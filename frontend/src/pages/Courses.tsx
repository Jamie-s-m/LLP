import { useLearningStore } from '../store/learningStore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Courses() {
  const { courses, fetchCourses, isLoading } = useLearningStore()
  const [filters, setFilters] = useState({ language: '', level: '' })

  useEffect(() => {
    fetchCourses(filters)
  }, [filters])

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Explore Courses</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="label">Language</label>
            <select
              className="input"
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Turkish">Turkish</option>
              <option value="Russian">Russian</option>
              <option value="Uzbek">Uzbek</option>
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select
              className="input"
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">Loading...</div>
          ) : courses.length > 0 ? (
            courses.map((course) => {
              const courseId = course._id || course.id

              return (
              <Link
                key={courseId}
                to={`/courses/${courseId}`}
                className="card hover:shadow-xl transition-shadow"
              >
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-40 object-cover rounded mb-4"
                  />
                )}
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-primary-500 font-semibold">{course.language}</span>
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm">
                    {course.level}
                  </span>
                </div>
              </Link>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12 text-neutral-500">
              No courses found. Try adjusting your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
