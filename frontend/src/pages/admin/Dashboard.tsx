import { FiUsers, FiBook, FiBarChart2, FiTrendingUp } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <FiUsers className="w-8 h-8 mx-auto mb-2 text-primary-500" />
          <p className="text-3xl font-bold text-primary-500">1,245</p>
          <p className="text-neutral-600 dark:text-neutral-400">Total Users</p>
        </div>
        <div className="card text-center">
          <FiBook className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
          <p className="text-3xl font-bold text-secondary-500">42</p>
          <p className="text-neutral-600 dark:text-neutral-400">Published Courses</p>
        </div>
        <div className="card text-center">
          <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-success" />
          <p className="text-3xl font-bold text-success">8,542</p>
          <p className="text-neutral-600 dark:text-neutral-400">Lessons Completed</p>
        </div>
        <div className="card text-center">
          <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-warning" />
          <p className="text-3xl font-bold text-warning">+12%</p>
          <p className="text-neutral-600 dark:text-neutral-400">Growth This Month</p>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/users" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold mb-2">Manage Users</h3>
          <p className="text-neutral-600 dark:text-neutral-400">View and manage platform users</p>
        </Link>
        <Link to="/admin/content" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold mb-2">Manage Content</h3>
          <p className="text-neutral-600 dark:text-neutral-400">Manage courses, lessons, and exercises</p>
        </Link>
      </div>
    </div>
  )
}
