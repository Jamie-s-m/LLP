import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiClipboard,
  FiPlus,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiCalendar,
} from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'

interface Lesson {
  _id: string
  title: string
  order: number
}

interface Exercise {
  _id: string
  title: string
  type: string
  points: number
}

interface EnrolledStudent {
  studentId: string
  firstName: string
  lastName: string
  email: string
  progressPercentage: number
  isCompleted: boolean
}

interface Group {
  _id: string
  name: string
  creator: { _id: string; firstName: string; lastName: string }
  moderators: string[]
  members: { _id: string; firstName: string; lastName: string }[]
}

interface Assignment {
  _id: string
  title: string
  description?: string
  lesson?: string
  exercise?: string
  students?: string[]
  group?: string
  dueDate?: string
  completedCount: number
  totalCount: number
  createdAt: string
}

interface AssignmentStudentBreakdown {
  studentId: string
  name: string
  completed: boolean
}

interface AssignmentDetail extends Omit<Assignment, 'students'> {
  students: AssignmentStudentBreakdown[]
}

const copy = {
  en: {
    kicker: 'Course assignments',
    title: 'Assignments',
    text: 'Assign lessons or exercises to individual students or a whole group, and track who has finished.',
    loading: 'Loading assignments...',
    loadFailed: 'Assignments could not be loaded',
    empty: 'No assignments yet. Create the first one below.',
    newAssignment: 'New assignment',
    cancel: 'Cancel',
    dueLabel: 'Due',
    completedOf: '{done} of {total} completed',
    deleteConfirm: 'Delete this assignment? This cannot be undone.',
    deleteFailed: 'Assignment could not be deleted',
    deleted: 'Assignment deleted',
    details: 'Details',
    hide: 'Hide',
    detailsFailed: 'Assignment details could not be loaded',
    studentDone: 'Completed',
    studentPending: 'Not yet',
    formTitleLabel: 'Title',
    formTitlePlaceholder: 'e.g. Finish Lesson 3 vocabulary',
    formDescLabel: 'Description (optional)',
    formDescPlaceholder: 'Any extra instructions for students...',
    targetTypeLabel: 'Assign',
    targetLesson: 'Lesson',
    targetExercise: 'Exercise',
    lessonLabel: 'Lesson',
    selectLesson: 'Select a lesson',
    exerciseLabel: 'Exercise',
    selectExercise: 'Select an exercise',
    noExercises: 'This lesson has no exercises yet',
    audienceLabel: 'Assign to',
    audienceStudents: 'Students',
    audienceGroup: 'Group',
    studentsLabel: 'Students',
    noStudents: 'No students are enrolled in this course yet.',
    groupLabel: 'Group',
    selectGroup: 'Select a group',
    noGroups: 'You do not manage any groups yet.',
    dueDateLabel: 'Due date (optional)',
    submit: 'Create assignment',
    submitting: 'Creating...',
    created: 'Assignment created',
    createFailed: 'Assignment could not be created',
    titleRequired: 'A title is required',
    targetRequired: 'Choose a lesson or an exercise',
    audienceRequired: 'Choose at least one student, or a group',
    loadCourseFailed: 'Course could not be loaded',
  },
  ru: {
    kicker: 'Задания по курсу',
    title: 'Задания',
    text: 'Назначайте уроки или упражнения отдельным ученикам или целой группе и отслеживайте, кто уже справился.',
    loading: 'Загрузка заданий...',
    loadFailed: 'Не удалось загрузить задания',
    empty: 'Заданий пока нет. Создайте первое ниже.',
    newAssignment: 'Новое задание',
    cancel: 'Отмена',
    dueLabel: 'Срок',
    completedOf: 'Выполнено {done} из {total}',
    deleteConfirm: 'Удалить это задание? Отменить это будет нельзя.',
    deleteFailed: 'Не удалось удалить задание',
    deleted: 'Задание удалено',
    details: 'Подробнее',
    hide: 'Скрыть',
    detailsFailed: 'Не удалось загрузить подробности задания',
    studentDone: 'Выполнено',
    studentPending: 'Ещё нет',
    formTitleLabel: 'Название',
    formTitlePlaceholder: 'например, Выучить словарь урока 3',
    formDescLabel: 'Описание (необязательно)',
    formDescPlaceholder: 'Дополнительные инструкции для учеников...',
    targetTypeLabel: 'Назначить',
    targetLesson: 'Урок',
    targetExercise: 'Упражнение',
    lessonLabel: 'Урок',
    selectLesson: 'Выберите урок',
    exerciseLabel: 'Упражнение',
    selectExercise: 'Выберите упражнение',
    noExercises: 'В этом уроке пока нет упражнений',
    audienceLabel: 'Назначить для',
    audienceStudents: 'Учеников',
    audienceGroup: 'Группы',
    studentsLabel: 'Ученики',
    noStudents: 'На этот курс пока никто не записан.',
    groupLabel: 'Группа',
    selectGroup: 'Выберите группу',
    noGroups: 'Вы пока не управляете ни одной группой.',
    dueDateLabel: 'Срок сдачи (необязательно)',
    submit: 'Создать задание',
    submitting: 'Создание...',
    created: 'Задание создано',
    createFailed: 'Не удалось создать задание',
    titleRequired: 'Укажите название',
    targetRequired: 'Выберите урок или упражнение',
    audienceRequired: 'Выберите хотя бы одного ученика или группу',
    loadCourseFailed: 'Не удалось загрузить курс',
  },
  uz: {
    kicker: 'Kurs topshiriqlari',
    title: 'Topshiriqlar',
    text: 'Darslar yoki mashqlarni alohida o‘quvchilarga yoki butun guruhga tayinlang va kim bajarganini kuzating.',
    loading: 'Topshiriqlar yuklanmoqda...',
    loadFailed: 'Topshiriqlarni yuklab bo‘lmadi',
    empty: 'Hozircha topshiriq yo‘q. Birinchisini quyida yarating.',
    newAssignment: 'Yangi topshiriq',
    cancel: 'Bekor qilish',
    dueLabel: 'Muddat',
    completedOf: '{total} tadan {done} tasi bajarildi',
    deleteConfirm: 'Ushbu topshiriqni o‘chirasizmi? Buni bekor qilib bo‘lmaydi.',
    deleteFailed: 'Topshiriqni o‘chirib bo‘lmadi',
    deleted: 'Topshiriq o‘chirildi',
    details: 'Batafsil',
    hide: 'Yashirish',
    detailsFailed: 'Topshiriq tafsilotlarini yuklab bo‘lmadi',
    studentDone: 'Bajarildi',
    studentPending: 'Hali emas',
    formTitleLabel: 'Sarlavha',
    formTitlePlaceholder: 'masalan, 3-dars lug‘atini tugatish',
    formDescLabel: 'Tavsif (ixtiyoriy)',
    formDescPlaceholder: 'O‘quvchilar uchun qo‘shimcha ko‘rsatmalar...',
    targetTypeLabel: 'Tayinlanadigan',
    targetLesson: 'Dars',
    targetExercise: 'Mashq',
    lessonLabel: 'Dars',
    selectLesson: 'Darsni tanlang',
    exerciseLabel: 'Mashq',
    selectExercise: 'Mashqni tanlang',
    noExercises: 'Bu darsda hali mashqlar yo‘q',
    audienceLabel: 'Kimga tayinlanadi',
    audienceStudents: 'O‘quvchilarga',
    audienceGroup: 'Guruhga',
    studentsLabel: 'O‘quvchilar',
    noStudents: 'Bu kursga hali hech kim yozilmagan.',
    groupLabel: 'Guruh',
    selectGroup: 'Guruhni tanlang',
    noGroups: 'Siz hali birorta guruhni boshqarmayapsiz.',
    dueDateLabel: 'Topshirish muddati (ixtiyoriy)',
    submit: 'Topshiriq yaratish',
    submitting: 'Yaratilmoqda...',
    created: 'Topshiriq yaratildi',
    createFailed: 'Topshiriqni yaratib bo‘lmadi',
    titleRequired: 'Sarlavha kiritilishi shart',
    targetRequired: 'Dars yoki mashqni tanlang',
    audienceRequired: 'Kamida bitta o‘quvchi yoki guruhni tanlang',
    loadCourseFailed: 'Kursni yuklab bo‘lmadi',
  },
} as const

