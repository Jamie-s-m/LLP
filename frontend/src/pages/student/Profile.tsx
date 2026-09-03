import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FiAward, FiBookOpen, FiCheckCircle, FiClock, FiEdit2, FiSave, FiZap } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'
import NotificationOptIn from '../../components/NotificationOptIn'
import Orbit, { type CefrLevel } from '../../components/orbit/Orbit'
import Illustration from '../../components/illustrations/Illustration'
import { BadgeIcon } from '../../utils/badgeIcons'
import { courseDomainFor, DOMAIN_META } from '../../utils/courseDomain'
import { Avatar, EmptyState, ProgressBar, StatCard } from '../../components/ui'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  nativeLanguage?: string
  xp?: number
  streak?: number
  createdAt?: string
}
interface Achievement {
  _id: string
  badge?: { name: string; icon?: string; color?: string }
}
interface SkillProfile {
  overallCefr: string | null
  overallLevel: string | null
  skills: Array<{
    skill: string
    placement: { accuracyPercent: number | null }
    practice: { accuracyPercent: number | null }
  }>
}
interface MyLearningCourse {
  _id: string
  title: string
  level?: string
  language?: string
  category?: string
}
interface MyLearningRecord {
  _id: string
  course?: MyLearningCourse
  isCompleted: boolean
}

const copy = {
  en: { kicker: 'Learning identity', title: 'Your Profile', text: 'Your CEFR level, skill strengths, streak, and milestones — all in one place, alongside the settings that keep them accurate.', firstName: 'First Name', lastName: 'Last Name', email: 'Email', nativeLanguage: 'Native Language', selectLanguage: 'Select a language', points: 'Points', streak: 'Streak', badges: 'Badges', noBadgesTitle: 'No badges yet', noBadges: 'Keep learning to unlock your first badge.', edit: 'Edit Profile', save: 'Save Changes', cancel: 'Cancel', loading: 'Loading profile...', loadFailed: 'Unable to load profile', saveSuccess: 'Profile updated successfully!', saveFailed: 'Profile could not be updated', learningSince: 'Learning since {date}', cefrKicker: 'Your CEFR journey', notPlacedYet: 'Not placed yet', placementCta: 'Take the placement test', progressToward: '{percent}% toward {level}', masteryLabel: 'full mastery', skillStrengths: 'Skill strengths', skillStrengthsEmpty: 'Practice a few exercises to see your skill strengths here.', skillListening: 'Listening', skillSpeaking: 'Speaking', skillReading: 'Reading', skillWriting: 'Writing', skillVocabulary: 'Vocabulary', skillGrammar: 'Grammar', completedCourses: 'Completed courses', completedCoursesEmptyTitle: 'No completed courses yet', completedCoursesEmptyDesc: 'Finish a course to see it here.', browseCoursesCta: 'Browse courses', completedBadge: 'Completed', settingsKicker: 'Account settings' },
  ru: { kicker: 'Профиль ученика', title: 'Ваш профиль', text: 'Ваш уровень CEFR, сильные навыки, серия и достижения — всё в одном месте, рядом с настройками, которые поддерживают их точность.', firstName: 'Имя', lastName: 'Фамилия', email: 'Email', nativeLanguage: 'Родной язык', selectLanguage: 'Выберите язык', points: 'Баллы', streak: 'Серия', badges: 'Значки', noBadgesTitle: 'Пока нет значков', noBadges: 'Продолжайте учиться, чтобы открыть первый значок.', edit: 'Редактировать профиль', save: 'Сохранить изменения', cancel: 'Отмена', loading: 'Загрузка профиля...', loadFailed: 'Не удалось загрузить профиль', saveSuccess: 'Профиль успешно обновлён!', saveFailed: 'Не удалось обновить профиль', learningSince: 'Учится с {date}', cefrKicker: 'Ваш путь по CEFR', notPlacedYet: 'Уровень ещё не определён', placementCta: 'Пройти тест на уровень', progressToward: '{percent}% до уровня {level}', masteryLabel: 'полного освоения', skillStrengths: 'Сильные навыки', skillStrengthsEmpty: 'Выполните несколько упражнений, чтобы увидеть свои сильные навыки здесь.', skillListening: 'Аудирование', skillSpeaking: 'Говорение', skillReading: 'Чтение', skillWriting: 'Письмо', skillVocabulary: 'Лексика', skillGrammar: 'Грамматика', completedCourses: 'Завершённые курсы', completedCoursesEmptyTitle: 'Пока нет завершённых курсов', completedCoursesEmptyDesc: 'Завершите курс, чтобы увидеть его здесь.', browseCoursesCta: 'Смотреть курсы', completedBadge: 'Завершено', settingsKicker: 'Настройки аккаунта' },
  uz: { kicker: 'O‘quvchi profili', title: 'Sizning profilingiz', text: 'CEFR darajangiz, kuchli ko‘nikmalar, seriya va yutuqlar — barchasi bir joyda, ularni aniq saqlaydigan sozlamalar bilan birga.', firstName: 'Ism', lastName: 'Familiya', email: 'Email', nativeLanguage: 'Ona tili', selectLanguage: 'Tilni tanlang', points: 'Ballar', streak: 'Seriya', badges: 'Belgilar', noBadgesTitle: 'Hali nishonlar yo‘q', noBadges: 'Birinchi nishonni ochish uchun o‘qishni davom ettiring.', edit: 'Profilni tahrirlash', save: 'O‘zgarishlarni saqlash', cancel: 'Bekor qilish', loading: 'Profil yuklanmoqda...', loadFailed: 'Profilni yuklab bo‘lmadi', saveSuccess: 'Profil muvaffaqiyatli yangilandi!', saveFailed: 'Profilni yangilab bo‘lmadi', learningSince: '{date} dan beri o‘qimoqda', cefrKicker: 'Sizning CEFR yo‘lingiz', notPlacedYet: 'Daraja hali aniqlanmagan', placementCta: 'Daraja aniqlash testini topshirish', progressToward: '{level} darajasigacha {percent}%', masteryLabel: 'to‘liq egallash', skillStrengths: 'Kuchli ko‘nikmalar', skillStrengthsEmpty: 'Bu yerda kuchli ko‘nikmalaringizni ko‘rish uchun bir nechta mashqlarni bajaring.', skillListening: 'Tinglab tushunish', skillSpeaking: 'Gapirish', skillReading: 'O‘qish', skillWriting: 'Yozish', skillVocabulary: 'Lug‘at', skillGrammar: 'Grammatika', completedCourses: 'Tugatilgan kurslar', completedCoursesEmptyTitle: 'Hali tugatilgan kurslar yo‘q', completedCoursesEmptyDesc: 'Bu yerda ko‘rish uchun biror kursni tugating.', browseCoursesCta: 'Kurslarni ko‘rish', completedBadge: 'Tugatildi', settingsKicker: 'Hisob sozlamalari' },
} as const

