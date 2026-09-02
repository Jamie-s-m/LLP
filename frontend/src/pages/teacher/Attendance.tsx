import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiUsers,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiBarChart2,
} from 'react-icons/fi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

interface GroupMember {
  _id: string
  firstName?: string
  lastName?: string
}

interface GroupDetail {
  _id: string
  name: string
  members: GroupMember[]
}

interface AttendanceRecordStudent {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
}

interface AttendanceRecord {
  _id: string
  group: string
  student: AttendanceRecordStudent
  date: string
  status: AttendanceStatus
  notes?: string
  markedBy?: string
}

interface AttendanceSummary {
  groupId: string
  studentId: string
  totalSessions: number
  counts: Record<AttendanceStatus, number>
  attendanceRate: number
}

type RowState = { status: AttendanceStatus; notes: string }

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

const copy = {
  en: {
    loading: 'Loading group...',
    loadFailed: 'Unable to load group',
    groupNotFound: 'This group could not be found.',
    kicker: 'Group attendance',
    text: 'Mark attendance for the selected date, review history, and check individual student summaries.',
    membersEmpty: 'This group has no members yet.',
    dateLabel: 'Session date',
    statusPresent: 'Present',
    statusAbsent: 'Absent',
    statusLate: 'Late',
    statusExcused: 'Excused',
    notesPlaceholder: 'Notes (optional)',
    save: 'Save attendance',
    saving: 'Saving...',
    saveSuccess: 'Attendance saved.',
    skippedSuffix: '{count} record(s) were skipped.',
    saveFailed: 'Could not save attendance',
    historyTitle: 'Attendance history',
    historyEmpty: 'No attendance has been recorded for this group yet.',
    historyLoadFailed: 'Unable to load attendance history',
    summaryLoading: 'Loading summary...',
    summaryFailed: 'Could not load attendance summary',
    totalSessions: 'sessions',
    attendanceRate: 'attendance rate',
  },
  ru: {
    loading: 'Загрузка группы...',
    loadFailed: 'Не удалось загрузить группу',
    groupNotFound: 'Группа не найдена.',
    kicker: 'Посещаемость группы',
    text: 'Отмечайте посещаемость за выбранную дату, просматривайте историю и проверяйте сводку по каждому ученику.',
    membersEmpty: 'В этой группе пока нет участников.',
    dateLabel: 'Дата занятия',
    statusPresent: 'Присутствовал',
    statusAbsent: 'Отсутствовал',
    statusLate: 'Опоздал',
    statusExcused: 'Уважительная причина',
    notesPlaceholder: 'Заметка (необязательно)',
    save: 'Сохранить посещаемость',
    saving: 'Сохранение...',
    saveSuccess: 'Посещаемость сохранена.',
    skippedSuffix: 'Пропущено записей: {count}.',
    saveFailed: 'Не удалось сохранить посещаемость',
    historyTitle: 'История посещаемости',
    historyEmpty: 'Для этой группы пока нет записей о посещаемости.',
    historyLoadFailed: 'Не удалось загрузить историю посещаемости',
    summaryLoading: 'Загрузка сводки...',
    summaryFailed: 'Не удалось загрузить сводку посещаемости',
    totalSessions: 'занятий',
    attendanceRate: 'посещаемость',
  },
  uz: {
    loading: 'Guruh yuklanmoqda...',
    loadFailed: 'Guruhni yuklab bo‘lmadi',
    groupNotFound: 'Guruh topilmadi.',
    kicker: 'Guruh davomati',
    text: 'Tanlangan sana uchun davomatni belgilang, tarixni ko‘rib chiqing va har bir o‘quvchi bo‘yicha xulosani tekshiring.',
    membersEmpty: 'Bu guruhda hali a’zolar yo‘q.',
    dateLabel: 'Dars sanasi',
    statusPresent: 'Keldi',
    statusAbsent: 'Kelmadi',
    statusLate: 'Kechikdi',
    statusExcused: 'Sababli',
    notesPlaceholder: 'Izoh (ixtiyoriy)',
    save: 'Davomatni saqlash',
    saving: 'Saqlanmoqda...',
    saveSuccess: 'Davomat saqlandi.',
    skippedSuffix: '{count} ta yozuv o‘tkazib yuborildi.',
    saveFailed: 'Davomatni saqlab bo‘lmadi',
    historyTitle: 'Davomat tarixi',
    historyEmpty: 'Bu guruh uchun hali davomat yozuvlari yo‘q.',
    historyLoadFailed: 'Davomat tarixini yuklab bo‘lmadi',
    summaryLoading: 'Xulosa yuklanmoqda...',
    summaryFailed: 'Davomat xulosasini yuklab bo‘lmadi',
    totalSessions: 'ta dars',
    attendanceRate: 'davomat foizi',
  },
} as const

