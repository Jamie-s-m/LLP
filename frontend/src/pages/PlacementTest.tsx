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
interface PlacementResult { cefr: string; level: string; totalCorrect: number; totalQuestions: number; recommendedCourses: any[] }

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
    browseCourses: 'Browse matching courses',
    retake: 'Retake test',
    goDashboard: 'Go to dashboard',
    unavailable: 'The placement test isn\'t available right now. Please try again later.',
  },
  ru: {
    kicker: 'Определите свою точку старта',
    title: 'Тест на уровень',
    intro: 'Ответьте на 32 коротких вопроса (около 10 минут), и мы порекомендуем подходящий уровень курса.',
    retakeNote: 'Вы уже проходили этот тест. Повторное прохождение обновит рекомендованный уровень.',
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

  // The result screen states a single CEFR letter as the recommendation - the backend's own
  // skill-profile endpoint carries an honest confidence caveat for exactly this estimate
  // (based on one 32-question test, not an ongoing adaptive assessment). Pull the live wording
  // rather than duplicating a hardcoded copy that could drift from what the backend actually
  // computes; ui.confidenceFallback only covers the (rare) case the request fails.
  useEffect(() => {
    if (phase !== 'result') return
    let cancelled = false
    api.get('/progress/skill-profile')
      .then((response) => {
        if (!cancelled) setConfidenceNote(response.data?.data?.confidenceNote || null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [phase])

  const start = async () => {
    setLoading(true)
    try {
      const response = await api.get('/placement/questions')
      const fetchedQuestions = response.data.data || []
      if (fetchedQuestions.length === 0) {
        toast.error(ui.unavailable)
        return
      }
      setQuestions(fetchedQuestions)
      setIndex(0)
      setAnswers({})
      setPhase('test')
      track('placement_started', { fromOnboarding, questionCount: fetchedQuestions.length })
    } catch {
      toast.error('The placement test could not be loaded')
    } finally {
      setLoading(false)
    }
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
            <p className="mb-6 text-xs text-muted">{confidenceNote || ui.confidenceFallback}</p>
            <div className="flex flex-col gap-3">
              <Link to={`/courses?level=${result.level}`} className="btn btn-primary w-full">{ui.browseCourses}</Link>
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
          <div className="mb-6 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <div className="atlas-panel p-6">
            <h2 className="mb-6 text-xl font-bold text-ink dark:text-white">{currentQuestion.question}</h2>
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  onClick={() => handleSelect(optionIndex)}
                  className={`w-full p-4 rounded-lg border-2 text-left font-medium transition-all ${
                    selectedAnswer === optionIndex
                      ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
                      : 'border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {option}
                    {selectedAnswer === optionIndex ? <FiCheck /> : null}
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
          <button onClick={start} disabled={loading} className="btn btn-primary w-full">
            {loading ? ui.loading : ui.start}
          </button>
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