const languageOptions = {
  English: { en: 'English', ru: 'Английский', uz: 'Inglizcha' },
  Turkish: { en: 'Turkish', ru: 'Турецкий', uz: 'Turkcha' },
  Russian: { en: 'Russian', ru: 'Русский', uz: 'Ruscha' },
  Uzbek: { en: 'Uzbek', ru: 'Узбекский', uz: 'O‘zbekcha' },
} as const

const ORBIT_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']
const LOCALE_BY_LANGUAGE: Record<string, string> = { en: 'en-US', ru: 'ru-RU', uz: 'uz-UZ' }

function toOrbitLevel(cefr: string | null | undefined): CefrLevel {
  const normalized = (cefr || '').toUpperCase()
  return (ORBIT_LEVELS as string[]).includes(normalized) ? (normalized as CefrLevel) : 'A1'
}

export default function Profile() {
  const { setUser } = useAuthStore()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null)
  const [myLearning, setMyLearning] = useState<MyLearningRecord[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', nativeLanguage: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users/profile'),
      api.get('/users/achievements'),
      // Supplementary panels only - a failure here shouldn't take down the whole page, same
      // reasoning as Dashboard.tsx's own skill-profile/weekly-activity fetches.
      api.get('/progress/skill-profile').catch(() => null),
      api.get('/progress/my-learning').catch(() => null),
    ])
      .then(([profileResponse, achievementsResponse, skillProfileResponse, myLearningResponse]) => {
        const data = profileResponse.data.data
        setProfile(data)
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          nativeLanguage: data.nativeLanguage || '',
        })
        setAchievements(achievementsResponse.data.data || [])
        setSkillProfile(skillProfileResponse?.data?.data ?? null)
        setMyLearning(Array.isArray(myLearningResponse?.data?.data) ? myLearningResponse.data.data : [])
      })
      .catch(() => toast.error(ui.loadFailed))
      .finally(() => setLoading(false))
  }, [ui.loadFailed])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      const response = await api.put('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nativeLanguage: formData.nativeLanguage,
      })
      setProfile(response.data.data)
      setUser(response.data.data)
      toast.success(ui.saveSuccess)
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.saveFailed)
    }
  }

  if (loading) {
    return (
      <div className="atlas-page px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="atlas-panel p-6 text-center text-muted">{ui.loading}</div>
        </div>
      </div>
    )
  }

  const fullName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()

  // Same honest derivation Dashboard.tsx uses: the level the current CEFR ring belongs to,
  // and "progress toward the next ring" as the average of whatever real per-skill accuracy
  // exists - not a fabricated metric.
  const orbitLevel = toOrbitLevel(skillProfile?.overallCefr)
  const orbitLevelIndex = ORBIT_LEVELS.indexOf(orbitLevel)
  const nextLevel = ORBIT_LEVELS[orbitLevelIndex + 1] ?? null
  const orbitSkills = (skillProfile?.skills ?? []).map((row) => ({
    key: row.skill,
    mastery: row.practice.accuracyPercent ?? row.placement.accuracyPercent ?? 0,
  }))
  const measuredSkills = orbitSkills.filter((s) => s.mastery > 0)
  const orbitLevelProgress = measuredSkills.length
    ? Math.round(measuredSkills.reduce((sum, s) => sum + s.mastery, 0) / measuredSkills.length)
    : 0
  const skillLabels: Record<string, string> = {
    listening: ui.skillListening,
    speaking: ui.skillSpeaking,
    reading: ui.skillReading,
    writing: ui.skillWriting,
    vocabulary: ui.skillVocabulary,
    grammar: ui.skillGrammar,
  }
  const progressLabel = skillProfile?.overallCefr
    ? ui.progressToward.replace('{percent}', String(orbitLevelProgress)).replace('{level}', nextLevel ?? ui.masteryLabel)
    : ui.notPlacedYet

  const memberSinceLabel = profile?.createdAt
    ? ui.learningSince.replace(
        '{date}',
        new Date(profile.createdAt).toLocaleDateString(LOCALE_BY_LANGUAGE[language] || 'en-US', { month: 'long', year: 'numeric' })
      )
    : null

  const completedCourseRecords = myLearning.filter((record) => record.isCompleted && record.course)

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="space-y-6">
          {/* Identity header - decorative only, safe for the hover-tilt treatment. */}
          <div className="atlas-panel dimensional-card p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <Avatar name={fullName} size="xl" />
                  <span
                    className="absolute -bottom-1 -right-1 flex h-7 min-w-7 items-center justify-center rounded-full border-2 px-1.5 text-xs font-bold text-white"
                    style={{ background: 'var(--wine)', borderColor: 'var(--brand-surface)' }}
                    aria-hidden="true"
                  >
                    {orbitLevel}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink dark:text-white">{fullName}</p>
                  <p className="text-muted">{profile?.email}</p>
                  {memberSinceLabel ? <p className="mt-1 text-sm text-muted">{memberSinceLabel}</p> : null}
                </div>
              </div>
              <div className="mx-auto h-24 w-24 shrink-0 sm:mx-0" aria-hidden="true">
                <Orbit currentLevel={orbitLevel} levelProgress={orbitLevelProgress} variant="compact" />
              </div>
            </div>
          </div>

          {/* Glanceable stat tiles - safe for dimensional-card per this app's own rule. */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label={ui.points} value={profile?.xp ?? 0} icon={<FiZap />} className="dimensional-card" />
            <StatCard label={ui.streak} value={profile?.streak ?? 0} icon={<FiClock />} className="dimensional-card" />
            <StatCard label={ui.badges} value={achievements.length} icon={<FiAward />} className="dimensional-card" />
            <StatCard label={ui.completedCourses} value={completedCourseRecords.length} icon={<FiCheckCircle />} className="dimensional-card" />
          </div>

          {/* CEFR journey + skill strengths. */}
          <div className="atlas-panel p-6 sm:p-8">
            <p className="atlas-kicker">{ui.cefrKicker}</p>
            <h3 className="text-xl font-bold text-ink dark:text-white">{progressLabel}</h3>
            {!skillProfile?.overallCefr ? (
              <Link to="/placement-test" className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]">
                {ui.placementCta}
              </Link>
            ) : null}

            <div className="mt-6 border-t border-neutral-200 pt-6 dark:border-neutral-700">
              <h4 className="mb-4 font-bold text-ink dark:text-white">{ui.skillStrengths}</h4>
              {measuredSkills.length === 0 ? (
                <p className="text-sm text-muted">{ui.skillStrengthsEmpty}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {measuredSkills.map((skill) => (
                    <div key={skill.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-ink dark:text-white">{skillLabels[skill.key] || skill.key}</span>
                        <span className="text-muted">{Math.round(skill.mastery)}%</span>
                      </div>
                      <ProgressBar value={skill.mastery} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Achievements. */}
          <div className="atlas-panel p-6 sm:p-8">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-ink dark:text-white">
              <FiAward className="text-primary-500" /> {ui.badges}
            </h3>
            {achievements.length === 0 ? (
              <EmptyState icon={FiAward} title={ui.noBadgesTitle} description={ui.noBadges} />
            ) : (
              <div className="flex flex-wrap gap-3">
                {achievements.map((achievement) => {
                  const color = achievement.badge?.color || '#5B5CE2'
                  return (
                    <span
                      key={achievement._id}
                      className="inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium"
                      style={{ background: `${color}22`, color }}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-base dark:bg-black/20">
                        <BadgeIcon iconKey={achievement.badge?.icon || ''} />
                      </span>
                      {achievement.badge?.name}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Completed courses. */}
          <div className="atlas-panel p-6 sm:p-8">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-ink dark:text-white">
              <FiBookOpen className="text-primary-500" /> {ui.completedCourses}
            </h3>
            {completedCourseRecords.length === 0 ? (
              <EmptyState
                icon={FiBookOpen}
                title={ui.completedCoursesEmptyTitle}
                description={ui.completedCoursesEmptyDesc}
                action={
                  <Link to="/courses" className="btn btn-outline">
                    {ui.browseCoursesCta}
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {completedCourseRecords.map((record) => {
                  const course = record.course!
                  const domain = courseDomainFor({ title: course.title, category: course.category })
                  const domainMeta = DOMAIN_META[domain]
                  return (
                    <div
                      key={record._id}
                      className="dimensional-card flex items-center gap-4 rounded-2xl bg-[var(--surface-strong)] p-4 dark:bg-white/5"
                    >
                      <div
                        className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:flex"
                        style={{ background: `color-mix(in srgb, var(${domainMeta.colorVar}) 22%, var(--surface-strong))` }}
                      >
                        <Illustration name={domainMeta.illustration} className="h-8 w-8" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink dark:text-white">{course.title}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                          {course.language ? <span>{course.language}</span> : null}
                          {course.level ? <span>{course.level}</span> : null}
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
                        <FiCheckCircle /> {ui.completedBadge}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Account settings - the existing edit form, kept out of dimensional-card since
              it's an active interaction surface (see the click-hit-testing note above). */}
          <div className="atlas-panel p-6 sm:p-8">
            <p className="atlas-kicker">{ui.settingsKicker}</p>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label" htmlFor="profile-firstName">{ui.firstName}</label>
                  <input
                    id="profile-firstName"
                    type="text"
                    name="firstName"
                    className="input"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="profile-lastName">{ui.lastName}</label>
                  <input
                    id="profile-lastName"
                    type="text"
                    name="lastName"
                    className="input"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="profile-email">{ui.email}</label>
                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  className="input"
                  value={formData.email}
                  disabled
                />
              </div>

              <div>
                <label className="label" htmlFor="profile-nativeLanguage">{ui.nativeLanguage}</label>
                <select
                  id="profile-nativeLanguage"
                  name="nativeLanguage"
                  className="input"
                  value={formData.nativeLanguage}
                  onChange={handleChange}
                  disabled={!isEditing}
                >
                  <option value="">{ui.selectLanguage}</option>
                  <option value="English">{languageOptions.English[language]}</option>
                  <option value="Turkish">{languageOptions.Turkish[language]}</option>
                  <option value="Russian">{languageOptions.Russian[language]}</option>
                  <option value="Uzbek">{languageOptions.Uzbek[language]}</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-700 sm:flex-row">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  <FiEdit2 size={20} /> {ui.edit}
                </button>
              ) : (
                <>
                  <button onClick={handleSave} className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                    <FiSave size={20} /> {ui.save}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn btn-outline flex-1"
                  >
                    {ui.cancel}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="atlas-panel p-6 sm:p-8">
            <NotificationOptIn />
          </div>
        </div>
      </div>
    </div>
  )
}
