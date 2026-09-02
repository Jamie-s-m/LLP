import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiUsers, FiBarChart2, FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

type Skill = 'listening' | 'speaking' | 'reading' | 'writing' | 'vocabulary' | 'grammar'
type MasteryState = 'not_started' | 'introduced' | 'practicing' | 'developing' | 'proficient' | 'mastered' | 'needs_review'

interface SkillMasteryEntry {
  skill: Skill
  attemptCount: number
  totalExercises: number
  state: MasteryState
}

interface StudentAnalytics {
  studentId: string
  name: string
  completionPercentage: number
  isCompleted: boolean
  skillMastery: SkillMasteryEntry[]
  weakSkillCount: number
}

interface ClassAnalyticsData {
  courseId: string
  courseTitle: string
  studentCount: number
  classAverageCompletion: number
  students: StudentAnalytics[]
}

const copy = {
  en: {
    loading: 'Loading class analytics...',
    kicker: 'Class analytics',
    text: 'See who is on track and who needs a nudge, at a glance.',
    studentCount: 'Students',
    classAverage: 'Class average completion',
    empty: 'No students are enrolled in this course yet.',
    forbidden: 'You do not manage this course, so its analytics are not available to you.',
    notFound: 'This course could not be found.',
    loadFailed: 'Could not load class analytics',
    colStudent: 'Student',
    colCompletion: 'Completion',
    colStatus: 'Status',
    colSkills: 'Skill mastery',
    colWeakSkills: 'Attention',
    completed: 'Completed',
    inProgress: 'In progress',
    weakSkills: '{count} skills need attention',
    weakSkill: '1 skill needs attention',
    onTrack: 'On track',
    noSkillData: 'No skill data yet',
  },
  ru: {
    loading: 'Загрузка аналитики класса...',
    kicker: 'Аналитика класса',
    text: 'Сразу видно, кто идёт по плану, а кому нужна помощь.',
    studentCount: 'Учеников',
    classAverage: 'Среднее завершение по классу',
    empty: 'На этот курс пока не записан ни один ученик.',
    forbidden: 'Вы не управляете этим курсом, поэтому его аналитика вам недоступна.',
    notFound: 'Этот курс не найден.',
    loadFailed: 'Не удалось загрузить аналитику класса',
    colStudent: 'Ученик',
    colCompletion: 'Завершение',
    colStatus: 'Статус',
    colSkills: 'Освоение навыков',
    colWeakSkills: 'Внимание',
    completed: 'Завершено',
    inProgress: 'В процессе',
    weakSkills: '{count} навыков требуют внимания',
    weakSkill: '1 навык требует внимания',
    onTrack: 'Всё в порядке',
    noSkillData: 'Пока нет данных по навыкам',
  },
  uz: {
    loading: 'Sinf tahlili yuklanmoqda...',
    kicker: 'Sinf tahlili',
    text: 'Kim rejaga muvofiq ketayotganini, kimga yordam kerakligini bir qarashda ko‘ring.',
    studentCount: 'Talabalar',
    classAverage: 'Sinfning o‘rtacha yakuni',
    empty: 'Bu kursga hali birorta talaba yozilmagan.',
    forbidden: 'Siz bu kursni boshqarmaysiz, shuning uchun uning tahlili sizga mavjud emas.',
    notFound: 'Bu kurs topilmadi.',
    loadFailed: 'Sinf tahlilini yuklab bo‘lmadi',
    colStudent: 'Talaba',
    colCompletion: 'Yakun',
    colStatus: 'Holat',
    colSkills: 'Ko‘nikmalar darajasi',
    colWeakSkills: 'Diqqat talab qiladi',
    completed: 'Tugallangan',
    inProgress: 'Davom etmoqda',
    weakSkills: '{count} ta ko‘nikma e’tibor talab qiladi',
    weakSkill: '1 ta ko‘nikma e’tibor talab qiladi',
    onTrack: 'Hammasi joyida',
    noSkillData: 'Ko‘nikmalar bo‘yicha ma’lumot yo‘q',
  },
} as const

const skillLabels: Record<Skill, { en: string; ru: string; uz: string }> = {
  listening: { en: 'Listening', ru: 'Аудирование', uz: 'Tinglab tushunish' },
  speaking: { en: 'Speaking', ru: 'Говорение', uz: 'Gapirish' },
  reading: { en: 'Reading', ru: 'Чтение', uz: 'O‘qish' },
  writing: { en: 'Writing', ru: 'Письмо', uz: 'Yozish' },
  vocabulary: { en: 'Vocabulary', ru: 'Словарный запас', uz: 'Lug‘at' },
  grammar: { en: 'Grammar', ru: 'Грамматика', uz: 'Grammatika' },
}

