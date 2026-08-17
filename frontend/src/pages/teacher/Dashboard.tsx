import { FiBarChart2, FiUsers, FiBook, FiAward } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function TeacherDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Teacher Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <FiBook className="w-8 h-8 mx-auto mb-2 text-primary-500" />
          <p className="text-3xl font-bold text-primary-500">8</p>
          <p className="text-neutral-600 dark:text-neutral-400">Published Courses</p>
        </div>
        <div className="card text-center">
          <FiUsers className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
          <p className="text-3xl font-bold text-secondary-500">342</p>
          <p className="text-neutral-600 dark:text-neutral-400">Total Students</p>
        </div>
        <div className="card text-center">
          <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-success" />
          <p className="text-3xl font-bold text-success">4.8</p>
          <p className="text-neutral-600 dark:text-neutral-400">Avg Rating</p>
        </div>
        <div className="card text-center">
          <FiAward className="w-8 h-8 mx-auto mb-2 text-warning" />
          <p className="text-3xl font-bold text-warning">1,245</p>
          <p className="text-neutral-600 dark:text-neutral-400">Student Points</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/teacher/create-course" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold mb-2">Create New Course</h3>
          <p className="text-neutral-600 dark:text-neutral-400">Start creating a new language course</p>
        </Link>
        <Link to="/teacher/courses" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold mb-2">Manage Courses</h3>
          <p className="text-neutral-600 dark:text-neutral-400">Edit and manage your existing courses</p>
        </Link>
      </div>
    </div>
  )
}
