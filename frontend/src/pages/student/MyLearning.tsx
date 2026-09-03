import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLearningStore } from '../../store/learningStore'
import { useLanguageStore } from '../../store/languageStore'
import { ProgressBar } from '../../components/ui'
import Illustration from '../../components/illustrations/Illustration'
import { courseDomainFor, DOMAIN_META } from '../../utils/courseDomain'

const copy = {
  en: {
    kicker: 'Learning workspace',
    title: 'My Learning',
    text: 'Track your progress, review current momentum, and jump back into active courses.',
    activeCourses: 'Active Courses',
    averageProgress: 'Average Progress',
    lessonsCompleted: 'Lessons Completed',
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
    lessonsCompleted: 'Уроков завершено',
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
    lessonsCompleted: 'Tugallangan darslar',
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
  const totalLessonsCompleted = myLearning.reduce((sum, item) => sum + (item.completedLessons?.length || 0), 0)

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="atlas-panel mb-8 grid grid-cols-3 gap-2 p-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-500">{myLearning.length}</p>
            <p className="text-xs text-muted">{ui.activeCourses}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-secondary-500">{averageProgress}%</p>
            <p className="text-xs text-muted">{ui.averageProgress}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{totalLessonsCompleted}</p>
            <p className="text-xs text-muted">{ui.lessonsCompleted}</p>
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
            const domain = courseDomainFor({ title: course?.title, category: (course as { category?: string } | undefined)?.category })
            const domainMeta = DOMAIN_META[domain]

            return <div key={record._id} className="atlas-panel p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex flex-1 items-start gap-4">
                  <div
                    className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:flex"
                    style={{ background: `color-mix(in srgb, var(${domainMeta.colorVar}) 22%, var(--surface-strong))` }}
                  >
                    <Illustration name={domainMeta.illustration} className="h-10 w-10" />
                  </div>
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
                  <ProgressBar value={record.progressPercentage} className="w-full max-w-xs mb-2" />
                  <p className="text-sm text-muted">
                    {ui.completed.replace('{count}', String(record.completedLessons.length))} • {record.progressPercentage}%
                  </p>
                  </div>
                </div>
                <Link
                  to={courseId ? `/courses/${courseId}` : '/courses'}
                  className="btn btn-primary whitespace-nowrap min-w-[140px] text-center"
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
