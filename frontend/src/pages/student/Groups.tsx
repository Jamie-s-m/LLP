import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiUsers, FiCheck, FiX, FiClock } from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'

interface GroupPerson { _id: string; firstName?: string; lastName?: string; email?: string }
interface JoinRequest { user: GroupPerson; requestedAt: string }
interface GroupItem {
  _id: string
  name: string
  description: string
  language?: string
  level?: string
  members: GroupPerson[]
  creator: GroupPerson
  moderators: string[]
  joinRequests: JoinRequest[]
  maxMembers?: number
}

const copy = {
  en: {
    kicker: 'Community circles',
    title: 'Study Groups',
    text: 'Join language-focused groups run by your teachers, or create a new space for collaborative practice.',
    createGroup: 'Create Group',
    groupName: 'Group name',
    description: 'Description',
    create: 'Create',
    loading: 'Loading groups...',
    empty: 'No study groups yet. Start one!',
    emptyStudent: 'No study groups yet. Check back once a teacher opens one.',
    members: '{count} members',
    joined: 'Joined',
    join: 'Request to join',
    pending: 'Request pending',
    full: 'Group full',
    loadFailed: 'Unable to load groups',
    createSuccess: 'Group created!',
    createFailed: 'Group could not be created',
    joinSuccess: 'Join request sent!',
    joinFailed: 'Could not send join request',
    pendingRequests: 'Pending requests',
    approve: 'Approve',
    reject: 'Reject',
    approveSuccess: 'Request approved',
    approveFailed: 'Could not approve request',
    rejectSuccess: 'Request rejected',
    rejectFailed: 'Could not reject request',
    yourGroup: 'Your group',
    teacherOnlyNote: 'Only teachers can create study groups. Students join with the teacher\'s approval.',
  },
  ru: {
    kicker: 'Круги сообщества',
    title: 'Учебные группы',
    text: 'Присоединяйтесь к группам, которые ведут ваши преподаватели, или создайте новое пространство для практики.',
    createGroup: 'Создать группу',
    groupName: 'Название группы',
    description: 'Описание',
    create: 'Создать',
    loading: 'Загрузка групп...',
    empty: 'Учебных групп пока нет. Создайте первую!',
    emptyStudent: 'Учебных групп пока нет. Загляните позже, когда преподаватель их откроет.',
    members: '{count} участников',
    joined: 'Вы участник',
    join: 'Запросить вступление',
    pending: 'Запрос отправлен',
    full: 'Группа заполнена',
    loadFailed: 'Не удалось загрузить группы',
    createSuccess: 'Группа создана!',
    createFailed: 'Не удалось создать группу',
    joinSuccess: 'Запрос отправлен!',
    joinFailed: 'Не удалось отправить запрос',
    pendingRequests: 'Ожидающие запросы',
    approve: 'Одобрить',
    reject: 'Отклонить',
    approveSuccess: 'Запрос одобрен',
    approveFailed: 'Не удалось одобрить запрос',
    rejectSuccess: 'Запрос отклонён',
    rejectFailed: 'Не удалось отклонить запрос',
    yourGroup: 'Ваша группа',
    teacherOnlyNote: 'Создавать учебные группы могут только преподаватели. Студенты вступают с одобрения преподавателя.',
  },
  uz: {
    kicker: 'Hamjamiyat doiralari',
    title: 'O‘quv guruhlari',
    text: 'O‘qituvchilaringiz yuritadigan guruhlarga qo‘shiling yoki birgalikdagi mashq uchun yangi maydon yarating.',
    createGroup: 'Guruh yaratish',
    groupName: 'Guruh nomi',
    description: 'Tavsif',
    create: 'Yaratish',
    loading: 'Guruhlar yuklanmoqda...',
    empty: 'Hali o‘quv guruhlari yo‘q. Birinchisini boshlang!',
    emptyStudent: 'Hali o‘quv guruhlari yo‘q. O‘qituvchi ochguncha kuting.',
    members: '{count} a’zo',
    joined: 'Qo‘shilgan',
    join: 'Qo‘shilishni so‘rash',
    pending: 'So‘rov yuborilgan',
    full: 'Guruh to‘lgan',
    loadFailed: 'Guruhlarni yuklab bo‘lmadi',
    createSuccess: 'Guruh yaratildi!',
    createFailed: 'Guruhni yaratib bo‘lmadi',
    joinSuccess: 'So‘rov yuborildi!',
    joinFailed: 'So‘rovni yuborib bo‘lmadi',
    pendingRequests: 'Kutilayotgan so‘rovlar',
    approve: 'Tasdiqlash',
    reject: 'Rad etish',
    approveSuccess: 'So‘rov tasdiqlandi',
    approveFailed: 'So‘rovni tasdiqlab bo‘lmadi',
    rejectSuccess: 'So‘rov rad etildi',
    rejectFailed: 'So‘rovni rad etib bo‘lmadi',
    yourGroup: 'Sizning guruhingiz',
    teacherOnlyNote: 'Faqat o‘qituvchilar o‘quv guruhi yarata oladi. O‘quvchilar o‘qituvchi tasdig‘i bilan qo‘shiladi.',
  },
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
  const canManageGroups = user?.role === 'teacher' || user?.role === 'admin'
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', language: 'English', level: 'Beginner' })
  const [pendingAction, setPendingAction] = useState<string | null>(null)

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

  const handleApprove = async (groupId: string, userId: string) => {
    setPendingAction(`${groupId}:${userId}`)
    try {
      await api.post(`/groups/${groupId}/requests/${userId}/approve`)
      toast.success(ui.approveSuccess)
      loadGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.approveFailed)
    } finally {
      setPendingAction(null)
    }
  }

  const handleReject = async (groupId: string, userId: string) => {
    setPendingAction(`${groupId}:${userId}`)
    try {
      await api.post(`/groups/${groupId}/requests/${userId}/reject`)
      toast.success(ui.rejectSuccess)
      loadGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.rejectFailed)
    } finally {
      setPendingAction(null)
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
            {!canManageGroups && <p className="mt-1 text-sm text-muted">{ui.teacherOnlyNote}</p>}
          </div>
          {canManageGroups && (
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
              <FiPlus size={20} /> {ui.createGroup}
            </button>
          )}
        </div>

        {canManageGroups && showForm && (
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
          <div className="atlas-panel p-6 text-muted">{canManageGroups ? ui.empty : ui.emptyStudent}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => {
              const isMember = user ? group.members?.some((member) => member?._id === user.id) : false
              const isManager = user ? group.creator?._id === user.id || group.moderators?.includes(user.id) : false
              const hasPendingRequest = user ? group.joinRequests?.some((req) => req.user?._id === user.id) : false
              const isFull = Boolean(group.maxMembers) && group.members.length >= (group.maxMembers as number)
              return (
                <div key={group._id} className="atlas-panel p-6">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-ink dark:text-white">{group.name}</h3>
                    {isManager && <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">{ui.yourGroup}</span>}
                  </div>
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
                    {!isManager && (
                      <button
                        onClick={() => handleJoin(group._id)}
                        disabled={isMember || hasPendingRequest || isFull}
                        className="btn btn-primary flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {hasPendingRequest && <FiClock size={14} />}
                        {isMember ? ui.joined : hasPendingRequest ? ui.pending : isFull ? ui.full : ui.join}
                      </button>
                    )}
                  </div>

                  {isManager && group.joinRequests?.length > 0 && (
                    <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                      <p className="mb-2 text-sm font-semibold text-ink dark:text-white">{ui.pendingRequests} ({group.joinRequests.length})</p>
                      <div className="space-y-2">
                        {group.joinRequests.filter((request) => request.user?._id).map((request) => (
                          <div key={request.user._id} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
                            <span className="truncate text-sm text-ink dark:text-white">
                              {request.user.firstName} {request.user.lastName}
                            </span>
                            <div className="flex shrink-0 gap-2">
                              <button
                                onClick={() => handleApprove(group._id, request.user._id)}
                                disabled={pendingAction === `${group._id}:${request.user._id}`}
                                className="rounded-full bg-green-100 p-1.5 text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/40 dark:text-green-300"
                                title={ui.approve}
                              >
                                <FiCheck size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(group._id, request.user._id)}
                                disabled={pendingAction === `${group._id}:${request.user._id}`}
                                className="rounded-full bg-red-100 p-1.5 text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/40 dark:text-red-300"
                                title={ui.reject}
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
