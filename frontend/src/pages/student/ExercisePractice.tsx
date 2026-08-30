import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheck, FiX, FiMic, FiSquare, FiPlay } from 'react-icons/fi'
import api from '../../services/api'
import HeartsRow from '../../components/ui/HeartsRow'

interface ExerciseData {
  _id: string
  type: 'multiple_choice' | 'fill_blank' | 'listening' | 'speaking' | 'matching' | 'writing'
  question: string
  instructions?: string
  options?: string[]
  audioFile?: string
  transcript?: string
  points: number
}

interface SubmitResult {
  isCorrect: boolean
  points: number
  correctAnswer: any
  hearts: number
  maxHearts: number
  heartsRegenAt: string | null
}

const formatRegenTime = (isoDate: string | null) => {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ExercisePractice() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<ExerciseData | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [outOfHearts, setOutOfHearts] = useState<{ heartsRegenAt: string | null } | null>(null)
  const [hearts, setHearts] = useState({ hearts: 5, maxHearts: 5 })
  const [submitting, setSubmitting] = useState(false)

  // Speaking recorder state
  const [isRecording, setIsRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null)
  const [speakingSubmitted, setSpeakingSubmitted] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!exerciseId) return
    api.get(`/exercises/${exerciseId}`)
      .then((response) => setExercise(response.data.data))
      .catch(() => toast.error('Exercise could not be loaded'))
      .finally(() => setLoading(false))

    api.get('/gamification/hearts')
      .then((response) => setHearts(response.data.data))
      .catch(() => {})
  }, [exerciseId])

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

  const handleSubmitSpeaking = async () => {
    if (!exercise || !recordedBase64) return
    setSubmitting(true)
    try {
      await api.post('/exercises/submit', { exerciseId: exercise._id, audioBase64: recordedBase64 })
      setSpeakingSubmitted(true)
      toast.success('Recording submitted for review')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Recording could not be submitted')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!exercise) return
    const isChoiceType = exercise.type === 'multiple_choice' || exercise.type === 'listening'
    if (isChoiceType && selected === null) return
    if (exercise.type === 'fill_blank' && !textAnswer.trim()) return

    setSubmitting(true)
    try {
      const answer = isChoiceType ? selected : textAnswer.trim()
      const response = await api.post('/exercises/submit', { exerciseId: exercise._id, answer })
      setResult(response.data.data)
      setHearts({ hearts: response.data.data.hearts, maxHearts: response.data.data.maxHearts })
    } catch (error: any) {
      if (error.response?.status === 403) {
        setOutOfHearts({ heartsRegenAt: error.response.data?.data?.heartsRegenAt || null })
        setHearts((prev) => ({ ...prev, hearts: 0 }))
        return
      }
      toast.error(error.response?.data?.message || 'Answer could not be submitted')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen py-8 px-4 text-center">Loading exercise...</div>
  }

  if (!exercise) {
    return <div className="min-h-screen py-8 px-4 text-center">Exercise not found.</div>
  }

  if (outOfHearts) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <div className="container mx-auto max-w-md text-center">
          <div className="card p-8">
            <div className="mb-4 flex justify-center"><HeartsRow hearts={0} size={32} /></div>
            <h2 className="mb-2 text-2xl font-bold">You&apos;re out of hearts</h2>
            <p className="mb-6 text-[var(--text-muted)]">
              {outOfHearts.heartsRegenAt
                ? `Your next heart regenerates around ${formatRegenTime(outOfHearts.heartsRegenAt)}, or refill instantly with coins.`
                : 'Take a short break, or refill instantly with coins.'}
            </p>
            <button
              className="btn btn-primary mb-3 w-full"
              onClick={async () => {
                try {
                  const response = await api.post('/gamification/hearts/refill')
                  setHearts(response.data.data)
                  setOutOfHearts(null)
                  toast.success('Hearts refilled!')
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Not enough coins to refill hearts')
                }
              }}
            >
              Refill with coins
            </button>
            <button className="btn btn-outline w-full" onClick={() => navigate(-1)}>
              Back to lesson
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <FiArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold">Exercise Practice</h1>
          </div>
          <HeartsRow hearts={hearts.hearts} maxHearts={hearts.maxHearts} />
        </div>

        <div className="card mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{exercise.question}</h2>
            {exercise.instructions ? <p className="text-sm text-[var(--text-muted)]">{exercise.instructions}</p> : null}
          </div>

          {exercise.type === 'listening' && exercise.audioFile ? (
            <audio controls className="w-full mb-6" src={exercise.audioFile}>Your browser does not support embedded audio.</audio>
          ) : null}

          {/* Multiple choice / Listening: option list */}
          {(exercise.type === 'multiple_choice' || exercise.type === 'listening') && (
            <div className="space-y-3 mb-8">
              {(exercise.options || []).map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => !result && setSelected(idx)}
                  disabled={!!result}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                    selected === idx
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600'
                  } ${
                    result
                      ? idx === result.correctAnswer
                        ? 'border-success bg-green-50 dark:bg-green-900/20 text-success'
                        : idx === selected
                        ? 'border-error bg-red-50 dark:bg-red-900/20 text-error'
                        : ''
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {result && idx === result.correctAnswer && <FiCheck className="text-success" size={20} />}
                    {result && idx === selected && idx !== result.correctAnswer && <FiX className="text-error" size={20} />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Fill in the blank */}
          {exercise.type === 'fill_blank' && (
            <div className="mb-8">
              <input
                className="input text-lg"
                placeholder="Type your answer..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={!!result}
              />
              {result ? (
                <p className="mt-2 text-sm text-[var(--text-muted)]">Correct answer: <span className="font-semibold">{String(result.correctAnswer)}</span></p>
              ) : null}
            </div>
          )}

          {/* Speaking: recorder */}
          {exercise.type === 'speaking' && (
            <div className="mb-8 text-center">
              {!speakingSubmitted ? (
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
                      <span className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)]"><FiPlay size={14} /> Preview your recording before submitting</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300">
                  <p className="font-bold">Submitted for review</p>
                  <p className="text-sm mt-1">A teacher will listen and grade your answer. You&apos;ll earn {exercise.points} points once it&apos;s reviewed.</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback (multiple_choice / listening / fill_blank) */}
          {result && exercise.type !== 'speaking' && (
            <div
              className={`p-4 rounded-lg mb-8 ${
                result.isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-success' : 'bg-red-50 dark:bg-red-900/20 text-error'
              }`}
            >
              <p className="font-bold">{result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
              <p className="text-sm mt-1">
                {result.isCorrect ? `Great job! You earned ${result.points} points.` : 'You lost a heart. Try the next one!'}
              </p>
              {exercise.type === 'listening' && exercise.transcript ? (
                <p className="text-sm mt-2 italic text-[var(--text-muted)]">Transcript: {exercise.transcript}</p>
              ) : null}
            </div>
          )}

          {/* Actions */}
          {exercise.type === 'speaking' ? (
            speakingSubmitted ? (
              <button onClick={() => navigate(-1)} className="w-full btn btn-primary">Back to Lesson</button>
            ) : (
              <button onClick={handleSubmitSpeaking} disabled={!recordedBase64 || submitting} className="w-full btn btn-primary">
                {submitting ? 'Submitting...' : 'Submit recording'}
              </button>
            )
          ) : !result ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || (exercise.type === 'fill_blank' ? !textAnswer.trim() : selected === null)}
              className="w-full btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <button onClick={() => navigate(-1)} className="w-full btn btn-primary">
              Back to Lesson
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
