import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCheck, FiTarget } from 'react-icons/fi'
import api from '../services/api'
import { useLanguageStore } from '../store/languageStore'
import { useAuthStore } from '../store/authStore'
import { useI18n } from '../utils/i18n'
import { track } from '../utils/analytics'

interface Question { _id: string; question: string; options: string[]; cefr: string }
interface RecommendedLesson { lessonId: string; courseId: string; title: string }
interface PlacementResult { cefr: string; level: string; totalCorrect: number; totalQuestions: number; recommendedCourses: any[]; recommendedLesson: RecommendedLesson | null }

// Placement-test progress persistence. Client-side (localStorage) only, deliberately -
// this is an unproctored self-assessment that recommends a starting course level, not a
// certified or scored credential (see backend/src/data/certificateMethodology.js for what
// actually carries real assessment weight), so a server-side session isn't proportionate.
// What this does still take seriously:
//  - Scoped to a specific attempt (the exact question-ID set), not a generic "resume any
//    test" - a resume request against a since-changed question bank is treated as stale.
//  - Expires after 48h so an abandoned session doesn't linger and confuse a later visit.
//  - Cleared immediately on successful submission, so a stale copy in storage can never
//    replay a duplicate submission.
//  - Explicit resume, never silent - the intro screen always asks before jumping back in.
// Known limitation, stated rather than hidden: progress doesn't follow a learner across
// devices (starting on a phone, finishing on a laptop loses it) - true cross-device resume
// would need a real backend session, which is more than this feature's stakes justify.
const PLACEMENT_STORAGE_KEY = 'linguanest_placement_progress_v1'
const PLACEMENT_PROGRESS_MAX_AGE_MS = 48 * 60 * 60 * 1000

type SavedPlacementProgress = {
  questionIds: string[]
  answers: Record<string, number>
  index: number
  savedAt: number
}

