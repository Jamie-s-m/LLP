import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit3 } from 'react-icons/fi'
import api from '../../services/api'

interface VocabRow { word: string; translation: string; pronunciation: string; examples: string }
interface GrammarRow { rule: string; explanation: string; examples: string }
interface ExerciseItem {
  _id: string
  title: string
  type: string
  question: string
  points: number
  options?: string[]
  correctAnswer?: any
  correctAnswers?: string[]
  audioFile?: string
  transcript?: string
  instructions?: string
}

const EXERCISE_TYPES = [
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'fill_blank', label: 'Fill in the blank' },
  { value: 'listening', label: 'Listening' },
  { value: 'speaking', label: 'Speaking (manually reviewed)' },
]

const emptyExerciseDraft = {
  type: 'multiple_choice',
  question: '',
  options: ['', '', '', ''],
  correctAnswerIndex: 0,
  correctAnswersText: '',
  audioFile: '',
  transcript: '',
  instructions: '',
  points: 10,
}

export default function LessonEditor() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [courseId, setCourseId] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<'text' | 'video' | 'audio' | 'interactive'>('text')
  const [mediaUrl, setMediaUrl] = useState('')
  const [duration, setDuration] = useState<number | ''>('')
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy')
  const [vocabulary, setVocabulary] = useState<VocabRow[]>([])
  const [grammar, setGrammar] = useState<GrammarRow[]>([])

  const [exercises, setExercises] = useState<ExerciseItem[]>([])
  const [exerciseDraft, setExerciseDraft] = useState({ ...emptyExerciseDraft })
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [savingExercise, setSavingExercise] = useState(false)

  const load = () => {
    if (!lessonId) return
    setLoading(true)
    api.get(`/lessons/${lessonId}`)
      .then((response) => {
        const data = response.data.data
        setCourseId(data.course)
        setTitle(data.title || '')
        setDescription(data.description || '')
        setContent(data.content || '')
        setContentType(data.contentType || 'text')
        setMediaUrl(data.mediaUrl || '')
        setDuration(data.duration || '')
        setDifficulty(data.difficulty || 'Easy')
        setVocabulary((data.vocabulary || []).map((item: any) => ({
          word: item.word || '',
          translation: item.translation || '',
          pronunciation: item.pronunciation || '',
          examples: (item.examples || []).join('\n'),
        })))
        setGrammar((data.grammar || []).map((item: any) => ({
          rule: item.rule || '',
          explanation: item.explanation || '',
          examples: (item.examples || []).join('\n'),
        })))
        setExercises(data.exercises || [])
      })
      .catch(() => toast.error('Lesson could not be loaded'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [lessonId])

  const handleSaveLesson = async () => {
    setSaving(true)
    try {
      await api.put(`/lessons/${lessonId}`, {
        title,
        description,
        content,
        contentType,
        mediaUrl,
        duration: duration === '' ? undefined : Number(duration),
        difficulty,
        vocabulary: vocabulary
          .filter((row) => row.word.trim())
          .map((row) => ({ ...row, examples: row.examples.split('\n').map((line) => line.trim()).filter(Boolean) })),
        grammar: grammar
          .filter((row) => row.rule.trim())
          .map((row) => ({ ...row, examples: row.examples.split('\n').map((line) => line.trim()).filter(Boolean) })),
      })
      toast.success('Lesson saved')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lesson could not be saved')
    } finally {
      setSaving(false)
    }
  }

  const resetExerciseDraft = () => {
    setExerciseDraft({ ...emptyExerciseDraft, options: ['', '', '', ''] })
    setEditingExerciseId(null)
  }

  const startEditExercise = async (exerciseId: string) => {
    try {
      const response = await api.get(`/exercises/${exerciseId}`)
      const data = response.data.data
      setEditingExerciseId(exerciseId)
      setExerciseDraft({
        type: data.type,
        question: data.question || '',
        options: data.options && data.options.length > 0 ? data.options : ['', '', '', ''],
        correctAnswerIndex: typeof data.correctAnswer === 'number' ? data.correctAnswer : (data.options || []).indexOf(data.correctAnswer),
        correctAnswersText: (data.correctAnswers || []).join(', '),
        audioFile: data.audioFile || '',
        transcript: data.transcript || '',
        instructions: data.instructions || '',
        points: data.points || 10,
      })
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    } catch {
      toast.error('Exercise could not be loaded')
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!window.confirm('Delete this exercise?')) return
    try {
      await api.delete(`/exercises/${exerciseId}`)
      setExercises((current) => current.filter((exercise) => exercise._id !== exerciseId))
      if (editingExerciseId === exerciseId) resetExerciseDraft()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Exercise could not be deleted')
    }
  }

  const handleSubmitExercise = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!exerciseDraft.question.trim()) {
      toast.error('A question is required')
      return
    }

    const payload: Record<string, any> = {
      lessonId,
      title: exerciseDraft.question.slice(0, 60),
      type: exerciseDraft.type,
      question: exerciseDraft.question,
      instructions: exerciseDraft.instructions,
      points: Number(exerciseDraft.points) || 10,
    }

    if (exerciseDraft.type === 'multiple_choice' || exerciseDraft.type === 'listening') {
      const cleanOptions = exerciseDraft.options.map((option) => option.trim()).filter(Boolean)
      if (cleanOptions.length < 2) {
        toast.error('At least 2 options are required')
        return
      }
      payload.options = cleanOptions
      payload.correctAnswer = exerciseDraft.correctAnswerIndex
      if (exerciseDraft.type === 'listening') {
        payload.audioFile = exerciseDraft.audioFile
        payload.transcript = exerciseDraft.transcript
      }
    } else if (exerciseDraft.type === 'fill_blank') {
      const answers = exerciseDraft.correctAnswersText.split(',').map((value) => value.trim()).filter(Boolean)
      if (answers.length === 0) {
        toast.error('At least one accepted answer is required')
        return
      }
      payload.sentenceTemplate = exerciseDraft.question
      payload.correctAnswers = answers
    }
    // speaking exercises need no correct-answer fields - they're graded by a teacher after submission.

    setSavingExercise(true)
    try {
      if (editingExerciseId) {
        const response = await api.put(`/exercises/${editingExerciseId}`, payload)
        setExercises((current) => current.map((exercise) => (exercise._id === editingExerciseId ? response.data.data : exercise)))
        toast.success('Exercise updated')
      } else {
        const response = await api.post('/exercises', payload)
        setExercises((current) => [...current, response.data.data])
        toast.success('Exercise added')
      }
      resetExerciseDraft()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Exercise could not be saved')
    } finally {
      setSavingExercise(false)
    }
  }

  if (loading) {
    return <div className="atlas-page px-4 py-12 text-center"><div className="mx-auto max-w-3xl atlas-panel p-6 text-muted">Loading lesson editor...</div></div>
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" aria-label="Back">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <p className="atlas-kicker">Lesson editor</p>
            <h1 className="text-2xl font-bold text-ink dark:text-white">{title || 'Edit lesson'}</h1>
          </div>
        </div>

        {/* Lesson basics */}
        <div className="atlas-panel mb-6 p-6 space-y-4">
          <h2 className="text-lg font-bold text-ink dark:text-white">Lesson content</h2>
          <div>
            <label className="label" htmlFor="lesson-title">Title</label>
            <input id="lesson-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="lesson-description">Description</label>
            <textarea id="lesson-description" className="input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="lesson-content">Lesson content (overview text students read)</label>
            <textarea id="lesson-content" className="input min-h-32" value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="lesson-content-type">Content type</label>
              <select id="lesson-content-type" className="input" value={contentType} onChange={(e) => setContentType(e.target.value as any)}>
                <option value="text">Text</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="interactive">Interactive</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="lesson-duration">Duration (min)</label>
              <input id="lesson-duration" type="number" min={1} className="input" value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="label" htmlFor="lesson-difficulty">Difficulty</label>
              <select id="lesson-difficulty" className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
          {contentType === 'video' || contentType === 'audio' ? (
            <div>
              <label className="label" htmlFor="lesson-media-url">{contentType === 'video' ? 'Video URL (YouTube or Vimeo link)' : 'Audio file URL'}</label>
              <input id="lesson-media-url" className="input" placeholder="https://www.youtube.com/watch?v=..." value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
            </div>
          ) : null}
        </div>

        {/* Vocabulary */}
        <div className="atlas-panel mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink dark:text-white">Vocabulary</h2>
            <button type="button" className="btn btn-outline btn-sm inline-flex items-center gap-1" onClick={() => setVocabulary((rows) => [...rows, { word: '', translation: '', pronunciation: '', examples: '' }])}>
              <FiPlus size={16} /> Add word
            </button>
          </div>
          <div className="space-y-4">
            {vocabulary.map((row, index) => (
              <div key={index} className="rounded-xl border border-[var(--border)] p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                  <input className="input" aria-label={`Vocabulary word ${index + 1}`} placeholder="Word" value={row.word} onChange={(e) => setVocabulary((rows) => rows.map((r, i) => (i === index ? { ...r, word: e.target.value } : r)))} />
                  <input className="input" aria-label={`Translation for word ${index + 1}`} placeholder="Translation" value={row.translation} onChange={(e) => setVocabulary((rows) => rows.map((r, i) => (i === index ? { ...r, translation: e.target.value } : r)))} />
                  <input className="input" aria-label={`Pronunciation for word ${index + 1}`} placeholder="Pronunciation" value={row.pronunciation} onChange={(e) => setVocabulary((rows) => rows.map((r, i) => (i === index ? { ...r, pronunciation: e.target.value } : r)))} />
                </div>
                <textarea className="input min-h-16 mb-2" aria-label={`Example sentences for word ${index + 1}`} placeholder="Example sentences (one per line)" value={row.examples} onChange={(e) => setVocabulary((rows) => rows.map((r, i) => (i === index ? { ...r, examples: e.target.value } : r)))} />
                <button type="button" className="text-sm text-red-600 inline-flex items-center gap-1" onClick={() => setVocabulary((rows) => rows.filter((_, i) => i !== index))}>
                  <FiTrash2 size={14} /> Remove
                </button>
              </div>
            ))}
            {vocabulary.length === 0 ? <p className="text-sm text-muted">No vocabulary yet.</p> : null}
          </div>
        </div>

        {/* Grammar */}
        <div className="atlas-panel mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink dark:text-white">Grammar</h2>
            <button type="button" className="btn btn-outline btn-sm inline-flex items-center gap-1" onClick={() => setGrammar((rows) => [...rows, { rule: '', explanation: '', examples: '' }])}>
              <FiPlus size={16} /> Add rule
            </button>
          </div>
          <div className="space-y-4">
            {grammar.map((row, index) => (
              <div key={index} className="rounded-xl border border-[var(--border)] p-4">
                <input className="input mb-2" aria-label={`Grammar rule ${index + 1}`} placeholder="Rule (e.g. Present Perfect)" value={row.rule} onChange={(e) => setGrammar((rows) => rows.map((r, i) => (i === index ? { ...r, rule: e.target.value } : r)))} />
                <textarea className="input min-h-16 mb-2" aria-label={`Explanation for rule ${index + 1}`} placeholder="Explanation" value={row.explanation} onChange={(e) => setGrammar((rows) => rows.map((r, i) => (i === index ? { ...r, explanation: e.target.value } : r)))} />
                <textarea className="input min-h-16 mb-2" aria-label={`Example sentences for rule ${index + 1}`} placeholder="Example sentences (one per line)" value={row.examples} onChange={(e) => setGrammar((rows) => rows.map((r, i) => (i === index ? { ...r, examples: e.target.value } : r)))} />
                <button type="button" className="text-sm text-red-600 inline-flex items-center gap-1" onClick={() => setGrammar((rows) => rows.filter((_, i) => i !== index))}>
                  <FiTrash2 size={14} /> Remove
                </button>
              </div>
            ))}
            {grammar.length === 0 ? <p className="text-sm text-muted">No grammar rules yet.</p> : null}
          </div>
        </div>

        <button onClick={handleSaveLesson} disabled={saving} className="btn btn-primary w-full mb-10">
          {saving ? 'Saving...' : 'Save lesson content'}
        </button>

        {/* Exercises */}
        <div className="atlas-panel mb-6 p-6">
          <h2 className="mb-4 text-lg font-bold text-ink dark:text-white">Exercises</h2>
          <div className="space-y-3 mb-6">
            {exercises.map((exercise) => (
              <div key={exercise._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4">
                <div className="min-w-0 flex-1 break-words">
                  <p className="text-xs uppercase tracking-wide text-muted">{EXERCISE_TYPES.find((t) => t.value === exercise.type)?.label || exercise.type}</p>
                  <p className="font-medium text-ink dark:text-white">{exercise.question}</p>
                  <p className="text-xs text-muted">+{exercise.points} pts</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEditExercise(exercise._id)} className="flex h-11 w-11 items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg" aria-label="Edit exercise">
                    <FiEdit3 size={18} />
                  </button>
                  <button onClick={() => handleDeleteExercise(exercise._id)} className="flex h-11 w-11 items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600" aria-label="Delete exercise">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {exercises.length === 0 ? <p className="text-sm text-muted">No exercises yet. Add the first one below.</p> : null}
          </div>

          <form onSubmit={handleSubmitExercise} className="space-y-4 rounded-xl border border-dashed border-[var(--border)] p-4">
            <h3 className="font-semibold text-ink dark:text-white">{editingExerciseId ? 'Edit exercise' : 'Add exercise'}</h3>
            <div>
              <label className="label" htmlFor="exercise-type">Type</label>
              <select
                id="exercise-type"
                className="input"
                value={exerciseDraft.type}
                onChange={(e) => setExerciseDraft((draft) => ({ ...draft, type: e.target.value }))}
                disabled={!!editingExerciseId}
              >
                {EXERCISE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="exercise-question">{exerciseDraft.type === 'fill_blank' ? 'Sentence (use ___ for the blank)' : 'Question'}</label>
              <input id="exercise-question" className="input" value={exerciseDraft.question} onChange={(e) => setExerciseDraft((draft) => ({ ...draft, question: e.target.value }))} required />
            </div>
            {exerciseDraft.type === 'speaking' ? (
              <div>
                <label className="label" htmlFor="exercise-instructions">Instructions (optional)</label>
                <textarea id="exercise-instructions" className="input min-h-16" value={exerciseDraft.instructions} onChange={(e) => setExerciseDraft((draft) => ({ ...draft, instructions: e.target.value }))} />
              </div>
            ) : null}
            {exerciseDraft.type === 'multiple_choice' || exerciseDraft.type === 'listening' ? (
              <div className="space-y-2">
                <label className="label">Options (select the correct one)</label>
                {exerciseDraft.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      aria-label={`Mark option ${index + 1} as the correct answer`}
                      checked={exerciseDraft.correctAnswerIndex === index}
                      onChange={() => setExerciseDraft((draft) => ({ ...draft, correctAnswerIndex: index }))}
                    />
                    <input
                      className="input"
                      aria-label={`Option ${index + 1}`}
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => setExerciseDraft((draft) => ({ ...draft, options: draft.options.map((o, i) => (i === index ? e.target.value : o)) }))}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-[var(--accent)] inline-flex items-center gap-1"
                  onClick={() => setExerciseDraft((draft) => ({ ...draft, options: [...draft.options, ''] }))}
                >
                  <FiPlus size={14} /> Add option
                </button>
              </div>
            ) : null}
            {exerciseDraft.type === 'listening' ? (
              <>
                <div>
                  <label className="label" htmlFor="exercise-audio-file">Audio file URL</label>
                  <input id="exercise-audio-file" className="input" placeholder="https://..." value={exerciseDraft.audioFile} onChange={(e) => setExerciseDraft((draft) => ({ ...draft, audioFile: e.target.value }))} />
                </div>
                <div>
                  <label className="label" htmlFor="exercise-transcript">Transcript (optional, shown after answering)</label>
                  <textarea id="exercise-transcript" className="input min-h-16" value={exerciseDraft.transcript} onChange={(e) => setExerciseDraft((draft) => ({ ...draft, transcript: e.target.value }))} />
                </div>
              </>
            ) : null}
            {exerciseDraft.type === 'fill_blank' ? (
              <div>
                <label className="label" htmlFor="exercise-correct-answers">Accepted answers (comma-separated)</label>
                <input id="exercise-correct-answers" className="input" placeholder="go, goes" value={exerciseDraft.correctAnswersText} onChange={(e) => setExerciseDraft((draft) => ({ ...draft, correctAnswersText: e.target.value }))} />
              </div>
            ) : null}
            <div>
              <label className="label" htmlFor="exercise-points">Points</label>
              <input id="exercise-points" type="number" min={1} className="input" value={exerciseDraft.points} onChange={(e) => setExerciseDraft((draft) => ({ ...draft, points: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingExercise} className="btn btn-primary">
                {savingExercise ? 'Saving...' : editingExerciseId ? 'Update exercise' : 'Add exercise'}
              </button>
              {editingExerciseId ? (
                <button type="button" className="btn btn-outline" onClick={resetExerciseDraft}>Cancel</button>
              ) : null}
            </div>
          </form>
        </div>

        <Link to={`/teacher/manage/${courseId}`} className="text-sm text-[var(--accent)] font-semibold">
          Back to course lessons
        </Link>
      </div>
    </div>
  )
}