export default function Assignments() {
  const { courseId } = useParams()
  const { user } = useAuthStore()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  const [loading, setLoading] = useState(true)
  const [courseTitle, setCourseTitle] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsById, setDetailsById] = useState<Record<string, AssignmentDetail>>({})
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [targetType, setTargetType] = useState<'lesson' | 'exercise'>('lesson')
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exercisesLoading, setExercisesLoading] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [audienceType, setAudienceType] = useState<'students' | 'group'>('students')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!courseId) return
    setLoading(true)

    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get('/assignments/course/' + courseId),
      api.get(`/courses/${courseId}/students`).catch(() => ({ data: { data: [] } })),
      api.get('/groups').catch(() => ({ data: { data: [] } })),
    ])
      .then(([courseRes, assignmentsRes, studentsRes, groupsRes]) => {
        setCourseTitle(courseRes.data.data.course?.title || '')
        setLessons(courseRes.data.data.lessons || [])
        setAssignments(assignmentsRes.data.data || [])
        setStudents(studentsRes.data.data || [])

        const allGroups: Group[] = groupsRes.data.data || []
        const managed = allGroups.filter(
          (group) => group.creator?._id === user?.id || (group.moderators || []).includes(user?.id || '')
        )
        setGroups(managed)
      })
      .catch((error) => toast.error(error.response?.data?.message || ui.loadCourseFailed))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  useEffect(() => {
    if (targetType !== 'exercise' || !selectedLessonId) {
      setExercises([])
      setSelectedExerciseId('')
      return
    }
    setExercisesLoading(true)
    api.get('/exercises', { params: { lessonId: selectedLessonId } })
      .then((response) => setExercises(response.data.data || []))
      .catch(() => setExercises([]))
      .finally(() => setExercisesLoading(false))
  }, [targetType, selectedLessonId])

  const toggleExpand = async (assignmentId: string) => {
    if (expandedId === assignmentId) {
      setExpandedId(null)
      return
    }
    setExpandedId(assignmentId)
    if (detailsById[assignmentId]) return
    setDetailsLoadingId(assignmentId)
    try {
      const response = await api.get(`/assignments/${assignmentId}`)
      setDetailsById((current) => ({ ...current, [assignmentId]: response.data.data }))
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.detailsFailed)
      setExpandedId(null)
    } finally {
      setDetailsLoadingId(null)
    }
  }

  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm(ui.deleteConfirm)) return
    try {
      await api.delete(`/assignments/${assignmentId}`)
      setAssignments((current) => current.filter((assignment) => assignment._id !== assignmentId))
      if (expandedId === assignmentId) setExpandedId(null)
      toast.success(ui.deleted)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.deleteFailed)
    }
  }

  const toggleStudentSelected = (studentId: string) => {
    setSelectedStudentIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]
    )
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setTargetType('lesson')
    setSelectedLessonId('')
    setExercises([])
    setSelectedExerciseId('')
    setAudienceType('students')
    setSelectedStudentIds([])
    setSelectedGroupId('')
    setDueDate('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formTitle.trim()) {
      toast.error(ui.titleRequired)
      return
    }
    if (targetType === 'lesson' && !selectedLessonId) {
      toast.error(ui.targetRequired)
      return
    }
    if (targetType === 'exercise' && !selectedExerciseId) {
      toast.error(ui.targetRequired)
      return
    }
    if (audienceType === 'students' && selectedStudentIds.length === 0) {
      toast.error(ui.audienceRequired)
      return
    }
    if (audienceType === 'group' && !selectedGroupId) {
      toast.error(ui.audienceRequired)
      return
    }

    const payload: Record<string, any> = {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      courseId,
    }
    if (targetType === 'lesson') {
      payload.lessonId = selectedLessonId
    } else {
      payload.exerciseId = selectedExerciseId
    }
    if (audienceType === 'students') {
      payload.studentIds = selectedStudentIds
    } else {
      payload.groupId = selectedGroupId
    }
    if (dueDate) {
      payload.dueDate = dueDate
    }

    setSubmitting(true)
    try {
      const response = await api.post('/assignments', payload)
      setAssignments((current) => [response.data.data, ...current])
      toast.success(ui.created)
      resetForm()
      setShowForm(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.createFailed)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="atlas-page px-4 py-10">
        <div className="mx-auto max-w-5xl atlas-panel p-6 text-center text-muted">{ui.loading}</div>
      </div>
    )
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{courseTitle ? `${ui.title} — ${courseTitle}` : ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-2"
            onClick={() => setShowForm((current) => !current)}
          >
            {showForm ? <FiXCircle size={18} /> : <FiPlus size={18} />}
            {showForm ? ui.cancel : ui.newAssignment}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="atlas-panel mb-8 p-6 space-y-5">
            <div>
              <label className="label" htmlFor="assignment-title">{ui.formTitleLabel}</label>
              <input
                id="assignment-title"
                className="input"
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder={ui.formTitlePlaceholder}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="assignment-description">{ui.formDescLabel}</label>
              <textarea
                id="assignment-description"
                className="input min-h-20"
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                placeholder={ui.formDescPlaceholder}
              />
            </div>

            <div>
              <label className="label">{ui.targetTypeLabel}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('lesson')}
                  className={`btn btn-sm ${targetType === 'lesson' ? 'btn-primary' : 'btn-outline'}`}
                >
                  {ui.targetLesson}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('exercise')}
                  className={`btn btn-sm ${targetType === 'exercise' ? 'btn-primary' : 'btn-outline'}`}
                >
                  {ui.targetExercise}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="assignment-lesson">{ui.lessonLabel}</label>
              <select
                id="assignment-lesson"
                className="input"
                value={selectedLessonId}
                onChange={(event) => setSelectedLessonId(event.target.value)}
              >
                <option value="">{ui.selectLesson}</option>
                {lessons.map((lesson) => (
                  <option key={lesson._id} value={lesson._id}>
                    {lesson.order}. {lesson.title}
                  </option>
                ))}
              </select>
            </div>

            {targetType === 'exercise' ? (
              <div>
                <label className="label" htmlFor="assignment-exercise">{ui.exerciseLabel}</label>
                {!selectedLessonId ? (
                  <p className="text-sm text-muted">{ui.selectLesson}</p>
                ) : exercisesLoading ? (
                  <p className="text-sm text-muted">{ui.loading}</p>
                ) : exercises.length === 0 ? (
                  <p className="text-sm text-muted">{ui.noExercises}</p>
                ) : (
                  <select
                    id="assignment-exercise"
                    className="input"
                    value={selectedExerciseId}
                    onChange={(event) => setSelectedExerciseId(event.target.value)}
                  >
                    <option value="">{ui.selectExercise}</option>
                    {exercises.map((exercise) => (
                      <option key={exercise._id} value={exercise._id}>
                        {exercise.title} ({exercise.type}, {exercise.points} pts)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : null}

            <div>
              <label className="label">{ui.audienceLabel}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceType('students')}
                  className={`btn btn-sm ${audienceType === 'students' ? 'btn-primary' : 'btn-outline'}`}
                >
                  {ui.audienceStudents}
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceType('group')}
                  className={`btn btn-sm ${audienceType === 'group' ? 'btn-primary' : 'btn-outline'}`}
                >
                  {ui.audienceGroup}
                </button>
              </div>
            </div>

            {audienceType === 'students' ? (
              <div>
                <label className="label">{ui.studentsLabel}</label>
                {students.length === 0 ? (
                  <p className="text-sm text-muted">{ui.noStudents}</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] p-3 space-y-2">
                    {students.map((student) => (
                      <label key={student.studentId} className="flex items-center gap-3 text-sm text-ink dark:text-white">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.studentId)}
                          onChange={() => toggleStudentSelected(student.studentId)}
                        />
                        {student.firstName} {student.lastName}
                        <span className="text-muted">({student.email})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="assignment-group">{ui.groupLabel}</label>
                {groups.length === 0 ? (
                  <p className="text-sm text-muted">{ui.noGroups}</p>
                ) : (
                  <select
                    id="assignment-group"
                    className="input"
                    value={selectedGroupId}
                    onChange={(event) => setSelectedGroupId(event.target.value)}
                  >
                    <option value="">{ui.selectGroup}</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name} ({group.members?.length || 0})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="label" htmlFor="assignment-due-date">{ui.dueDateLabel}</label>
              <input
                id="assignment-due-date"
                type="date"
                className="input"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full disabled:opacity-50">
              {submitting ? ui.submitting : ui.submit}
            </button>
          </form>
        ) : null}

        {assignments.length === 0 ? (
          <div className="atlas-panel p-6 text-center text-muted">{ui.empty}</div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const isExpanded = expandedId === assignment._id
              const detail = detailsById[assignment._id]
              return (
                <div key={assignment._id} className="atlas-panel p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FiClipboard className="shrink-0 text-primary-500" size={18} />
                        <h2 className="text-lg font-bold text-ink dark:text-white break-words">{assignment.title}</h2>
                      </div>
                      {assignment.description ? (
                        <p className="text-sm text-muted mb-2">{assignment.description}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span className="inline-flex items-center gap-1">
                          <FiCheckCircle size={14} />
                          {ui.completedOf
                            .replace('{done}', String(assignment.completedCount))
                            .replace('{total}', String(assignment.totalCount))}
                        </span>
                        {assignment.dueDate ? (
                          <span className="inline-flex items-center gap-1">
                            <FiCalendar size={14} />
                            {ui.dueLabel}: {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExpand(assignment._id)}
                        className="btn btn-outline btn-sm inline-flex items-center gap-1"
                      >
                        {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                        {isExpanded ? ui.hide : ui.details}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(assignment._id)}
                        aria-label="Delete assignment"
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 border-t border-[var(--border)] pt-4">
                      {detailsLoadingId === assignment._id ? (
                        <p className="text-sm text-muted">{ui.loading}</p>
                      ) : detail ? (
                        <div className="space-y-2">
                          {(detail.students || []).map((student) => (
                            <div
                              key={student.studentId}
                              className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                            >
                              <span className="inline-flex items-center gap-2 text-ink dark:text-white">
                                <FiUsers size={14} className="text-muted" />
                                {student.name}
                              </span>
                              {student.completed ? (
                                <span className="inline-flex items-center gap-1 text-success">
                                  <FiCheckCircle size={14} /> {ui.studentDone}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-muted">
                                  <FiXCircle size={14} /> {ui.studentPending}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
