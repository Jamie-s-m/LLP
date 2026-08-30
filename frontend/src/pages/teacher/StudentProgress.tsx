import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBarChart2, FiAward } from 'react-icons/fi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

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

const copy = {
  en: { loading: 'Loading progress...', empty: 'No progress records found for this student in your courses.', loadFailed: 'Progress not found', kicker: 'Learner performance', title: 'Student Progress', text: 'Review learner momentum, course completion, and performance inside your teaching workspace.', student: 'Student', averageCompletion: 'Avg. Completion', points: 'Points', streak: 'Days Streak', courseProgress: 'Course Progress', complete: '{percent}% complete', finished: '— finished' },
  ru: { loading: 'Загрузка прогресса...', empty: 'Для этого ученика в ваших курсах не найдено записей прогресса.', loadFailed: 'Прогресс не найден', kicker: 'Результаты ученика', title: 'Прогресс ученика', text: 'Просматривайте темп ученика, завершение курсов и результаты в преподавательском кабинете.', student: 'Студент', averageCompletion: 'Среднее завершение', points: 'Баллы', streak: 'Дней серии', courseProgress: 'Прогресс по курсам', complete: 'Завершено на {percent}%', finished: '— завершено' },
  uz: { loading: 'Progress yuklanmoqda...', empty: 'Bu talaba uchun sizning kurslaringizda progress yozuvlari topilmadi.', loadFailed: 'Progress topilmadi', kicker: 'O‘quvchi natijalari', title: 'Talaba progressi', text: 'Ustoz ish maydonida o‘quvchining sur’ati, kurs yakunlari va natijalarini ko‘rib chiqing.', student: 'Talaba', averageCompletion: 'O‘rt. yakun', points: 'Ballar', streak: 'Kunlik seriya', courseProgress: 'Kurs progressi', complete: '{percent}% tugallandi', finished: '— tugallangan' },
} as const

export default function StudentProgress() {
  const { studentId } = useParams()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
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
      .catch((error) => toast.error(error.response?.data?.message || ui.loadFailed))
      .finally(() => setLoading(false))
  }, [studentId, ui.loadFailed])

  if (loading) {
    return <div className="atlas-page px-4 py-12"><div className="mx-auto max-w-4xl atlas-panel p-6 text-center text-muted">{ui.loading}</div></div>
  }

  if (!student) {
    return <div className="atlas-page px-4 py-12"><div className="mx-auto max-w-4xl atlas-panel p-6 text-center text-muted">{ui.empty}</div></div>
  }

  const avgCompletion = courses.length > 0
    ? Math.round(courses.reduce((sum, course) => sum + course.progressPercentage, 0) / courses.length)
    : 0

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="atlas-panel mb-8 p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink dark:text-white">{student.firstName} {student.lastName}</h2>
              <p className="text-muted">{ui.student} • {student.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 py-6 border-t border-b border-neutral-200 dark:border-neutral-700 sm:grid-cols-3">
            <div className="text-center">
              <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="text-2xl font-bold">{avgCompletion}%</p>
              <p className="text-sm text-muted">{ui.averageCompletion}</p>
            </div>
            <div className="text-center">
              <FiAward className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
              <p className="text-2xl font-bold">{student.xp ?? 0}</p>
              <p className="text-sm text-muted">{ui.points}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{student.streak ?? 0}</p>
              <p className="text-sm text-muted">{ui.streak}</p>
            </div>
          </div>
        </div>

        <h3 className="mb-4 text-2xl font-bold text-ink dark:text-white">{ui.courseProgress}</h3>
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
                {ui.complete.replace('{percent}', String(course.progressPercentage))} {course.isCompleted ? ui.finished : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
