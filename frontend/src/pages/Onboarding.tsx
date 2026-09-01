import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCheck } from 'react-icons/fi'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useI18n } from '../utils/i18n'
import { track } from '../utils/analytics'

type Goal = 'job' | 'it' | 'abroad' | 'study' | 'confidence' | 'other'
type SelfLevel = 'beginner' | 'basic' | 'intermediate' | 'advanced' | 'not_sure'
type DailyMinutes = 10 | 15 | 30 | 60

const GOALS: Goal[] = ['job', 'it', 'abroad', 'study', 'confidence', 'other']
const LEVELS: SelfLevel[] = ['beginner', 'basic', 'intermediate', 'advanced', 'not_sure']
const TIMES: DailyMinutes[] = [10, 15, 30, 60]

export default function Onboarding() {
  const { t } = useI18n()
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [selfLevel, setSelfLevel] = useState<SelfLevel | null>(null)
  const [dailyMinutes, setDailyMinutes] = useState<DailyMinutes | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    track('onboarding_started')
  }, [])

  const goalLabels: Record<Goal, string> = {
    job: t('onboarding.goalJob'),
    it: t('onboarding.goalIt'),
    abroad: t('onboarding.goalAbroad'),
    study: t('onboarding.goalStudy'),
    confidence: t('onboarding.goalConfidence'),
    other: t('onboarding.goalOther'),
  }
  const levelLabels: Record<SelfLevel, string> = {
    beginner: t('onboarding.levelBeginner'),
    basic: t('onboarding.levelBasic'),
    intermediate: t('onboarding.levelIntermediate'),
    advanced: t('onboarding.levelAdvanced'),
    not_sure: t('onboarding.levelNotSure'),
  }
  const timeLabels: Record<DailyMinutes, string> = {
    10: t('onboarding.time10'),
    15: t('onboarding.time15'),
    30: t('onboarding.time30'),
    60: t('onboarding.time60'),
  }

  const finishAndGoToPlacement = async () => {
    if (!goal || !selfLevel || !dailyMinutes) return
    setSaving(true)
    try {
      const response = await api.put('/users/onboarding', {
        learningGoal: goal,
        selfAssessedLevel: selfLevel,
        dailyGoalMinutes: dailyMinutes,
      })
      if (user) setUser({ ...user, ...response.data.data })
      track('onboarding_completed', { goal, dailyMinutes })
      navigate('/placement-test?onboarding=1')
    } catch {
      toast.error(t('onboarding.savingError'))
    } finally {
      setSaving(false)
    }
  }

  const OptionGrid = <T extends string | number>({
    options,
    labels,
    selected,
    onSelect,
  }: {
    options: T[]
    labels: Record<T, string>
    selected: T | null
    onSelect: (value: T) => void
  }) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={selected === option}
          onClick={() => onSelect(option)}
          className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left font-medium transition-all ${
            selected === option
              ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]'
          }`}
        >
          {labels[option]}
          {selected === option ? <FiCheck aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  )

  return (
    <div className="atlas-page px-4 py-12">
      <div className="mx-auto max-w-xl">
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {t('onboarding.stepLabel', { step })}
        </p>
        <div className="mb-6 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="atlas-panel p-6">
          {step === 1 ? (
            <>
              <h1 className="mb-2 text-2xl font-bold text-ink dark:text-white">{t('onboarding.step1Title')}</h1>
              <p className="mb-6 text-muted">{t('onboarding.step1Copy')}</p>
              <OptionGrid options={GOALS} labels={goalLabels} selected={goal} onSelect={setGoal} />
            </>
          ) : step === 2 ? (
            <>
              <h1 className="mb-2 text-2xl font-bold text-ink dark:text-white">{t('onboarding.step2Title')}</h1>
              <p className="mb-6 text-muted">{t('onboarding.step2Copy')}</p>
              <OptionGrid options={LEVELS} labels={levelLabels} selected={selfLevel} onSelect={setSelfLevel} />
            </>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold text-ink dark:text-white">{t('onboarding.step3Title')}</h1>
              <p className="mb-6 text-muted">{t('onboarding.step3Copy')}</p>
              <OptionGrid options={TIMES} labels={timeLabels} selected={dailyMinutes} onSelect={setDailyMinutes} />
            </>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button type="button" onClick={() => setStep((current) => current - 1)} className="btn btn-outline">
                {t('onboarding.back')}
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 ? !goal : !selfLevel}
                onClick={() => setStep((current) => current + 1)}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                {t('onboarding.continueCta')} <FiArrowRight aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!dailyMinutes || saving}
                onClick={finishAndGoToPlacement}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                {saving ? t('onboarding.savingPlan') : t('onboarding.continueCta')} <FiArrowRight aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/placement-test?onboarding=1')}
              className="text-sm font-semibold text-[var(--accent)]"
            >
              {t('onboarding.skip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