const masteryStateLabels: Record<MasteryState, { en: string; ru: string; uz: string }> = {
  not_started: { en: 'Not started', ru: 'Не начато', uz: 'Boshlanmagan' },
  introduced: { en: 'Introduced', ru: 'Знакомство', uz: 'Tanishtirilgan' },
  practicing: { en: 'Practicing', ru: 'Практика', uz: 'Mashq qilinmoqda' },
  developing: { en: 'Developing', ru: 'В развитии', uz: 'Rivojlanmoqda' },
  proficient: { en: 'Proficient', ru: 'Уверенно', uz: 'Yaxshi egallagan' },
  mastered: { en: 'Mastered', ru: 'Освоено', uz: 'Mukammal egallagan' },
  needs_review: { en: 'Needs review', ru: 'Нужен повтор', uz: 'Takrorlash kerak' },
}

// Skill-pill color by mastery state - green for solid mastery, amber for still-building,
// red for the one state that flags active regression, neutral for not-yet-started.
const stateBadgeClasses: Record<MasteryState, string> = {
  not_started: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  introduced: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  practicing: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  developing: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  proficient: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  mastered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  needs_review: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
}

type ErrorKind = 'forbidden' | 'notFound' | 'generic' | null

export default function ClassAnalytics() {
  const { courseId } = useParams()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [data, setData] = useState<ClassAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorKind, setErrorKind] = useState<ErrorKind>(null)

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    setErrorKind(null)
    api.get(`/progress/class-analytics/${courseId}`)
      .then((response) => {
        setData(response.data.data)
      })
      .catch((error) => {
        const status = error.response?.status
        toast.error(error.response?.data?.message || ui.loadFailed)
        if (status === 403) setErrorKind('forbidden')
        else if (status === 404) setErrorKind('notFound')
        else setErrorKind('generic')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const sortedStudents = useMemo(() => {
    if (!data) return []
    return [...data.students].sort((a, b) => {
      if (b.weakSkillCount !== a.weakSkillCount) return b.weakSkillCount - a.weakSkillCount
      return a.completionPercentage - b.completionPercentage
    })
  }, [data])

  if (loading) {
    return (
      <div className="atlas-page px-4 py-10">
        <div className="mx-auto max-w-5xl atlas-panel p-6 text-center text-muted">{ui.loading}</div>
      </div>
    )
  }

  if (errorKind === 'forbidden' || errorKind === 'notFound' || errorKind === 'generic' || !data) {
    const message = errorKind === 'forbidden' ? ui.forbidden : errorKind === 'notFound' ? ui.notFound : ui.loadFailed
    return (
      <div className="atlas-page px-4 py-10">
        <div className="mx-auto max-w-5xl atlas-panel p-6 text-center text-muted">
          <FiAlertTriangle className="mx-auto mb-3 h-8 w-8 text-warning" />
          {message}
        </div>
      </div>
    )
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{data.courseTitle}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="atlas-panel p-6 text-center">
            <FiUsers className="mx-auto mb-2 h-8 w-8 text-primary-500" />
            <p className="text-2xl font-bold text-ink dark:text-white">{data.studentCount}</p>
            <p className="text-sm text-muted">{ui.studentCount}</p>
          </div>
          <div className="atlas-panel p-6 text-center">
            <FiBarChart2 className="mx-auto mb-2 h-8 w-8 text-secondary-500" />
            <p className="text-2xl font-bold text-ink dark:text-white">{data.classAverageCompletion}%</p>
            <p className="text-sm text-muted">{ui.classAverage}</p>
          </div>
        </div>

        {data.studentCount === 0 ? (
          <div className="atlas-panel p-6 text-center text-muted">{ui.empty}</div>
        ) : (
          <div className="atlas-panel overflow-x-auto p-6">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="py-2 pr-4 font-semibold text-ink dark:text-white">{ui.colStudent}</th>
                  <th className="py-2 pr-4 font-semibold text-ink dark:text-white">{ui.colCompletion}</th>
                  <th className="py-2 pr-4 font-semibold text-ink dark:text-white">{ui.colStatus}</th>
                  <th className="py-2 pr-4 font-semibold text-ink dark:text-white">{ui.colSkills}</th>
                  <th className="py-2 pr-4 font-semibold text-ink dark:text-white">{ui.colWeakSkills}</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student) => {
                  const visibleSkills = student.skillMastery.filter((entry) => entry.totalExercises > 0)
                  return (
                    <tr key={student.studentId} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                      <td className="py-3 pr-4 font-medium text-ink dark:text-white">{student.name}</td>
                      <td className="py-3 pr-4 text-muted">{student.completionPercentage}%</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            student.isCompleted
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          {student.isCompleted ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiClock className="h-3.5 w-3.5" />}
                          {student.isCompleted ? ui.completed : ui.inProgress}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {visibleSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {visibleSkills.map((entry) => (
                              <span
                                key={entry.skill}
                                title={masteryStateLabels[entry.state][language]}
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stateBadgeClasses[entry.state]}`}
                              >
                                {skillLabels[entry.skill][language]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">{ui.noSkillData}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            student.weakSkillCount > 0
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                          }`}
                        >
                          {student.weakSkillCount > 0 && <FiAlertTriangle className="h-3.5 w-3.5" />}
                          {student.weakSkillCount === 0
                            ? ui.onTrack
                            : student.weakSkillCount === 1
                              ? ui.weakSkill
                              : ui.weakSkills.replace('{count}', String(student.weakSkillCount))}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