const memberName = (person: { firstName?: string; lastName?: string }) =>
  `${person.firstName || ''} ${person.lastName || ''}`.trim()

const todayIso = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Attendance() {
  const { groupId } = useParams()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  const [loadingGroup, setLoadingGroup] = useState(true)
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [date, setDate] = useState(() => todayIso())
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [saving, setSaving] = useState(false)

  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // Keyed per row (not per student) so the marking form and the history section expand
  // independently even when the same student appears in both - the fetched summary itself
  // is still cached once per studentId in `summaries` below.
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [summaries, setSummaries] = useState<Record<string, AttendanceSummary | 'loading' | 'error'>>({})

  useEffect(() => {
    if (!groupId) {
      setLoadingGroup(false)
      return
    }
    setLoadingGroup(true)
    api.get('/groups')
      .then((response) => {
        const groups: GroupDetail[] = response.data.data || []
        const found = groups.find((candidate) => candidate._id === groupId) || null
        setGroup(found)
        if (found) {
          setRows(
            Object.fromEntries(
              found.members.map((member) => [member._id, { status: 'present' as AttendanceStatus, notes: '' }])
            )
          )
        }
      })
      .catch((error) => toast.error(error.response?.data?.message || ui.loadFailed))
      .finally(() => setLoadingGroup(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  const loadHistory = () => {
    if (!groupId) return
    setHistoryLoading(true)
    api.get(`/attendance/${groupId}`)
      .then((response) => setHistory(response.data.data || []))
      .catch((error) => toast.error(error.response?.data?.message || ui.historyLoadFailed))
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  const statusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return ui.statusPresent
      case 'absent': return ui.statusAbsent
      case 'late': return ui.statusLate
      case 'excused': return ui.statusExcused
      default: return status
    }
  }

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setRows((current) => ({ ...current, [studentId]: { status, notes: current[studentId]?.notes || '' } }))
  }

  const updateNotes = (studentId: string, notes: string) => {
    setRows((current) => ({
      ...current,
      [studentId]: { status: current[studentId]?.status || 'present', notes },
    }))
  }

  const toggleSummary = (rowKey: string, studentId: string) => {
    if (!groupId) return
    setExpandedRows((current) => ({ ...current, [rowKey]: !current[rowKey] }))
    if (!summaries[studentId]) {
      setSummaries((current) => ({ ...current, [studentId]: 'loading' }))
      api.get(`/attendance/${groupId}/summary/${studentId}`)
        .then((response) => setSummaries((current) => ({ ...current, [studentId]: response.data.data })))
        .catch((error) => {
          setSummaries((current) => ({ ...current, [studentId]: 'error' }))
          toast.error(error.response?.data?.message || ui.summaryFailed)
        })
    }
  }

  const renderSummary = (studentId: string) => {
    const summary = summaries[studentId]
    if (summary === 'loading' || summary === undefined) {
      return <p className="mt-2 text-sm text-muted">{ui.summaryLoading}</p>
    }
    if (summary === 'error') {
      return <p className="mt-2 text-sm text-muted">{ui.summaryFailed}</p>
    }
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-800/60">
        <span className="inline-flex items-center gap-1 text-ink dark:text-white">
          <FiBarChart2 size={14} className="text-muted" />
          <strong>{summary.totalSessions}</strong> {ui.totalSessions}
        </span>
        <span className="text-success">{ui.statusPresent}: {summary.counts.present}</span>
        <span className="text-error">{ui.statusAbsent}: {summary.counts.absent}</span>
        <span className="text-warning">{ui.statusLate}: {summary.counts.late}</span>
        <span className="text-info">{ui.statusExcused}: {summary.counts.excused}</span>
        <span className="text-ink dark:text-white"><strong>{summary.attendanceRate}%</strong> {ui.attendanceRate}</span>
      </div>
    )
  }

  const handleSave = async () => {
    if (!groupId || !group || group.members.length === 0) return
    setSaving(true)
    try {
      const records = group.members.map((member) => ({
        studentId: member._id,
        status: rows[member._id]?.status || 'present',
        notes: rows[member._id]?.notes || '',
      }))
      const response = await api.post(`/attendance/${groupId}`, { date, records })
      const skipped = response.data.data?.skipped || []
      if (skipped.length > 0) {
        toast.success(`${ui.saveSuccess} ${ui.skippedSuffix.replace('{count}', String(skipped.length))}`)
      } else {
        toast.success(ui.saveSuccess)
      }
      loadHistory()
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const groupedHistory = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>()
    history.forEach((record) => {
      const key = (record.date || '').slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(record)
    })
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
  }, [history])

  if (loadingGroup) {
    return (
      <div className="atlas-page px-4 py-10">
        <div className="mx-auto max-w-5xl atlas-panel p-6 text-center text-muted">{ui.loading}</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="atlas-page px-4 py-10">
        <div className="mx-auto max-w-5xl atlas-panel p-6 text-center text-muted">{ui.groupNotFound}</div>
      </div>
    )
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{group.name}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="atlas-panel mb-8 p-6">
          <div className="mb-5 max-w-xs">
            <label className="label" htmlFor="attendance-date">{ui.dateLabel}</label>
            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                id="attendance-date"
                type="date"
                className="input pl-9"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>

          {group.members.length === 0 ? (
            <p className="text-sm text-muted">{ui.membersEmpty}</p>
          ) : (
            <>
              <div className="space-y-3">
                {group.members.map((member) => {
                  const row = rows[member._id] || { status: 'present' as AttendanceStatus, notes: '' }
                  const rowKey = `member-${member._id}`
                  const isExpanded = !!expandedRows[rowKey]
                  return (
                    <div key={member._id} className="rounded-lg border border-[var(--border)] px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSummary(rowKey, member._id)}
                          className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:underline dark:text-white"
                        >
                          <FiUsers size={14} className="text-muted" />
                          {memberName(member)}
                          {isExpanded ? <FiChevronUp size={14} className="text-muted" /> : <FiChevronDown size={14} className="text-muted" />}
                        </button>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_ORDER.map((status) => (
                            <button
                              key={status}
                              type="button"
                              aria-pressed={row.status === status}
                              onClick={() => updateStatus(member._id, status)}
                              className={`btn btn-sm ${row.status === status ? 'btn-primary' : 'btn-outline'}`}
                            >
                              {statusLabel(status)}
                            </button>
                          ))}
                        </div>
                        <input
                          className="input w-full sm:w-56"
                          placeholder={ui.notesPlaceholder}
                          value={row.notes}
                          onChange={(event) => updateNotes(member._id, event.target.value)}
                        />
                      </div>
                      {isExpanded ? renderSummary(member._id) : null}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {saving ? ui.saving : ui.save}
                </button>
              </div>
            </>
          )}
        </div>

        <h2 className="mb-4 text-2xl font-bold text-ink dark:text-white">{ui.historyTitle}</h2>
        {historyLoading ? (
          <div className="atlas-panel p-6 text-center text-muted">{ui.loading}</div>
        ) : groupedHistory.length === 0 ? (
          <div className="atlas-panel p-6 text-center text-muted">{ui.historyEmpty}</div>
        ) : (
          <div className="space-y-4">
            {groupedHistory.map(([dateKey, records]) => (
              <div key={dateKey} className="atlas-panel p-5">
                <p className="mb-3 inline-flex items-center gap-2 font-semibold text-ink dark:text-white">
                  <FiCalendar size={16} className="text-muted" />
                  {dateKey}
                </p>
                <div className="space-y-2">
                  {records.map((record) => {
                    const rowKey = `record-${record._id}`
                    const isExpanded = !!expandedRows[rowKey]
                    return (
                      <div key={record._id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSummary(rowKey, record.student._id)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:underline dark:text-white"
                          >
                            <FiUsers size={14} className="text-muted" />
                            {memberName(record.student)}
                            {isExpanded ? <FiChevronUp size={14} className="text-muted" /> : <FiChevronDown size={14} className="text-muted" />}
                          </button>
                          <span className="text-sm text-muted">{statusLabel(record.status)}</span>
                        </div>
                        {record.notes ? <p className="mt-1 text-sm text-muted">{record.notes}</p> : null}
                        {isExpanded ? renderSummary(record.student._id) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