function readSavedPlacementProgress(): SavedPlacementProgress | null {
  try {
    const raw = localStorage.getItem(PLACEMENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedPlacementProgress
    if (!parsed?.questionIds?.length || !parsed.savedAt || Date.now() - parsed.savedAt > PLACEMENT_PROGRESS_MAX_AGE_MS) {
      localStorage.removeItem(PLACEMENT_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeSavedPlacementProgress(progress: SavedPlacementProgress) {
  try {
    localStorage.setItem(PLACEMENT_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage can fail (private browsing, quota) - losing resume capability is an
    // acceptable degradation, not worth interrupting the test to report.
  }
}

function clearSavedPlacementProgress() {
  try {
    localStorage.removeItem(PLACEMENT_STORAGE_KEY)
  } catch {
    // ignore
  }
}

const copy = {
  en: {
    kicker: 'Find your starting point',
    title: 'Placement Test',
    intro: 'Answer 32 short questions (about 10 minutes) and we\'ll recommend the right course level to start with.',
    retakeNote: 'You\'ve already completed this test. Taking it again will update your recommended level.',
    currentLevel: 'Your current level',
    start: 'Start test',
    loading: 'Loading...',
    question: 'Question',
    of: 'of',
    next: 'Next',
    finish: 'See my result',
    submitting: 'Scoring your answers...',
    resultTitle: 'Your recommended level',
    resultCopy: (correct: number, total: number) => `You answered ${correct} of ${total} questions correctly.`,
    confidenceFallback: 'This is a starting estimate from one placement test, not a precise or official measurement.',
    startLesson: (title: string) => `Start "${title}"`,
    browseCourses: 'Browse matching courses',
    retake: 'Retake test',
    goDashboard: 'Go to dashboard',
    unavailable: 'The placement test isn\'t available right now. Please try again later.',
    resumeTitle: 'You have an unfinished test',
    resumeCopy: (current: number, total: number) => `You answered question ${current} of ${total}. Pick up where you left off, or start over.`,
    resumeCta: 'Resume test',
    startOverCta: 'Start over instead',
  },
  ru: {
    kicker: 'Определите свою точку старта',
    title: 'Тест на уровень',
    intro: 'Ответьте на 32 коротких вопроса (около 10 минут), и мы порекомендуем подходящий уровень курса.',
    retakeNote: 'Вы уже проходили этот тест. Повторное прохождение обновит рекомендованный уровень.',
    resumeTitle: 'У вас есть незавершённый тест',
    resumeCopy: (current: number, total: number) => `Вы ответили на вопрос ${current} из ${total}. Продолжите с этого места или начните заново.`,
    resumeCta: 'Продолжить тест',
    startOverCta: 'Начать заново',
    currentLevel: 'Ваш текущий уровень',
    start: 'Начать тест',
    loading: 'Загрузка...',
    question: 'Вопрос',
    of: 'из',
    next: 'Далее',
    finish: 'Посмотреть результат',
    submitting: 'Оцениваем ваши ответы...',
    resultTitle: 'Рекомендованный уровень',
    resultCopy: (correct: number, total: number) => `Вы ответили правильно на ${correct} из ${total} вопросов.`,
    confidenceFallback: 'Это предварительная оценка по результатам одного теста, а не точное или официальное измерение.',
    startLesson: (title: string) => `Начать «${title}»`,
    browseCourses: 'Смотреть подходящие курсы',
    retake: 'Пройти снова',
    goDashboard: 'Перейти в панель',
    unavailable: 'Тест на уровень сейчас недоступен. Попробуйте позже.',
  },
  uz: {
    kicker: 'Boshlang‘ich darajangizni aniqlang',
    title: 'Daraja aniqlash testi',
    intro: '32 ta qisqa savolga javob bering (taxminan 10 daqiqa), biz mos kurs darajasini tavsiya qilamiz.',
    retakeNote: 'Siz bu testni allaqachon topshirgansiz. Qayta topshirish tavsiya etilgan darajani yangilaydi.',
    resumeTitle: 'Tugallanmagan testingiz bor',
    resumeCopy: (current: number, total: number) => `Siz ${total} tadan ${current}-savolga javob berdingiz. Shu joydan davom eting yoki qaytadan boshlang.`,
    resumeCta: 'Testni davom ettirish',
    startOverCta: 'Qaytadan boshlash',
    currentLevel: 'Joriy darajangiz',
    start: 'Testni boshlash',
    loading: 'Yuklanmoqda...',
    question: 'Savol',
    of: 'dan',
    next: 'Keyingisi',
    finish: 'Natijani ko‘rish',
    submitting: 'Javoblaringiz baholanmoqda...',
    resultTitle: 'Tavsiya etilgan daraja',
    resultCopy: (correct: number, total: number) => `Siz ${total} ta savoldan ${correct} tasiga to‘g‘ri javob berdingiz.`,
    confidenceFallback: 'Bu bitta daraja aniqlash testiga asoslangan boshlang‘ich taxmin, aniq yoki rasmiy o‘lchov emas.',
    startLesson: (title: string) => `"${title}" darsini boshlash`,
    browseCourses: 'Mos kurslarni ko‘rish',
    retake: 'Qayta topshirish',
    goDashboard: 'Boshqaruv paneliga o‘tish',
    unavailable: 'Hozircha daraja aniqlash testi mavjud emas. Keyinroq qayta urinib ko‘ring.',
  },
} as const

export default function PlacementTest() {
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()
  const fromOnboarding = searchParams.get('onboarding') === '1'

  const [phase, setPhase] = useState<'intro' | 'test' | 'result'>('intro')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<PlacementResult | null>(null)
  const [confidenceNote, setConfidenceNote] = useState<string | null>(null)
  const [confidenceLoading, setConfidenceLoading] = useState(false)
  const [savedProgress, setSavedProgress] = useState<SavedPlacementProgress | null>(null)

  useEffect(() => {
    setSavedProgress(readSavedPlacementProgress())
  }, [])

  // Autosave whenever an answer changes or the learner moves to a new question, while a
  // test is actually in progress. Deliberately not tied to a single call site (handleSelect,
  // handleNext) so nothing can forget to persist - this is the one place that does it.
  useEffect(() => {
    if (phase !== 'test' || questions.length === 0) return
    writeSavedPlacementProgress({
      questionIds: questions.map((q) => q._id),
      answers,
      index,
      savedAt: Date.now(),
    })
  }, [phase, questions, answers, index])

  // The result screen states a single CEFR letter as the recommendation - the backend's own
  // skill-profile endpoint carries an honest confidence caveat for exactly this estimate
  // (based on one 32-question test, not an ongoing adaptive assessment). Pull the live wording
  // rather than duplicating a hardcoded copy that could drift from what the backend actually
  // computes; ui.confidenceFallback only covers the (rare) case the request fails.
  // confidenceLoading holds the caption back until the request settles, rather than showing
  // the fallback text and then visibly swapping it for the real wording a moment later.
  useEffect(() => {
    if (phase !== 'result') return
    setConfidenceLoading(true)
    let cancelled = false
    api.get('/progress/skill-profile')
      .then((response) => {
        if (!cancelled) setConfidenceNote(response.data?.data?.confidenceNote || null)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setConfidenceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [phase])

  const start = async (resume = false) => {
    setLoading(true)
    try {
      const response = await api.get('/placement/questions')
      const fetchedQuestions: Question[] = response.data.data || []
      if (fetchedQuestions.length === 0) {
        toast.error(ui.unavailable)
        return
      }
      setQuestions(fetchedQuestions)

      const progress = resume ? savedProgress : null
      const resumeMatches = Boolean(
        progress &&
        progress.questionIds.length === fetchedQuestions.length &&
        fetchedQuestions.every((question, i) => question._id === progress.questionIds[i])
      )

      if (resumeMatches && progress) {
        setIndex(Math.min(progress.index, fetchedQuestions.length - 1))
        setAnswers(progress.answers)
      } else {
        setIndex(0)
        setAnswers({})
        clearSavedPlacementProgress()
        setSavedProgress(null)
      }

      setPhase('test')
      track('placement_started', { fromOnboarding, questionCount: fetchedQuestions.length, resumed: resumeMatches })
    } catch {
      toast.error('The placement test could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  const startOver = () => {
    clearSavedPlacementProgress()
    setSavedProgress(null)
  }

  const currentQuestion = questions[index]
  const selectedAnswer = currentQuestion ? answers[currentQuestion._id] : undefined

  const handleSelect = (optionIndex: number) => {
    if (!currentQuestion) return
    setAnswers((current) => ({ ...current, [currentQuestion._id]: optionIndex }))
  }

  const handleNext = async () => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      return
    }

    setLoading(true)
    try {
      const payload = questions.map((question) => ({ questionId: question._id, answer: answers[question._id] }))
      const response = await api.post('/placement/submit', { answers: payload })
      // Clear before anything else can fail/interrupt below - a stale copy in storage must
      // never be able to replay as a duplicate submission.
      clearSavedPlacementProgress()
      setSavedProgress(null)
      setResult(response.data.data)
      if (user) setUser({ ...user, placementLevel: response.data.data.level })
      track('placement_completed', { cefr: response.data.data.cefr, level: response.data.data.level, fromOnboarding })
      if (fromOnboarding) {
        navigate('/onboarding/plan', { state: { result: response.data.data } })
        return
      }
      setPhase('result')
    } catch {
      toast.error('Your result could not be saved')
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'result' && result) {
    return (
      <div className="atlas-page px-4 py-12">
        <div className="mx-auto max-w-xl text-center">
          <div className="atlas-panel p-8">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
              <FiTarget size={28} />
            </div>
            <p className="atlas-kicker">{ui.resultTitle}</p>
            <h1 className="mb-2 text-3xl font-bold text-ink dark:text-white">{result.level} ({result.cefr})</h1>
            <p className="mb-2 text-muted">{ui.resultCopy(result.totalCorrect, result.totalQuestions)}</p>
            {!confidenceLoading ? (
              <p className="mb-6 text-xs text-muted">{confidenceNote || ui.confidenceFallback}</p>
            ) : (
              <p className="mb-6 text-xs text-muted">&nbsp;</p>
            )}
            <div className="flex flex-col gap-3">
              {result.recommendedLesson ? (
                <>
                  <Link to={`/lesson/${result.recommendedLesson.lessonId}`} className="btn btn-primary w-full">
                    {ui.startLesson(result.recommendedLesson.title)}
                  </Link>
                  <Link to={`/courses?level=${result.level}`} className="text-sm font-semibold text-[var(--accent)]">{ui.browseCourses}</Link>
                </>
              ) : (
                <Link to={`/courses?level=${result.level}`} className="btn btn-primary w-full">{ui.browseCourses}</Link>
              )}
              <button onClick={() => setPhase('intro')} className="btn btn-outline w-full">{ui.retake}</button>
              <button onClick={() => navigate('/dashboard')} className="text-sm text-[var(--accent)] font-semibold">{ui.goDashboard}</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'test' && currentQuestion) {
    return (
      <div className="atlas-page px-4 py-12">
        <div className="mx-auto max-w-xl">
          <div className="mb-4 flex items-center justify-between text-sm text-muted">
            <span>{ui.question} {index + 1} {ui.of} {questions.length}</span>
            <span>{currentQuestion.cefr}</span>
          </div>
          <div
            role="progressbar"
            aria-label={`${ui.question} ${index + 1} ${ui.of} ${questions.length}`}
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
            className="mb-6 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700"
          >
            <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <div className="atlas-panel p-6">
            <h2 className="mb-6 text-xl font-bold text-ink dark:text-white">{currentQuestion.question}</h2>
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  type="button"
                  aria-pressed={selectedAnswer === optionIndex}
                  onClick={() => handleSelect(optionIndex)}
                  className={`w-full p-4 rounded-lg border-2 text-left font-medium transition-all ${
                    selectedAnswer === optionIndex
                      ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
                      : 'border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {option}
                    {selectedAnswer === optionIndex ? <FiCheck aria-hidden="true" /> : null}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={handleNext} disabled={selectedAnswer === undefined || loading} className="btn btn-primary w-full">
              {loading ? ui.submitting : index < questions.length - 1 ? ui.next : ui.finish}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="atlas-page px-4 py-12">
      <div className="mx-auto max-w-xl text-center">
        <div className="atlas-panel p-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
            <FiTarget size={28} />
          </div>
          <p className="atlas-kicker">{fromOnboarding ? t('onboarding.placementIntroTitle') : ui.kicker}</p>
          <h1 className="mb-3 text-3xl font-bold text-ink dark:text-white">{ui.title}</h1>
          <p className="mb-6 text-muted">{fromOnboarding ? t('onboarding.placementIntroCopy') : ui.intro}</p>
          {user?.placementLevel ? (
            <div className="mb-6 rounded-xl border border-[var(--border)] p-4 text-sm text-muted">
              <p>{ui.retakeNote}</p>
              <p className="mt-1 font-semibold text-ink dark:text-white">{ui.currentLevel}: {user.placementLevel}</p>
            </div>
          ) : null}
          {savedProgress ? (
            <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-light)] p-4 text-left text-sm">
              <p className="font-semibold text-ink dark:text-white">{ui.resumeTitle}</p>
              <p className="mt-1 text-muted">{ui.resumeCopy(savedProgress.index + 1, savedProgress.questionIds.length)}</p>
            </div>
          ) : null}
          <button onClick={() => start(Boolean(savedProgress))} disabled={loading} className="btn btn-primary w-full">
            {loading ? ui.loading : savedProgress ? ui.resumeCta : ui.start}
          </button>
          {savedProgress ? (
            <button type="button" onClick={startOver} className="mt-3 text-sm font-medium text-muted underline">
              {ui.startOverCta}
            </button>
          ) : null}
          {fromOnboarding ? (
            <button
              type="button"
              onClick={() => navigate('/onboarding/plan')}
              className="mt-4 text-sm font-semibold text-[var(--accent)]"
            >
              {t('onboarding.skip')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
