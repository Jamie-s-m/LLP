import { useEffect, useState } from 'react'
import { FiBarChart2, FiUsers, FiBook, FiAward } from 'react-icons/fi'
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
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Teacher Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <FiBook className="w-8 h-8 mx-auto mb-2 text-primary-500" />
          <p className="text-3xl font-bold text-primary-500">{overview?.publishedCourses ?? 0}</p>
          <p className="text-neutral-600 dark:text-neutral-400">Published Courses</p>
        </div>
        <div className="card text-center">
          <FiUsers className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
          <p className="text-3xl font-bold text-secondary-500">{overview?.totalStudents ?? 0}</p>
          <p className="text-neutral-600 dark:text-neutral-400">Total Students</p>
        </div>
        <div className="card text-center">
          <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-success" />
          <p className="text-3xl font-bold text-success">{overview?.avgRating ?? 0}</p>
          <p className="text-neutral-600 dark:text-neutral-400">Avg Rating</p>
        </div>
        <div className="card text-center">
          <FiAward className="w-8 h-8 mx-auto mb-2 text-warning" />
          <p className="text-3xl font-bold text-warning">{overview?.totalCourses ?? 0}</p>
          <p className="text-neutral-600 dark:text-neutral-400">Total Courses</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/teacher/create-course" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold mb-2">Create New Course</h3>
          <p className="text-neutral-600 dark:text-neutral-400">Start creating a new language course</p>
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-4">My Courses</h2>
      {loading ? (
        <p>Loading your courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-neutral-500">You haven't created any courses yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Link key={course._id} to={`/teacher/manage/${course._id}`} className="card hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400">{course.language} · {course.level}</p>
              <span className={`inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full ${course.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
