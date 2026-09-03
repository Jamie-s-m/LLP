import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiMic, FiUsers } from 'react-icons/fi'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useI18n } from '../utils/i18n'

interface WaitlistCountResponse {
  data?: { count?: number }
}

export default function Tutors() {
  const { t, language } = useI18n()
  const { user, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [joined, setJoined] = useState(false)
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email)
    }
    if (isAuthenticated && user) {
      setName(`${user.firstName || ''} ${user.lastName || ''}`.trim())
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    api
      .get<WaitlistCountResponse>('/waitlist/count', { params: { feature: 'speaking_practice' } })
      .then((response) => setCount(response.data?.data?.count ?? null))
      .catch(() => undefined)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email) {
      toast.error(t('tutors.emailRequired'))
      return
    }
    try {
      setSubmitting(true)
      await api.post('/waitlist/join', { email, name, feature: 'speaking_practice', locale: language })
      setJoined(true)
      setCount((previous) => (previous === null ? previous : previous + 1))
      toast.success(t('tutors.joinedToast'))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined
      toast.error(message || t('tutors.joinError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="atlas-page">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="atlas-panel mb-8 overflow-hidden p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-2xl text-primary-600 dark:text-primary-300">
            <FiMic />
          </div>
          <p className="atlas-kicker">{t('tutors.kicker')}</p>
          <h1 className="text-3xl font-bold text-ink dark:text-white md:text-4xl">{t('tutors.title')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted">
            {t('tutors.copy')}
          </p>

          {count !== null && count > 0 ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--surface-strong)] px-4 py-1.5 text-sm font-semibold text-[var(--text-muted)]">
              <FiUsers /> {t('tutors.countLabel', { count: String(count) })}
            </p>
          ) : null}

          {joined ? (
            <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-2 rounded-2xl bg-success/10 px-6 py-5 text-success">
              <FiCheckCircle className="text-2xl" />
              <p className="font-semibold">{t('tutors.joinedTitle')}</p>
              <p className="text-sm text-muted">{t('tutors.joinedCopy')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="waitlist-email">{t('tutors.emailLabel')}</label>
              <input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('tutors.emailPlaceholder')}
                className="w-full flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]"
              />
              <button type="submit" className="btn btn-primary whitespace-nowrap px-6 py-3 text-sm" disabled={submitting}>
                {submitting ? t('tutors.joining') : t('tutors.joinCta')}
              </button>
            </form>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="atlas-panel rounded-2xl p-5">
            <p className="atlas-kicker">{t('tutors.step1Kicker')}</p>
            <p className="mt-2 text-sm text-muted">{t('tutors.step1Copy')}</p>
          </div>
          <div className="atlas-panel rounded-2xl p-5">
            <p className="atlas-kicker">{t('tutors.step2Kicker')}</p>
            <p className="mt-2 text-sm text-muted">{t('tutors.step2Copy')}</p>
          </div>
          <div className="atlas-panel rounded-2xl p-5">
            <p className="atlas-kicker">{t('tutors.step3Kicker')}</p>
            <p className="mt-2 text-sm text-muted">{t('tutors.step3Copy')}</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/courses" className="text-sm font-semibold text-primary-600 dark:text-primary-300">
            {t('tutors.browseInstead')}
          </Link>
        </div>
      </div>
    </div>
  )
}
