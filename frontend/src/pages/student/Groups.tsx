import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiUsers } from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'

interface GroupMember { _id: string }
interface GroupItem {
  _id: string
  name: string
  description: string
  language?: string
  level?: string
  members: GroupMember[]
}

const copy = {
  en: { kicker: 'Community circles', title: 'Study Groups', text: 'Join language-focused groups or create a new space for collaborative practice.', createGroup: 'Create Group', groupName: 'Group name', description: 'Description', create: 'Create', loading: 'Loading groups...', empty: 'No study groups yet. Start one!', members: '{count} members', joined: 'Joined', join: 'Join', loadFailed: 'Unable to load groups', createSuccess: 'Group created!', createFailed: 'Group could not be created', joinSuccess: 'Joined group!', joinFailed: 'Could not join group' },
  ru: { kicker: 'Круги сообщества', title: 'Учебные группы', text: 'Присоединяйтесь к языковым группам или создайте новое пространство для совместной практики.', createGroup: 'Создать группу', groupName: 'Название группы', description: 'Описание', create: 'Создать', loading: 'Загрузка групп...', empty: 'Учебных групп пока нет. Создайте первую!', members: '{count} участников', joined: 'Вы участник', join: 'Вступить', loadFailed: 'Не удалось загрузить группы', createSuccess: 'Группа создана!', createFailed: 'Не удалось создать группу', joinSuccess: 'Вы вступили в группу!', joinFailed: 'Не удалось вступить в группу' },
  uz: { kicker: 'Hamjamiyat doiralari', title: 'O‘quv guruhlari', text: 'Tilga yo‘naltirilgan guruhlarga qo‘shiling yoki birgalikdagi mashq uchun yangi maydon yarating.', createGroup: 'Guruh yaratish', groupName: 'Guruh nomi', description: 'Tavsif', create: 'Yaratish', loading: 'Guruhlar yuklanmoqda...', empty: 'Hali o‘quv guruhlari yo‘q. Birinchisini boshlang!', members: '{count} a’zo', joined: 'Qo‘shilgan', join: 'Qo‘shilish', loadFailed: 'Guruhlarni yuklab bo‘lmadi', createSuccess: 'Guruh yaratildi!', createFailed: 'Guruhni yaratib bo‘lmadi', joinSuccess: 'Guruhga qo‘shildingiz!', joinFailed: 'Guruhga qo‘shilib bo‘lmadi' },
} as const

const optionLabels = {
  English: { en: 'English', ru: 'Английский', uz: 'Inglizcha' },
  Turkish: { en: 'Turkish', ru: 'Турецкий', uz: 'Turkcha' },
  Russian: { en: 'Russian', ru: 'Русский', uz: 'Ruscha' },
  Uzbek: { en: 'Uzbek', ru: 'Узбекский', uz: 'O‘zbekcha' },
  Beginner: { en: 'Beginner', ru: 'Начальный', uz: 'Boshlang‘ich' },
  Intermediate: { en: 'Intermediate', ru: 'Средний', uz: 'O‘rta' },
  Advanced: { en: 'Advanced', ru: 'Продвинутый', uz: 'Yuqori' },
} as const

export default function Groups() {
  const { user } = useAuthStore()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', language: 'English', level: 'Beginner' })

  const loadGroups = () => {
    setLoading(true)
    api.get('/groups')
      .then((response) => setGroups(response.data.data || []))
      .catch(() => toast.error(ui.loadFailed))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadGroups() }, [])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await api.post('/groups', formData)
      toast.success(ui.createSuccess)
      setShowForm(false)
      setFormData({ name: '', description: '', language: 'English', level: 'Beginner' })
      loadGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.createFailed)
    }
  }

  const handleJoin = async (groupId: string) => {
    try {
      await api.post(`/groups/${groupId}/join`)
      toast.success(ui.joinSuccess)
      loadGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.joinFailed)
    }
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="atlas-heading">
            <p className="atlas-kicker">{ui.kicker}</p>
            <h1>{ui.title}</h1>
            <p>{ui.text}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
            <FiPlus size={20} /> {ui.createGroup}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="atlas-panel mb-8 space-y-4 p-6">
            <input className="input" placeholder={ui.groupName} required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <textarea className="input" placeholder={ui.description} required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <select className="input" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
                <option value="English">{optionLabels.English[language]}</option>
                <option value="Turkish">{optionLabels.Turkish[language]}</option>
                <option value="Russian">{optionLabels.Russian[language]}</option>
                <option value="Uzbek">{optionLabels.Uzbek[language]}</option>
              </select>
              <select className="input" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                <option value="Beginner">{optionLabels.Beginner[language]}</option>
                <option value="Intermediate">{optionLabels.Intermediate[language]}</option>
                <option value="Advanced">{optionLabels.Advanced[language]}</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">{ui.create}</button>
          </form>
        )}

        {loading ? (
          <div className="atlas-panel p-6 text-muted">{ui.loading}</div>
        ) : groups.length === 0 ? (
          <div className="atlas-panel p-6 text-muted">{ui.empty}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => {
              const isMember = user ? group.members?.some((member) => member._id === user.id) : false
              return (
                <div key={group._id} className="atlas-panel p-6">
                  <h3 className="text-xl font-bold mb-2 text-ink dark:text-white">{group.name}</h3>
                  <p className="text-muted mb-4">{group.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      {group.language && (
                        <span className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                          {optionLabels[group.language as keyof typeof optionLabels]?.[language] || group.language}
                        </span>
                      )}
                      {group.level && (
                        <span className="text-sm bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 px-3 py-1 rounded-full">
                          {optionLabels[group.level as keyof typeof optionLabels]?.[language] || group.level}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 text-muted">
                      <FiUsers size={16} />
                      <span>{ui.members.replace('{count}', String(group.members?.length || 0))}</span>
                    </div>
                    <button onClick={() => handleJoin(group._id)} disabled={isMember} className="btn btn-primary disabled:opacity-50">
                      {isMember ? ui.joined : ui.join}
                    </button>
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
