import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiBook, FiClock, FiBarChart2 } from 'react-icons/fi'
import { useLearningStore } from '../../store/learningStore'

export default function MyLearning() {
  const { myLearning, fetchMyLearning, isLoading } = useLearningStore()

  useEffect(() => {
    fetchMyLearning()
  }, [fetchMyLearning])

  const averageProgress = myLearning.length > 0
    ? Math.round(myLearning.reduce((sum, item) => sum + item.progressPercentage, 0) / myLearning.length)
    : 0

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">My Learning</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Track your progress and continue learning
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Stats Cards */}
          <div className="card text-center">
            <FiBook className="w-8 h-8 mx-auto mb-2 text-primary-500" />
            <p className="text-3xl font-bold text-primary-500">{myLearning.length}</p>
            <p className="text-neutral-600 dark:text-neutral-400">Active Courses</p>
          </div>
          <div className="card text-center">
            <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
            <p className="text-3xl font-bold text-secondary-500">
              {averageProgress}%
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">Average Progress</p>
          </div>
          <div className="card text-center">
            <FiClock className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold text-success">
              {myLearning.length} records
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">Hours Studied</p>
          </div>
        </div>

        {/* Courses List */}
        <h2 className="text-2xl font-bold mb-6">Enrolled Courses</h2>
        <div className="space-y-6">
          {isLoading ? <p>Loading your learning...</p> : myLearning.length === 0 ? <p className="text-neutral-500">You are not enrolled in any courses yet.</p> : myLearning.map((record) => {
            const course = record.course
            const courseId = course?._id || course?.id

            return <div key={record._id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{course?.title}</h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {course?.language}
                    </span>
                    <span className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                      {course?.level}
                    </span>
                  </div>
                  <div className="w-full max-w-xs bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${record.progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {record.completedLessons.length} lessons completed • {record.progressPercentage}%
                  </p>
                </div>
                <Link
                  to={courseId ? `/courses/${courseId}` : '/courses'}
                  className="btn btn-primary whitespace-nowrap"
                >
                  Continue Learning
                </Link>
              </div>
            </div>
          })}
        </div>
      </div>
    </div>
  )
}
