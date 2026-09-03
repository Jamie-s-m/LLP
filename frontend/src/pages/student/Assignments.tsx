import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiClipboard, FiCheckCircle, FiClock, FiAlertTriangle, FiCalendar } from 'react-icons/fi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

interface Assignment {
  _id: string
  title: string
  description?: string
  course: string
  lesson?: string
  exercise?: string
  dueDate?: string
  completed: boolean
  createdAt: string
}

const copy = {
  en: {
    kicker: 'Coursework',
    title: 'My Assignments',
    text: 'Everything assigned to you directly or through your groups, in one place.',
    loading: 'Loading your assignments...',
    empty: 'No assignments yet',
    emptyDetail: 'When a teacher assigns you a lesson or exercise, it will show up here.',
    loadFailed: 'Could not load your assignments',
    completed: 'Completed',
    notDone: 'Not yet done',
    overdue: 'Overdue',
    due: 'Due {date}',
    openLesson: 'Open lesson',
    openExercise: 'Open exercise',
    reviewLesson: 'Review again',
    reviewExercise: 'Review again',
    viewCourse: 'View course',
  },
  ru: {
    kicker: 'Учёба',
    title: 'Мои задания',
    text: 'Всё, что вам назначено лично или через группу, в одном месте.',
    loading: 'Загрузка ваших заданий...',
    empty: 'Заданий пока нет',
    emptyDetail: 'Когда преподаватель назначит вам урок или упражнение, оно появится здесь.',
    loadFailed: 'Не удалось загрузить задания',
    completed: 'Выполнено',
    notDone: 'Ещё не выполнено',
    overdue: 'Просрочено',
    due: 'Срок: {date}',
    openLesson: 'Открыть урок',
    openExercise: 'Открыть упражнение',
    reviewLesson: 'Повторить снова',
    reviewExercise: 'Повторить снова',
    viewCourse: 'Открыть курс',
  },
  uz: {
    kicker: 'O‘quv topshiriqlari',
    title: 'Mening topshiriqlarim',
    text: 'Sizga to‘g‘ridan-to‘g‘ri yoki guruh orqali berilgan barcha topshiriqlar shu yerda.',
    loading: 'Topshiriqlaringiz yuklanmoqda...',
    empty: 'Hozircha topshiriqlar yo‘q',
    emptyDetail: 'O‘qituvchi sizga dars yoki mashq tayinlaganda, u shu yerda paydo bo‘ladi.',
    loadFailed: 'Topshiriqlarni yuklab bo‘lmadi',
    completed: 'Bajarildi',
    notDone: 'Hali bajarilmagan',
    overdue: 'Muddati o‘tgan',
    due: 'Muddati: {date}',
    openLesson: 'Darsni ochish',
    openExercise: 'Mashqni ochish',
    reviewLesson: 'Qayta ko‘rib chiqish',
    reviewExercise: 'Qayta ko‘rib chiqish',
    viewCourse: 'Kursni ko‘rish',
  },
} as const

export default function Assignments() {
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  // Read once, at render time - used only to flag assignments as overdue, not to drive any
  // interval/refresh. Fine for real user-facing code per the page's own due-date comparisons.
  const now = new Date()

  useEffect(() => {
    api.get('/assignments/mine')
      .then((response) => {
        setAssignments(response.data.data || [])
      })
      .catch((error) => toast.error(error.response?.data?.message || ui.loadFailed))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1

    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  if (loading) {
    return (
      <div className="atlas-page px-4 py-10">
        <div className="mx-auto max-w-5xl atlas-panel p-6 text-center text-muted">{ui.loading}</div>
      </div>
    )
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        {sortedAssignments.length === 0 ? (
          <div className="atlas-panel p-6 text-center">
            <FiClipboard className="w-8 h-8 mx-auto mb-3 text-muted" />
            <p className="font-semibold text-ink dark:text-white">{ui.empty}</p>
            <p className="text-sm text-muted mt-1">{ui.emptyDetail}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAssignments.map((assignment) => {
              const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
              const isOverdue = !assignment.completed && dueDate !== null && dueDate.getTime() < now.getTime()

              const targetPath = assignment.lesson
                ? `/lesson/${assignment.lesson}`
                : assignment.exercise
                  ? `/exercise/${assignment.exercise}`
                  : `/courses/${assignment.course}`

              const ctaLabel = assignment.lesson
                ? (assignment.completed ? ui.reviewLesson : ui.openLesson)
                : assignment.exercise
                  ? (assignment.completed ? ui.reviewExercise : ui.openExercise)
                  : ui.viewCourse

              return (
                <div
                  key={assignment._id}
                  className={`atlas-panel p-6 ${isOverdue ? 'border-2 border-warning' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-ink dark:text-white">{assignment.title}</h3>
                        {assignment.completed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            {ui.completed}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                            <FiClock className="w-3.5 h-3.5" />
                            {ui.notDone}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning text-white px-3 py-1 text-xs font-semibold">
                            <FiAlertTriangle className="w-3.5 h-3.5" />
                            {ui.overdue}
                          </span>
                        )}
                      </div>

                      {assignment.description && (
                        <p className="text-sm text-muted mb-2 whitespace-pre-wrap">{assignment.description}</p>
                      )}

                      {dueDate && (
                        <p className="flex items-center gap-1.5 text-sm text-muted">
                          <FiCalendar className="w-3.5 h-3.5" />
                          {ui.due.replace('{date}', dueDate.toLocaleDateString())}
                        </p>
                      )}
                    </div>

                    <Link
                      to={targetPath}
                      className={`whitespace-nowrap text-center ${assignment.completed ? 'btn btn-outline' : 'btn btn-primary'}`}
                    >
                      {ctaLabel}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
