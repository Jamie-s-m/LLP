import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheck, FiX, FiMic, FiSquare, FiPlay, FiVolume2, FiEdit3 } from 'react-icons/fi'
import api from '../../services/api'
import HeartsRow from '../ui/HeartsRow'
import Alert from '../ui/Alert'
import { track } from '../../utils/analytics'
import { BadgeIcon } from '../../utils/badgeIcons'

export interface ExerciseData {
  _id: string
  type: 'multiple_choice' | 'fill_blank' | 'listening' | 'speaking' | 'matching' | 'writing'
  question: string
  instructions?: string
  options?: string[]
  audioFile?: string
  transcript?: string
  leftItems?: string[]
  rightItems?: string[]
  minWords?: number
  points: number
}

export interface SubmitResult {
  isCorrect: boolean
  points: number
  correctAnswer: any
  hearts: number
  maxHearts: number
  heartsRegenAt: string | null
}

type Pair = { left: number; right: number }

type ExerciseRunnerProps = {
  exercise: ExerciseData
  hearts: { hearts: number; maxHearts: number }
  onHeartsChange: (hearts: { hearts: number; maxHearts: number }) => void
  onOutOfHearts: (heartsRegenAt: string | null) => void
  /** Fires once, after a graded result or a queued (speaking/writing) submission settles. */
  onDone: () => void
}

