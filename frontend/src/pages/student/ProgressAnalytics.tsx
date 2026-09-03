import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import Orbit, { type CefrLevel } from '../../components/orbit/Orbit'

interface SkillRow {
  skill: string
  attempts: number
  correct: number
  accuracy: number
}

interface ClaimEntry {
  claimedAt: string
  streak: number
  earnedXP: number
  earnedCoins: number
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

interface SkillProfileRow {
  skill: string
  placement: { accuracyPercent: number | null }
  practice: { accuracyPercent: number | null }
}

interface SkillProfile {
  overallCefr: string | null
  overallLevel: string | null
  confidence: 'low' | 'none'
  confidenceNote: string
  skills: SkillProfileRow[]
}

const copy = {
  en: { kicker: 'Your growth', title: 'Progress & Analytics', text: 'A closer look at your streak history and skill accuracy.', loading: 'Loading your progress...', streakCalendar: 'Streak calendar (last 90 days)', streakCalendarText: 'Deeper color means more XP earned that day.', streakLess: 'Less', streakMore: 'More', skillsBreakdown: 'Skills breakdown', skillsBreakdownText: 'How accurate you are across each skill, from real graded exercises.', skillsRadarEmpty: 'Complete a few exercises to see your skill shape here.', attemptsLabel: 'attempts', totalXp: 'Total XP', currentStreak: 'Current streak', bestStreak: 'Longest streak (90d)', activeDays: 'Active days (90d)', noAttempts: 'No practice logged yet for this skill.', courseMastery: 'Course mastery', courseMasteryText: 'Real evidence-based mastery, separate from raw completion.', selectCourse: 'Course', completionLabel: 'Completed', masteryLabel: 'Mastered', ready: 'Ready', notReady: 'Not yet', noCourses: 'Enroll in a course to see your mastery here.', orbitTitle: 'Your CEFR journey', orbitText: 'Where you stand across the five CEFR levels, built from your placement test and real practice data.', levelProgressLabel: 'Progress to next level', masteryReached: 'You’ve reached the top of the CEFR scale.', placementNudge: 'Take the placement test for a real CEFR estimate.', placementCta: 'Take placement test' },
  ru: { kicker: 'Ваш прогресс', title: 'Прогресс и аналитика', text: 'Подробный взгляд на историю серий и точность по навыкам.', loading: 'Загрузка прогресса...', streakCalendar: 'Календарь серии (последние 90 дней)', streakCalendarText: 'Чем темнее цвет, тем больше XP получено в этот день.', streakLess: 'Меньше', streakMore: 'Больше', skillsBreakdown: 'Навыки', skillsBreakdownText: 'Насколько точно вы выполняете задания по каждому навыку — по реальным данным.', skillsRadarEmpty: 'Выполните несколько упражнений, чтобы увидеть форму своих навыков здесь.', attemptsLabel: 'попыток', totalXp: 'Всего XP', currentStreak: 'Текущая серия', bestStreak: 'Лучшая серия (90д)', activeDays: 'Активные дни (90д)', noAttempts: 'По этому навыку пока нет практики.', courseMastery: 'Освоение курса', courseMasteryText: 'Реальное освоение на основе доказательств, отдельно от простого завершения.', selectCourse: 'Курс', completionLabel: 'Завершено', masteryLabel: 'Освоено', ready: 'Готово', notReady: 'Ещё нет', noCourses: 'Запишитесь на курс, чтобы увидеть здесь своё освоение.', orbitTitle: 'Ваш путь по CEFR', orbitText: 'Где вы находитесь среди пяти уровней CEFR — по результатам теста и реальной практики.', levelProgressLabel: 'Прогресс до следующего уровня', masteryReached: 'Вы достигли вершины шкалы CEFR.', placementNudge: 'Пройдите тест на уровень, чтобы получить реальную оценку CEFR.', placementCta: 'Пройти тест на уровень' },
  uz: { kicker: 'Sizning o‘sishingiz', title: 'Progress va tahlil', text: 'Ketma-ketlik tarixi va ko‘nikmalar aniqligiga yaqindan nazar.', loading: 'Progress yuklanmoqda...', streakCalendar: 'Ketma-ketlik kalendari (oxirgi 90 kun)', streakCalendarText: 'Rang qanchalik to‘q bo‘lsa, o‘sha kuni shuncha ko‘p XP olingan.', streakLess: 'Kamroq', streakMore: 'Ko‘proq', skillsBreakdown: 'Ko‘nikmalar', skillsBreakdownText: 'Har bir ko‘nikma bo‘yicha aniqligingiz — real baholangan mashqlar asosida.', skillsRadarEmpty: 'Ko‘nikmalar shaklini shu yerda ko‘rish uchun bir nechta mashq bajaring.', attemptsLabel: 'urinish', totalXp: 'Jami XP', currentStreak: 'Joriy ketma-ketlik', bestStreak: 'Eng uzun ketma-ketlik (90k)', activeDays: 'Faol kunlar (90k)', noAttempts: 'Bu ko‘nikma bo‘yicha hali mashq yo‘q.', courseMastery: 'Kursni egallash', courseMasteryText: 'Oddiy tugatishdan farqli, dalillarga asoslangan haqiqiy egallash darajasi.', selectCourse: 'Kurs', completionLabel: 'Tugallangan', masteryLabel: 'Egallangan', ready: 'Tayyor', notReady: 'Hali emas', noCourses: 'Bu yerda egallash darajangizni ko‘rish uchun kursga yoziling.', orbitTitle: 'Sizning CEFR yo‘lingiz', orbitText: 'Test natijalari va real mashqlar asosida besh CEFR darajasi orasida qayerda turganingiz.', levelProgressLabel: 'Keyingi darajagacha progress', masteryReached: 'Siz CEFR shkalasining eng yuqori bosqichiga yetdingiz.', placementNudge: 'Haqiqiy CEFR bahosini olish uchun darajani aniqlash testini yeching.', placementCta: 'Darajani aniqlash testi' },
} as const

const SKILL_LABELS: Record<'en' | 'ru' | 'uz', Record<string, string>> = {
  en: { listening: 'Listening', speaking: 'Speaking', reading: 'Reading', writing: 'Writing', vocabulary: 'Vocabulary', grammar: 'Grammar' },
  ru: { listening: 'Аудирование', speaking: 'Говорение', reading: 'Чтение', writing: 'Письмо', vocabulary: 'Лексика', grammar: 'Грамматика' },
  uz: { listening: 'Tinglab tushunish', speaking: 'Gapirish', reading: 'O‘qish', writing: 'Yozish', vocabulary: 'Lug‘at', grammar: 'Grammatika' },
}

const SKILL_COLORS: Record<string, string> = {
  listening: 'var(--accent)',
  speaking: 'var(--info)',
  reading: 'var(--success)',
  writing: 'var(--warning)',
  vocabulary: 'var(--accent)',
  grammar: 'var(--info)',
}

const ORBIT_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']

function toOrbitLevel(cefr: string | null): CefrLevel {
  const normalized = (cefr || '').toUpperCase()
  return (ORBIT_LEVELS as string[]).includes(normalized) ? (normalized as CefrLevel) : 'A1'
}

// Streak-calendar color intensity: each claim already carries the real earnedXP awarded that
// day (scales with the streak multiplier + milestone bonus - see dailyRewardController.js), so
// intensity is a graduated read of a real number rather than fabricated granularity. Scaled
// relative to this learner's own best day in the window, not a fixed cross-user XP scale.
function claimIntensity(earnedXP: number, maxXp: number): number {
  if (maxXp <= 0) return 100
  return Math.round(25 + (earnedXP / maxXp) * 75)
}

export default function ProgressAnalytics() {
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [claims, setClaims] = useState<ClaimEntry[]>([])
  const [summary, setSummary] = useState<{ totalXp: number; streak: number } | null>(null)
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [courseMastery, setCourseMastery] = useState<CourseMastery | null>(null)
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const skillLabels = SKILL_LABELS[language]

  useEffect(() => {
    Promise.all([
      api.get('/progress/skills-breakdown'),
      api.get('/daily-reward/history'),
      api.get('/users/dashboard-summary'),
      api.get('/progress/my-learning'),
      // Supplementary to the page's core stats - a failure here shouldn't block the rest of
      // the page, the Orbit just falls back to an unplaced A1/0% state (same as Dashboard.tsx).
      api.get('/progress/skill-profile').catch(() => null),
    ])
      .then(([skillsRes, historyRes, summaryRes, myLearningRes, skillProfileRes]) => {
        setSkills(skillsRes.data.data || [])
        setClaims(historyRes.data.data || [])
        setSummary({ totalXp: summaryRes.data.data?.totalXp || 0, streak: summaryRes.data.data?.streak || 0 })
        const enrolledCourses: CourseSummary[] = (myLearningRes.data.data || [])
          .map((record: { course?: CourseSummary }) => record.course)
          .filter(Boolean)
        setCourses(enrolledCourses)
        if (enrolledCourses.length > 0) setSelectedCourseId(enrolledCourses[0]._id)
        setSkillProfile(skillProfileRes?.data?.data ?? null)
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
  const claimByDay = new Map(claims.map((claim) => [new Date(claim.claimedAt).toDateString(), claim]))
  const maxClaimXp = claims.reduce((max, claim) => Math.max(max, claim.earnedXP || 0), 0)

  const today = new Date()
  const calendarDays = Array.from({ length: 90 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (89 - index))
    const claim = claimByDay.get(date.toDateString()) || null
    return { date, claim, intensity: claim ? claimIntensity(claim.earnedXP || 0, maxClaimXp) : 0 }
  })

  // Same honest-average approach as Dashboard.tsx's orbitLevelProgress - the mean of whichever
  // per-skill accuracy figures actually exist (practice over placement), not a fabricated number.
  const orbitLevel = toOrbitLevel(skillProfile?.overallCefr ?? null)
  const orbitSkills = (skillProfile?.skills ?? []).map((row) => ({
    key: row.skill,
    label: skillLabels[row.skill] || row.skill,
    mastery: row.practice.accuracyPercent ?? row.placement.accuracyPercent ?? 0,
  }))
  const measuredSkills = orbitSkills.filter((skill) => skill.mastery > 0)
  const orbitLevelProgress = measuredSkills.length
    ? Math.round(measuredSkills.reduce((sum, skill) => sum + skill.mastery, 0) / measuredSkills.length)
    : 0
  const nextOrbitLevel = ORBIT_LEVELS[ORBIT_LEVELS.indexOf(orbitLevel) + 1]

  const radarData = skills.map((row) => ({
    skill: row.skill,
    label: skillLabels[row.skill] || row.skill,
    accuracy: row.accuracy,
    attempts: row.attempts,
  }))
  const totalAttempts = skills.reduce((sum, row) => sum + row.attempts, 0)

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
          <StatCard className="dimensional-card" label={ui.totalXp} value={summary?.totalXp ?? 0} />
          <StatCard className="dimensional-card" label={ui.currentStreak} value={summary?.streak ?? 0} />
          <StatCard className="dimensional-card" label={ui.bestStreak} value={bestStreak} />
          <StatCard className="dimensional-card" label={ui.activeDays} value={activeDaySet.size} />
        </div>

        <Card className="mb-8">
          <div className="mb-6">
            <h3 className="font-display text-lg font-bold">{ui.orbitTitle}</h3>
            <p className="text-sm text-[var(--text-muted)]">{ui.orbitText}</p>
          </div>
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,240px)_1fr]">
            <div className="mx-auto h-56 w-56 sm:h-60 sm:w-60">
              <Orbit currentLevel={orbitLevel} levelProgress={orbitLevelProgress} skills={orbitSkills} variant="full" className="h-full w-full" />
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-display leading-none text-[var(--accent)]">{orbitLevel}</span>
                {skillProfile?.overallLevel ? (
                  <span className="text-lg font-semibold text-[var(--text-primary)]">{skillProfile.overallLevel}</span>
                ) : null}
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">{ui.levelProgressLabel}</p>
                {nextOrbitLevel ? (
                  <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">
                    {orbitLevelProgress}% <span className="text-[var(--text-subtle)]">→</span> {nextOrbitLevel}
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-[var(--success)]">{ui.masteryReached}</p>
                )}
              </div>

              {skillProfile?.confidenceNote ? (
                <p className="mt-3 text-xs text-[var(--text-subtle)]">{skillProfile.confidenceNote}</p>
              ) : null}

              {(!skillProfile || skillProfile.confidence === 'none') ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--accent-light)] p-3">
                  <span className="text-sm text-[var(--text-primary)]">{ui.placementNudge}</span>
                  <Link to="/placement-test" className="btn btn-primary btn-sm whitespace-nowrap">{ui.placementCta}</Link>
                </div>
              ) : null}

              {orbitSkills.length > 0 ? (
                <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {orbitSkills.map((skill) => (
                    <li key={skill.key} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: 'var(--info)', opacity: 0.25 + (skill.mastery / 100) * 0.75 }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-[var(--text-muted)]">{skill.label}</span>
                      <span className="ml-auto shrink-0 font-semibold text-[var(--text-primary)]">{Math.round(skill.mastery)}%</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </Card>

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
                  <StatCard className="dimensional-card" label={ui.completionLabel} value={`${courseMastery.completionPercentage}%`} />
                  <StatCard className="dimensional-card" label={ui.masteryLabel} value={`${courseMastery.masteryPercentage}%`} />
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold">{ui.streakCalendar}</h3>
              <p className="text-sm text-[var(--text-muted)]">{ui.streakCalendarText}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
              <span>{ui.streakLess}</span>
              <span className="flex gap-0.5" aria-hidden="true">
                {[0, 25, 50, 75, 100].map((level) => (
                  <span
                    key={level}
                    className="h-3 w-3 rounded-sm"
                    style={{ background: level === 0 ? 'var(--border-light)' : `color-mix(in srgb, var(--accent) ${level}%, var(--border-light))` }}
                  />
                ))}
              </span>
              <span>{ui.streakMore}</span>
            </div>
          </div>
          <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
            {calendarDays.map(({ date, claim, intensity }) => (
              <div
                key={date.toISOString()}
                title={claim ? `${date.toLocaleDateString()} — ${claim.earnedXP} XP` : date.toLocaleDateString()}
                className="aspect-square rounded-sm"
                style={{ background: intensity > 0 ? `color-mix(in srgb, var(--accent) ${intensity}%, var(--border-light))` : 'var(--border-light)' }}
              />
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold">{ui.skillsBreakdown}</h3>
            <p className="text-sm text-[var(--text-muted)]">{ui.skillsBreakdownText}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)]">
            {skills.length > 0 ? (
              <div className="relative h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="var(--border-strong)" strokeOpacity={0.4} />
                    <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--text-subtle)', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="accuracy"
                      stroke="var(--accent)"
                      strokeWidth={2.5}
                      fill="var(--accent)"
                      fillOpacity={0.22}
                      dot={{ r: 4, fill: 'var(--card)', stroke: 'var(--accent)', strokeWidth: 2 }}
                      isAnimationActive
                    />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const row = item.payload as { label: string; accuracy: number; attempts: number }
                        return [row.attempts > 0 ? `${value}% · ${row.attempts} ${ui.attemptsLabel}` : ui.noAttempts, row.label]
                      }}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                {totalAttempts === 0 ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-10 text-center text-sm text-[var(--text-subtle)]">
                    {ui.skillsRadarEmpty}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-center text-sm text-[var(--text-subtle)]">{ui.skillsRadarEmpty}</div>
            )}

            <ul className="space-y-4 self-center">
              {skills.map((row) => (
                <li key={row.skill} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: SKILL_COLORS[row.skill] || 'var(--accent)' }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{skillLabels[row.skill] || row.skill}</span>
                      <span className="shrink-0 text-[var(--text-muted)]">{row.attempts > 0 ? `${row.accuracy}%` : '—'}</span>
                    </div>
                    <ProgressBar value={row.accuracy} />
                    {row.attempts === 0 ? <p className="mt-1 text-xs text-[var(--text-subtle)]">{ui.noAttempts}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
