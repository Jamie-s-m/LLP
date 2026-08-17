import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBook, FiClock, FiBarChart2 } from 'react-icons/fi'

export default function MyLearning() {
  const [enrolledCourses] = useState([
    {
      id: 1,
      title: 'English Fundamentals',
      language: 'English',
      level: 'Beginner',
      progress: 45,
      lessonsCompleted: 5,
      totalLessons: 12,
      hoursSpent: 8.5,
    },
    {
      id: 2,
      title: 'Spanish for Travelers',
      language: 'Spanish',
      level: 'Intermediate',
      progress: 28,
      lessonsCompleted: 3,
      totalLessons: 15,
      hoursSpent: 4.2,
    },
  ])

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
            <p className="text-3xl font-bold text-primary-500">{enrolledCourses.length}</p>
            <p className="text-neutral-600 dark:text-neutral-400">Active Courses</p>
          </div>
          <div className="card text-center">
            <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
            <p className="text-3xl font-bold text-secondary-500">
              {Math.round(enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / enrolledCourses.length)}%
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">Average Progress</p>
          </div>
          <div className="card text-center">
            <FiClock className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold text-success">
              {enrolledCourses.reduce((sum, c) => sum + c.hoursSpent, 0).toFixed(1)}h
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">Hours Studied</p>
          </div>
        </div>

        {/* Courses List */}
        <h2 className="text-2xl font-bold mb-6">Enrolled Courses</h2>
        <div className="space-y-6">
          {enrolledCourses.map((course) => (
            <div key={course.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {course.language}
                    </span>
                    <span className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                      {course.level}
                    </span>
                  </div>
                  <div className="w-full max-w-xs bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {course.lessonsCompleted}/{course.totalLessons} lessons • {course.hoursSpent}h
                  </p>
                </div>
                <Link
                  to={`/lesson/${course.id}`}
                  className="btn btn-primary whitespace-nowrap"
                >
                  Continue Learning
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
