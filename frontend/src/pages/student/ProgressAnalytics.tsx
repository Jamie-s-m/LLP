import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'

interface SkillRow {
  skill: string
  attempts: number
  correct: number
  accuracy: number
}

interface ClaimEntry {
  claimedAt: string
  streak: number
}

interface CourseSummary {
  _id: string
  title: string
}

interface LevelReadinessRow {
  ready: boolean
}

interface CourseMastery {
  completionPercentage: number
  masteryPercentage: number
  levelReadiness: Record<string, LevelReadinessRow>
}

const copy = {
  en: { kicker: 'Your growth', title: 'Progress & Analytics', text: 'A closer look at your streak history and skill accuracy.', loading: 'Loading your progress...', streakCalendar: 'Streak calendar (last 90 days)', skillsBreakdown: 'Skills breakdown', totalXp: 'Total XP', currentStreak: 'Current streak', bestStreak: 'Longest streak (90d)', activeDays: 'Active days (90d)', noAttempts: 'No practice logged yet for this skill.', courseMastery: 'Course mastery', courseMasteryText: 'Real evidence-based mastery, separate from raw completion.', selectCourse: 'Course', completionLabel: 'Completed', masteryLabel: 'Mastered', ready: 'Ready', notReady: 'Not yet', noCourses: 'Enroll in a course to see your mastery here.' },
  ru: { kicker: 'Ваш прогресс', title: 'Прогресс и аналитика', text: 'Подробный взгляд на историю серий и точность по навыкам.', loading: 'Загрузка прогресса...', streakCalendar: 'Календарь серии (последние 90 дней)', skillsBreakdown: 'Навыки', totalXp: 'Всего XP', currentStreak: 'Текущая серия', bestStreak: 'Лучшая серия (90д)', activeDays: 'Активные дни (90д)', noAttempts: 'По этому навыку пока нет практики.', courseMastery: 'Освоение курса', courseMasteryText: 'Реальное освоение на основе доказательств, отдельно от простого завершения.', selectCourse: 'Курс', completionLabel: 'Завершено', masteryLabel: 'Освоено', ready: 'Готово', notReady: 'Ещё нет', noCourses: 'Запишитесь на курс, чтобы увидеть здесь своё освоение.' },
  uz: { kicker: 'Sizning o‘sishingiz', title: 'Progress va tahlil', text: 'Ketma-ketlik tarixi va ko‘nikmalar aniqligiga yaqindan nazar.', loading: 'Progress yuklanmoqda...', streakCalendar: 'Ketma-ketlik kalendari (oxirgi 90 kun)', skillsBreakdown: 'Ko‘nikmalar', totalXp: 'Jami XP', currentStreak: 'Joriy ketma-ketlik', bestStreak: 'Eng uzun ketma-ketlik (90k)', activeDays: 'Faol kunlar (90k)', noAttempts: 'Bu ko‘nikma bo‘yicha hali mashq yo‘q.', courseMastery: 'Kursni egallash', courseMasteryText: 'Oddiy tugatishdan farqli, dalillarga asoslangan haqiqiy egallash darajasi.', selectCourse: 'Kurs', completionLabel: 'Tugallangan', masteryLabel: 'Egallangan', ready: 'Tayyor', notReady: 'Hali emas', noCourses: 'Bu yerda egallash darajangizni ko‘rish uchun kursga yoziling.' },
} as const

const SKILL_LABELS: Record<string, string> = {
  listening: 'Listening',
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
}

const SKILL_COLORS: Record<string, string> = {
  listening: 'var(--accent)',
  speaking: 'var(--info)',
  reading: 'var(--success)',
  writing: 'var(--warning)',
  vocabulary: 'var(--accent)',
  grammar: 'var(--info)',
}