// One shared submit/result plumbing, one deliberately distinct layout per exercise type -
// the P0 gap this whole Lesson Player redesign exists to close (previously one generic form
// for every type, and matching/writing had no answer UI at all).
export default function ExerciseRunner({ exercise, hearts, onHeartsChange, onOutOfHearts, onDone }: ExerciseRunnerProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [pairs, setPairs] = useState<Pair[]>([])
  const [pendingLeft, setPendingLeft] = useState<number | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const reportUnlocks = (unlockedBadges?: Array<{ name: string; icon?: string }>) => {
    unlockedBadges?.forEach((badge) => {
      toast.success(`Badge unlocked: ${badge.name}!`, {
        duration: 5000,
        icon: badge.icon ? <BadgeIcon iconKey={badge.icon} className="text-xl" /> : undefined,
      })
    })
  }

  const submitAnswer = async (answer: unknown) => {
    setSubmitting(true)
    try {
      const response = await api.post('/exercises/submit', { exerciseId: exercise._id, answer })
      setResult(response.data.data)
      onHeartsChange({ hearts: response.data.data.hearts, maxHearts: response.data.data.maxHearts })
      track('exercise_completed', { exerciseId: exercise._id, type: exercise.type, correct: Boolean(response.data.data.isCorrect) })
      reportUnlocks(response.data.data.unlockedBadges)
    } catch (error: any) {
      if (error.response?.status === 403) {
        onOutOfHearts(error.response.data?.data?.heartsRegenAt || null)
        onHeartsChange({ ...hearts, hearts: 0 })
        return
      }
      toast.error(error.response?.data?.message || 'Answer could not be submitted')
    } finally {
      setSubmitting(false)
    }
  }

  const submitQueued = async (answer: { audioBase64: string } | { answer: string }) => {
    setSubmitting(true)
    try {
      await api.post('/exercises/submit', { exerciseId: exercise._id, ...answer })
      setQueued(true)
      track('exercise_completed', { exerciseId: exercise._id, type: exercise.type })
      toast.success(exercise.type === 'speaking' ? 'Recording submitted for review' : 'Submitted for review')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not be submitted')
    } finally {
      setSubmitting(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setRecordedUrl(URL.createObjectURL(blob))
        const reader = new FileReader()
        reader.onloadend = () => setRecordedBase64(reader.result as string)
        reader.readAsDataURL(blob)
        stream.getTracks().forEach((track) => track.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      toast.error('Microphone access is required to record your answer')
    }
  }
  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const toggleMatchPick = (side: 'left' | 'right', index: number) => {
    if (result) return
    if (side === 'left') {
      setPendingLeft(pendingLeft === index ? null : index)
      return
    }
    if (pendingLeft === null) return
    const withoutStale = pairs.filter((p) => p.left !== pendingLeft && p.right !== index)
    setPairs([...withoutStale, { left: pendingLeft, right: index }])
    setPendingLeft(null)
  }

  const wordCount = textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0
  const meetsMinWords = !exercise.minWords || wordCount >= exercise.minWords

  const outcomeBanner = result && exercise.type !== 'speaking' && exercise.type !== 'writing' ? (
    <Alert variant={result.isCorrect ? 'success' : 'error'} title={result.isCorrect ? 'Correct!' : 'Not quite'} className="mb-6">
      <p>{result.isCorrect ? `Nice work - you earned ${result.points} points.` : 'You lost a heart. Try the next one.'}</p>
      {exercise.type === 'listening' && exercise.transcript ? <p className="mt-2 italic text-[var(--text-muted)]">Transcript: {exercise.transcript}</p> : null}
    </Alert>
  ) : null

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-h2 text-ink dark:text-white">{exercise.question}</h2>
          {exercise.instructions ? <p className="mt-1 text-sm text-[var(--text-muted)]">{exercise.instructions}</p> : null}
        </div>
        <HeartsRow hearts={hearts.hearts} maxHearts={hearts.maxHearts} />
      </div>

      {/* Multiple choice: focused option cards */}
      {exercise.type === 'multiple_choice' && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {(exercise.options || []).map((option, idx) => (
            <button
              key={idx}
              type="button"
              aria-pressed={selected === idx}
              disabled={!!result}
              onClick={() => !result && setSelected(idx)}
              className={`dimensional-card flex items-center justify-between rounded-2xl border-2 p-4 text-left font-medium transition-colors ${
                selected === idx ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'
              } ${result ? (idx === result.correctAnswer ? 'border-[var(--success)] bg-[var(--success-light)]' : idx === selected ? 'border-[var(--error)] bg-[var(--error-light)]' : '') : ''}`}
            >
              <span>{option}</span>
              {result && idx === result.correctAnswer ? <FiCheck className="text-[var(--success)]" aria-hidden="true" /> : null}
              {result && idx === selected && idx !== result.correctAnswer ? <FiX className="text-[var(--error)]" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      )}

      {/* Listening: waveform-style audio surface + option list */}
      {exercise.type === 'listening' && (
        <div className="mb-6">
          {exercise.audioFile ? (
            <div className="radiant-arc-wrap mb-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <FiVolume2 className="text-2xl text-[var(--accent)]" aria-hidden="true" />
              <audio controls className="w-full" src={exercise.audioFile}>Your browser does not support embedded audio.</audio>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {(exercise.options || []).map((option, idx) => (
              <button
                key={idx}
                type="button"
                aria-pressed={selected === idx}
                disabled={!!result}
                onClick={() => !result && setSelected(idx)}
                className={`dimensional-card rounded-2xl border-2 p-4 text-left font-medium transition-colors ${
                  selected === idx ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'
                } ${result ? (idx === result.correctAnswer ? 'border-[var(--success)] bg-[var(--success-light)]' : idx === selected ? 'border-[var(--error)] bg-[var(--error-light)]' : '') : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fill blank: contextual inline input */}
      {exercise.type === 'fill_blank' && (
        <div className="mb-6">
          <input
            className="input text-lg"
            placeholder="Type your answer..."
            aria-label="Your answer"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={!!result}
          />
          {result ? <p className="mt-2 text-sm text-[var(--text-muted)]">Correct answer: <span className="font-semibold">{String(result.correctAnswer)}</span></p> : null}
        </div>
      )}

      {/* Matching: click-to-pair grid (accessible alternative to drag-and-drop) */}
      {exercise.type === 'matching' && (
        <div className="mb-6 grid grid-cols-2 gap-6">
          <div className="space-y-2">
            {(exercise.leftItems || []).map((item, idx) => {
              const paired = pairs.find((p) => p.left === idx)
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!!result}
                  onClick={() => toggleMatchPick('left', idx)}
                  className={`dimensional-card w-full rounded-xl border-2 p-3 text-left text-sm font-medium ${
                    pendingLeft === idx ? 'border-[var(--accent)] bg-[var(--accent-light)]' : paired ? 'border-[var(--info)] bg-[var(--info-light)]' : 'border-[var(--border)]'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
          <div className="space-y-2">
            {(exercise.rightItems || []).map((item, idx) => {
              const paired = pairs.find((p) => p.right === idx)
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!!result}
                  onClick={() => toggleMatchPick('right', idx)}
                  className={`dimensional-card w-full rounded-xl border-2 p-3 text-left text-sm font-medium ${
                    paired ? 'border-[var(--info)] bg-[var(--info-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Writing: comfortable free-text surface with a word-count nudge */}
      {exercise.type === 'writing' && !queued && (
        <div className="mb-6">
          <textarea
            className="input min-h-32 text-base"
            placeholder="Write your answer..."
            aria-label="Your written answer"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {wordCount} word{wordCount === 1 ? '' : 's'}{exercise.minWords ? ` (aim for at least ${exercise.minWords})` : ''}
          </p>
        </div>
      )}
      {exercise.type === 'writing' && queued ? (
        <div className="mb-6 rounded-xl bg-[var(--accent-light)] p-4 text-[var(--accent)]">
          <p className="font-bold">Submitted for review</p>
          <p className="mt-1 text-sm">A teacher will read your answer. You&apos;ll earn {exercise.points} points once it&apos;s reviewed.</p>
        </div>
      ) : null}

      {/* Speaking: radiant-arc mic surface */}
      {exercise.type === 'speaking' && (
        <div className="radiant-arc-wrap mb-6 rounded-2xl border border-[var(--border)] p-8 text-center">
          {!queued ? (
            <>
              {!isRecording ? (
                <button type="button" onClick={startRecording} className="btn btn-primary inline-flex items-center gap-2">
                  <FiMic size={18} /> {recordedUrl ? 'Record again' : 'Start recording'}
                </button>
              ) : (
                <button type="button" onClick={stopRecording} className="btn btn-danger inline-flex items-center gap-2">
                  <FiSquare size={18} /> Stop recording
                </button>
              )}
              {recordedUrl ? (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <audio controls src={recordedUrl} />
                  <span className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)]"><FiPlay size={14} /> Preview before submitting</span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-[var(--accent)]">
              <p className="font-bold">Submitted for review</p>
              <p className="mt-1 text-sm">A teacher will listen and grade your answer. You&apos;ll earn {exercise.points} points once it&apos;s reviewed.</p>
            </div>
          )}
        </div>
      )}

      {outcomeBanner}

      {/* Actions */}
      {exercise.type === 'speaking' ? (
        queued ? (
          <button onClick={onDone} className="w-full btn btn-primary">Continue</button>
        ) : (
          <button onClick={() => submitQueued({ audioBase64: recordedBase64! })} disabled={!recordedBase64 || submitting} className="w-full btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit recording'}
          </button>
        )
      ) : exercise.type === 'writing' ? (
        queued ? (
          <button onClick={onDone} className="w-full btn btn-primary">Continue</button>
        ) : (
          <button onClick={() => submitQueued({ answer: textAnswer.trim() })} disabled={!meetsMinWords || !textAnswer.trim() || submitting} className="w-full btn btn-primary inline-flex items-center justify-center gap-2">
            <FiEdit3 aria-hidden="true" /> {submitting ? 'Submitting...' : 'Submit answer'}
          </button>
        )
      ) : !result ? (
        <button
          onClick={() => submitAnswer(
            exercise.type === 'fill_blank' ? textAnswer.trim()
              : exercise.type === 'matching' ? pairs
                : selected
          )}
          disabled={
            submitting
            || (exercise.type === 'fill_blank' ? !textAnswer.trim()
              : exercise.type === 'matching' ? pairs.length !== (exercise.leftItems?.length || 0)
                : selected === null)
          }
          className="w-full btn btn-primary"
        >
          {submitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      ) : (
        <button onClick={onDone} className="w-full btn btn-primary">Continue</button>
      )}
    </div>
  )
}
