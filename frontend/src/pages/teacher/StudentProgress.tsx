import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBarChart2, FiAward } from 'react-icons/fi'
import api from '../../services/api'

interface StudentInfo {
  firstName: string
  lastName: string
  email: string
  xp: number
  streak: number
}

interface CourseProgress {
  courseId: string
  title: string
  progressPercentage: number
  isCompleted: boolean
}

export default function StudentProgress() {
  const { studentId } = useParams()
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    api.get(`/progress/student/${studentId}`)
      .then((response) => {
        setStudent(response.data.data.student)
        setCourses(response.data.data.courses || [])
      })
      .catch((error) => toast.error(error.response?.data?.message || 'Progress not found'))
      .finally(() => setLoading(false))
  }, [studentId])

  if (loading) {
    return <div className="atlas-page px-4 py-12"><div className="mx-auto max-w-4xl atlas-panel p-6 text-center text-muted">Loading progress...</div></div>
  }

  if (!student) {
    return <div className="atlas-page px-4 py-12"><div className="mx-auto max-w-4xl atlas-panel p-6 text-center text-muted">No progress records found for this student in your courses.</div></div>
  }

  const avgCompletion = courses.length > 0
    ? Math.round(courses.reduce((sum, course) => sum + course.progressPercentage, 0) / courses.length)
    : 0

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">Learner performance</p>
          <h1>Student Progress</h1>
          <p>Review learner momentum, course completion, and performance inside your teaching workspace.</p>
        </div>

        <div className="atlas-panel mb-8 p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink dark:text-white">{student.firstName} {student.lastName}</h2>
              <p className="text-muted">Student • {student.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-neutral-200 dark:border-neutral-700">
            <div className="text-center">
              <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="text-2xl font-bold">{avgCompletion}%</p>
              <p className="text-sm text-muted">Avg. Completion</p>
            </div>
            <div className="text-center">
              <FiAward className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
              <p className="text-2xl font-bold">{student.xp ?? 0}</p>
              <p className="text-sm text-muted">Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{student.streak ?? 0}</p>
              <p className="text-sm text-muted">Days Streak</p>
            </div>
          </div>
        </div>

        <h3 className="mb-4 text-2xl font-bold text-ink dark:text-white">Course Progress</h3>
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.courseId} className="atlas-panel p-5">
              <div className="mb-3">
                <p className="font-bold text-ink dark:text-white">{course.title}</p>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${course.progressPercentage}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted">
                {course.progressPercentage}% complete {course.isCompleted ? '— finished' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