export default function ProgressAnalytics() {
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [claims, setClaims] = useState<ClaimEntry[]>([])
  const [summary, setSummary] = useState<{ totalXp: number; streak: number } | null>(null)
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [courseMastery, setCourseMastery] = useState<CourseMastery | null>(null)
  const [loading, setLoading] = useState(true)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  useEffect(() => {
    Promise.all([
      api.get('/progress/skills-breakdown'),
      api.get('/daily-reward/history'),
      api.get('/users/dashboard-summary'),
      api.get('/progress/my-learning'),
    ])
      .then(([skillsRes, historyRes, summaryRes, myLearningRes]) => {
        setSkills(skillsRes.data.data || [])
        setClaims(historyRes.data.data || [])
        setSummary({ totalXp: summaryRes.data.data?.totalXp || 0, streak: summaryRes.data.data?.streak || 0 })
        const enrolledCourses: CourseSummary[] = (myLearningRes.data.data || [])
          .map((record: { course?: CourseSummary }) => record.course)
          .filter(Boolean)
        setCourses(enrolledCourses)
        if (enrolledCourses.length > 0) setSelectedCourseId(enrolledCourses[0]._id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Mastery is course-scoped (unlike the platform-wide accuracy breakdown below), so it only
  // loads once a course is selected.
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseMastery(null)
      return
    }
    let cancelled = false
    api.get(`/certificates/mastery/${selectedCourseId}`)
      .then((response) => {
        if (!cancelled) setCourseMastery(response.data.data)
      })
      .catch(() => {
        if (!cancelled) setCourseMastery(null)
      })
    return () => {
      cancelled = true
    }
  }, [selectedCourseId])

  const activeDaySet = new Set(claims.map((claim) => new Date(claim.claimedAt).toDateString()))
  const bestStreak = claims.reduce((max, claim) => Math.max(max, claim.streak), 0)

  const today = new Date()
  const calendarDays = Array.from({ length: 90 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (89 - index))
    return { date, active: activeDaySet.has(date.toDateString()) }
  })

  if (loading) {
    return <div className="atlas-page px-4 py-12 text-center"><div className="mx-auto max-w-2xl atlas-panel p-6 text-muted">{ui.loading}</div></div>
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label={ui.totalXp} value={summary?.totalXp ?? 0} />
          <StatCard label={ui.currentStreak} value={summary?.streak ?? 0} />
          <StatCard label={ui.bestStreak} value={bestStreak} />
          <StatCard label={ui.activeDays} value={activeDaySet.size} />
        </div>

        {courses.length > 0 ? (
          <Card className="mb-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">{ui.courseMastery}</h3>
                <p className="text-sm text-[var(--text-muted)]">{ui.courseMasteryText}</p>
              </div>
              {courses.length > 1 ? (
                <label className="text-sm">
                  <span className="sr-only">{ui.selectCourse}</span>
                  <select
                    value={selectedCourseId}
                    onChange={(event) => setSelectedCourseId(event.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  >
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {courseMastery ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                  <StatCard label={ui.completionLabel} value={`${courseMastery.completionPercentage}%`} />
                  <StatCard label={ui.masteryLabel} value={`${courseMastery.masteryPercentage}%`} />
                </div>
                {Object.keys(courseMastery.levelReadiness || {}).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(courseMastery.levelReadiness).map(([cefr, readiness]) => (
                      <span
                        key={cefr}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          readiness.ready
                            ? 'bg-[var(--success)]/15 text-[var(--success)]'
                            : 'bg-[var(--border-light)] text-[var(--text-muted)]'
                        }`}
                      >
                        {cefr}: {readiness.ready ? ui.ready : ui.notReady}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </Card>
        ) : null}

        <Card className="mb-8">
          <h3 className="mb-4 font-display text-lg font-bold">{ui.streakCalendar}</h3>
          <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
            {calendarDays.map(({ date, active }) => (
              <div
                key={date.toISOString()}
                title={date.toLocaleDateString()}
                className="aspect-square rounded-sm"
                style={{ background: active ? 'var(--accent)' : 'var(--border-light)' }}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">{ui.skillsBreakdown}</h3>
          <div className="space-y-4">
            {skills.map((row) => (
              <div key={row.skill}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{SKILL_LABELS[row.skill] || row.skill}</span>
                  <span className="text-[var(--text-muted)]">
                    {row.attempts > 0 ? `${row.accuracy}% · ${row.attempts} attempts` : ui.noAttempts}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${SKILL_LABELS[row.skill] || row.skill} ${row.accuracy}%`}
                  aria-valuenow={row.accuracy}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 overflow-hidden rounded-full bg-[var(--border-light)]"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${row.accuracy}%`, background: SKILL_COLORS[row.skill] || 'var(--accent)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
