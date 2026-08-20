import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiBook, FiClock, FiBarChart2 } from 'react-icons/fi'
import { useLearningStore } from '../../store/learningStore'
import { useLanguageStore } from '../../store/languageStore'

const copy = {
  en: {
    kicker: 'Learning workspace',
    title: 'My Learning',
    text: 'Track your progress, review current momentum, and jump back into active courses.',
    activeCourses: 'Active Courses',
    averageProgress: 'Average Progress',
    hoursStudied: 'Hours Studied',
    records: '{count} records',
    desk: 'Course desk',
    enrolled: 'Enrolled Courses',
    loading: 'Loading your learning...',
    empty: 'You are not enrolled in any courses yet.',
    completed: '{count} lessons completed',
    continue: 'Continue Learning',
  },
  ru: {
    kicker: 'Учебное пространство',
    title: 'Моё обучение',
    text: 'Отслеживайте прогресс, текущий темп и быстро возвращайтесь к активным курсам.',
    activeCourses: 'Активные курсы',
    averageProgress: 'Средний прогресс',
    hoursStudied: 'Часов обучения',
    records: '{count} записей',
    desk: 'Курсовой стол',
    enrolled: 'Записанные курсы',
    loading: 'Загрузка обучения...',
    empty: 'Вы пока не записаны ни на один курс.',
    completed: 'Завершено уроков: {count}',
    continue: 'Продолжить обучение',
  },
  uz: {
    kicker: 'O‘quv ish maydoni',
    title: 'Mening o‘qishim',
    text: 'Progressni kuzating, joriy sur’atni ko‘ring va faol kurslarga tez qayting.',
    activeCourses: 'Faol kurslar',
    averageProgress: 'O‘rtacha progress',
    hoursStudied: 'O‘qilgan soatlar',
    records: '{count} yozuv',
    desk: 'Kurs stoli',
    enrolled: 'Yozilgan kurslar',
    loading: 'O‘qishingiz yuklanmoqda...',
    empty: 'Siz hali birorta kursga yozilmagansiz.',
    completed: '{count} ta dars tugallangan',
    continue: 'O‘qishni davom ettirish',
  },
} as const

export default function MyLearning() {
  const { myLearning, fetchMyLearning, isLoading } = useLearningStore()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  useEffect(() => {
    fetchMyLearning()
  }, [fetchMyLearning])

  const averageProgress = myLearning.length > 0
    ? Math.round(myLearning.reduce((sum, item) => sum + item.progressPercentage, 0) / myLearning.length)
    : 0

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="atlas-stat-grid mb-10">
          <div className="atlas-stat text-center">
            <FiBook className="w-8 h-8 mx-auto mb-2 text-primary-500" />
            <p className="text-3xl font-bold text-primary-500">{myLearning.length}</p>
            <p className="text-muted">{ui.activeCourses}</p>
          </div>
          <div className="atlas-stat text-center">
            <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
            <p className="text-3xl font-bold text-secondary-500">
              {averageProgress}%
            </p>
            <p className="text-muted">{ui.averageProgress}</p>
          </div>
          <div className="atlas-stat text-center">
            <FiClock className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold text-success">
              {ui.records.replace('{count}', String(myLearning.length))}
            </p>
            <p className="text-muted">{ui.hoursStudied}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="atlas-kicker">{ui.desk}</p>
          <h2 className="text-2xl text-ink dark:text-white">{ui.enrolled}</h2>
        </div>
        <div className="space-y-6">
          {isLoading ? <div className="atlas-panel p-6 text-muted">{ui.loading}</div> : myLearning.length === 0 ? <div className="atlas-panel p-6 text-muted">{ui.empty}</div> : myLearning.map((record) => {
            const course = record.course
            const courseId = course?._id || course?.id

            return <div key={record._id} className="atlas-panel p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-bold text-ink dark:text-white">{course?.title}</h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="text-sm text-muted">
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
                  <p className="text-sm text-muted">
                    {ui.completed.replace('{count}', String(record.completedLessons.length))} • {record.progressPercentage}%
                  </p>
                </div>
                <Link
                  to={courseId ? `/courses/${courseId}` : '/courses'}
                  className="btn btn-primary whitespace-nowrap"
                >
                  {ui.continue}
                </Link>
              </div>
            </div>
          })}
        </div>
      </div>
    </div>
  )
}
