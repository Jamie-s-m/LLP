import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { FiAward, FiEdit2, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  nativeLanguage?: string
  xp?: number
  streak?: number
}
interface Achievement {
  _id: string
  badge?: { name: string }
}

const copy = {
  en: { kicker: 'Profile studio', title: 'Profile Settings', text: 'Keep your identity, language preferences, and learner milestones easy to review.', firstName: 'First Name', lastName: 'Last Name', email: 'Email', nativeLanguage: 'Native Language', selectLanguage: 'Select a language', points: 'Points', streak: 'Streak', badges: 'Badges', noBadges: 'No badges earned yet — keep learning to unlock some!', edit: 'Edit Profile', save: 'Save Changes', cancel: 'Cancel', loading: 'Loading profile...', loadFailed: 'Unable to load profile', saveSuccess: 'Profile updated successfully!', saveFailed: 'Profile could not be updated' },
  ru: { kicker: 'Профиль', title: 'Настройки профиля', text: 'Сохраняйте данные, языковые предпочтения и достижения ученика в удобном обзоре.', firstName: 'Имя', lastName: 'Фамилия', email: 'Email', nativeLanguage: 'Родной язык', selectLanguage: 'Выберите язык', points: 'Баллы', streak: 'Серия', badges: 'Значки', noBadges: 'Пока нет значков — продолжайте учиться, чтобы открыть их!', edit: 'Редактировать профиль', save: 'Сохранить изменения', cancel: 'Отмена', loading: 'Загрузка профиля...', loadFailed: 'Не удалось загрузить профиль', saveSuccess: 'Профиль успешно обновлён!', saveFailed: 'Не удалось обновить профиль' },
  uz: { kicker: 'Profil studiyasi', title: 'Profil sozlamalari', text: 'Shaxsiy ma’lumotlar, til tanlovlari va o‘quv yutuqlarini oson ko‘rib chiqing.', firstName: 'Ism', lastName: 'Familiya', email: 'Email', nativeLanguage: 'Ona tili', selectLanguage: 'Tilni tanlang', points: 'Ballar', streak: 'Seriya', badges: 'Belgilar', noBadges: 'Hali badge yo‘q — ochish uchun o‘qishni davom ettiring!', edit: 'Profilni tahrirlash', save: 'O‘zgarishlarni saqlash', cancel: 'Bekor qilish', loading: 'Profil yuklanmoqda...', loadFailed: 'Profilni yuklab bo‘lmadi', saveSuccess: 'Profil muvaffaqiyatli yangilandi!', saveFailed: 'Profilni yangilab bo‘lmadi' },
} as const

const languageOptions = {
  English: { en: 'English', ru: 'Английский', uz: 'Inglizcha' },
  Turkish: { en: 'Turkish', ru: 'Турецкий', uz: 'Turkcha' },
  Russian: { en: 'Russian', ru: 'Русский', uz: 'Ruscha' },
  Uzbek: { en: 'Uzbek', ru: 'Узбекский', uz: 'O‘zbekcha' },
} as const

export default function Profile() {
  const { setUser } = useAuthStore()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', nativeLanguage: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/users/profile'), api.get('/users/achievements')])
      .then(([profileResponse, achievementsResponse]) => {
        const data = profileResponse.data.data
        setProfile(data)
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          nativeLanguage: data.nativeLanguage || '',
        })
        setAchievements(achievementsResponse.data.data || [])
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

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="atlas-panel p-6 sm:p-8">
          <div className="mb-8 flex flex-col gap-5 border-b border-neutral-200 pb-8 dark:border-neutral-700 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-3xl font-bold text-white">
              {profile?.firstName?.charAt(0)}
            </div>
            <div>
              <p className="text-2xl font-bold text-ink dark:text-white">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-muted">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">{ui.firstName}</label>
                <input
                  type="text"
                  name="firstName"
                  className="input"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="label">{ui.lastName}</label>
                <input
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
              <label className="label">{ui.email}</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                disabled
              />
            </div>

            <div>
              <label className="label">{ui.nativeLanguage}</label>
              <select
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

            <div className="grid gap-4 border-t border-neutral-200 py-6 dark:border-neutral-700 md:grid-cols-2">
              <div className="rounded-2xl bg-[#f6efe7] p-4 text-center dark:bg-white/5">
                <p className="text-2xl font-bold text-primary-500">{profile?.xp ?? 0}</p>
                <p className="text-sm text-muted">{ui.points}</p>
              </div>
              <div className="rounded-2xl bg-[#f6efe7] p-4 text-center dark:bg-white/5">
                <p className="text-2xl font-bold text-secondary-500">{profile?.streak ?? 0}</p>
                <p className="text-sm text-muted">{ui.streak}</p>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-ink dark:text-white"><FiAward className="text-primary-500" /> {ui.badges}</h3>
              {achievements.length === 0 ? (
                <p className="text-sm text-muted">{ui.noBadges}</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {achievements.map((achievement) => (
                    <span key={achievement._id} className="px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium">
                      {achievement.badge?.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-700 sm:flex-row">
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
      </div>
    </div>
  )
}
