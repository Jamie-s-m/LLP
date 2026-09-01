import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useI18n } from '../utils/i18n'
import api from '../services/api'

interface PlacementResult {
  cefr: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
}

export default function OnboardingPlan() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const result = (location.state as { result?: PlacementResult } | null)?.result

  const level = result?.level || user?.placementLevel || null
  const cefr = result?.cefr || null

  const [confidenceNote, setConfidenceNote] = useState<string | null>(null)
  const [confidenceLoading, setConfidenceLoading] = useState(true)

  // This screen states the recommended level as a settled fact ("Intermediate (B1)") - the
  // backend's skill-profile endpoint carries an honest confidence caveat for exactly that
  // estimate (one placement test, not an ongoing adaptive assessment). Pull the live wording
  // instead of duplicating a hardcoded copy that could drift from what the backend computes;
  // planLevelConfidenceFallback only covers the (rare) case the request fails.
  // confidenceLoading holds the caption back until the request settles, rather than showing
  // the fallback text and then visibly swapping it for the real wording a moment later.
  useEffect(() => {
    if (!level) {
      setConfidenceLoading(false)
      return
    }
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
  }, [level])

  const goalLabels: Record<string, string> = {
    job: t('onboarding.goalJob'),
    it: t('onboarding.goalIt'),
    abroad: t('onboarding.goalAbroad'),
    study: t('onboarding.goalStudy'),
    confidence: t('onboarding.goalConfidence'),
    other: t('onboarding.goalOther'),
  }
  const timeLabels: Record<number, string> = {
    10: t('onboarding.time10'),
    15: t('onboarding.time15'),
    30: t('onboarding.time30'),
    60: t('onboarding.time60'),
  }

  // Only two real, purpose-built course tracks exist today (Business English and English
  // Speaking) - everything else recommends by CEFR level rather than claiming a specialized
  // track (e.g. "IT English", "Migration English") that hasn't actually been built yet.
  const pathHref = user?.learningGoal === 'job' || user?.learningGoal === 'it'
    ? '/courses?category=Business English'
    : user?.learningGoal === 'confidence'
      ? '/courses?category=Conversation'
      : level
        ? `/courses?level=${level}`
        : '/courses'
  const pathLabel = user?.learningGoal === 'job' || user?.learningGoal === 'it'
    ? 'Business English'
    : user?.learningGoal === 'confidence'
      ? 'English Speaking'
      : level
        ? `${level} courses`
        : 'Courses'

  return (
    <div className="atlas-page px-4 py-12">
      <div className="mx-auto max-w-xl text-center">
        <div className="atlas-panel p-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
            <FiCheckCircle size={28} />
          </div>
          <h1 className="mb-6 text-3xl font-bold text-ink dark:text-white">{t('onboarding.planTitle')}</h1>

          <dl className="mb-6 space-y-3 rounded-2xl border border-[var(--border)] p-5 text-left text-sm">
            <div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t('onboarding.planLevel')}</dt>
                <dd className="font-semibold text-ink dark:text-white">{level ? `${level}${cefr ? ` (${cefr})` : ''}` : '—'}</dd>
              </div>
              {level && !confidenceLoading ? (
                <p className="mt-1 text-xs text-muted">{confidenceNote || t('onboarding.planLevelConfidenceFallback')}</p>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">{t('onboarding.planGoal')}</dt>
              <dd className="font-semibold text-ink dark:text-white">{user?.learningGoal ? goalLabels[user.learningGoal] : '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">{t('onboarding.planDailyGoal')}</dt>
              <dd className="font-semibold text-ink dark:text-white">{user?.dailyGoalMinutes ? timeLabels[user.dailyGoalMinutes] : '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">{t('onboarding.planPath')}</dt>
              <dd className="font-semibold text-ink dark:text-white">{pathLabel}</dd>
            </div>
          </dl>

          <div className="mb-6 rounded-xl bg-[var(--surface-strong)] p-4 text-left text-sm text-muted">
            <p className="mb-1 font-semibold text-ink dark:text-white">{t('onboarding.planTarget')}</p>
            <p>{t('onboarding.planTargetCopy')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link to={pathHref} className="btn btn-primary w-full">{t('onboarding.startLearning')}</Link>
            <button onClick={() => navigate('/placement-test?onboarding=1')} className="text-sm font-semibold text-[var(--accent)]">
              {t('onboarding.retakePlacement')}
            </button>
            <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-[var(--accent)]">
              {t('pricing.goToDashboard')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
