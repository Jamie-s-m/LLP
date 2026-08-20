import { useEffect, useState } from 'react'
import { FiClock } from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

interface Summary {
  totalCourses: number
  completedCourses: number
  totalXp: number
  streak: number
}
export default function Dashboard() {
  const { user } = useAuthStore()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/dashboard-summary')
      .then((response) => setSummary(response.data.data))
      .finally(() => setLoading(false))
  }, [])

  const progressPercent = summary && summary.totalCourses > 0
    ? Math.round((summary.completedCourses / summary.totalCourses) * 100)
    : 0

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Student Dashboard</h1>
      {user?.teacherApplicationStatus === 'pending' && (
        <div className="mb-8 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-amber-700 dark:text-amber-300">
          <FiClock size={20} />
          <p>Your application to teach on LinguaNest is pending admin review.</p>
        </div>
      )}
      {loading ? (
        <p>Loading your progress...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-bold text-primary-500">{summary?.totalXp ?? 0}</p>
            <p className="text-neutral-600 dark:text-neutral-400">Total Points</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-secondary-500">{summary?.streak ?? 0}</p>
            <p className="text-neutral-600 dark:text-neutral-400">Current Streak</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-success">{summary?.totalCourses ?? 0}</p>
            <p className="text-neutral-600 dark:text-neutral-400">Enrolled Courses</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-warning">{progressPercent}%</p>
            <p className="text-neutral-600 dark:text-neutral-400">Overall Progress</p>
          </div>
        </div>
      )}
    </div>
  )
}
