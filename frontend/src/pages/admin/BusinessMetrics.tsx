import { useEffect, useState } from 'react'
import { FiUsers, FiTarget, FiRepeat, FiDollarSign, FiBookOpen, FiMail } from 'react-icons/fi'
import api from '../../services/api'
import StatCard from '../../components/ui/StatCard'
import Pill from '../../components/ui/Pill'

interface Metrics {
  generatedAt: string
  users: { registered: number; dailyActive: number; weeklyActive: number; monthlyActive: number }
  activation: { onboardingCompletionRate: number; placementCompletionRate: number; firstLessonCompletionRate: number }
  retention: { methodology: string; d1: number; d7: number; d30: number; d1CohortSize: number; d7CohortSize: number; d30CohortSize: number }
  monetization: { payingUsers: number; conversionRate: number; payingByPlan: Record<string, number>; mrrUsd: number; arpuUsd: number; cancellationsLast30d: number }
  learning: { lessonsCompleted: number; exercisesCompleted: number; averageAccuracyPercent: number; vocabularyReviews: number }
}

interface SegmentUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  lastActiveDate?: string
  streak?: number
  placementLevel?: string | null
}

const SEGMENTS = [
  { key: 'new', label: 'New (last 7 days)' },
  { key: 'activated_not_paying', label: 'Activated, not paying' },
  { key: 'paying', label: 'Paying' },
  { key: 'churned', label: 'Churned' },
  { key: 'high_engagement', label: 'High engagement (streak ≥ 3)' },
] as const

const SectionLabel = ({ estimate }: { estimate?: boolean }) => (
  <Pill variant={estimate ? 'warning' : 'success'}>{estimate ? 'ESTIMATE' : 'FACT'}</Pill>
)

export default function BusinessMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [segment, setSegment] = useState<typeof SEGMENTS[number]['key']>('paying')
  const [segmentUsers, setSegmentUsers] = useState<SegmentUser[]>([])
  const [segmentLoading, setSegmentLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/business-metrics')
      .then((response) => setMetrics(response.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load business metrics'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSegmentLoading(true)
    api.get('/admin/business-metrics/segment', { params: { segment } })
      .then((response) => setSegmentUsers(response.data.data.users))
      .catch(() => setSegmentUsers([]))
      .finally(() => setSegmentLoading(false))
  }, [segment])

  if (loading) {
    return <div className="atlas-page px-4 py-12 text-center text-muted">Loading business metrics...</div>
  }

  if (error || !metrics) {
    return <div className="atlas-page px-4 py-12 text-center text-red-500">{error || 'No data'}</div>
  }

  return (
    <div className="atlas-page mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="atlas-kicker">Founder dashboard</p>
        <h1 className="text-3xl font-bold text-ink dark:text-white">Business metrics</h1>
        <p className="mt-1 text-sm text-muted">
          Generated {new Date(metrics.generatedAt).toLocaleString()}. Every section is labeled FACT (measured directly)
          or ESTIMATE (derived, with a stated method) — never presented as more precise than it is.
        </p>
      </div>

      <section className="atlas-panel mb-6 p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-ink dark:text-white">Users</h2>
          <SectionLabel />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Registered" value={metrics.users.registered} icon={<FiUsers />} />
          <StatCard label="Daily active" value={metrics.users.dailyActive} icon={<FiUsers />} />
          <StatCard label="Weekly active" value={metrics.users.weeklyActive} icon={<FiUsers />} />
          <StatCard label="Monthly active" value={metrics.users.monthlyActive} icon={<FiUsers />} />
        </div>
      </section>

      <section className="atlas-panel mb-6 p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-ink dark:text-white">Activation</h2>
          <SectionLabel />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Onboarding completed" value={`${metrics.activation.onboardingCompletionRate}%`} icon={<FiTarget />} />
          <StatCard label="Placement completed" value={`${metrics.activation.placementCompletionRate}%`} icon={<FiTarget />} />
          <StatCard label="First lesson completed" value={`${metrics.activation.firstLessonCompletionRate}%`} icon={<FiTarget />} />
        </div>
      </section>

      <section className="atlas-panel mb-6 p-6">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-xl font-bold text-ink dark:text-white">Retention</h2>
          <SectionLabel estimate />
        </div>
        <p className="mb-4 text-xs text-muted">{metrics.retention.methodology}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={`D1 (n=${metrics.retention.d1CohortSize})`} value={`${metrics.retention.d1}%`} icon={<FiRepeat />} />
          <StatCard label={`D7 (n=${metrics.retention.d7CohortSize})`} value={`${metrics.retention.d7}%`} icon={<FiRepeat />} />
          <StatCard label={`D30 (n=${metrics.retention.d30CohortSize})`} value={`${metrics.retention.d30}%`} icon={<FiRepeat />} />
        </div>
      </section>

      <section className="atlas-panel mb-6 p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-ink dark:text-white">Monetization</h2>
          <SectionLabel />
          <span className="text-xs text-muted">(MRR/ARPU convert the so&apos;m-priced plan to USD — see below)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Paying users" value={metrics.monetization.payingUsers} icon={<FiDollarSign />} />
          <StatCard label="Conversion" value={`${metrics.monetization.conversionRate}%`} icon={<FiDollarSign />} />
          <StatCard label="MRR (est., USD)" value={`$${metrics.monetization.mrrUsd}`} icon={<FiDollarSign />} />
          <StatCard label="ARPU (est., USD)" value={`$${metrics.monetization.arpuUsd}`} icon={<FiDollarSign />} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted">
          {Object.entries(metrics.monetization.payingByPlan).map(([plan, count]) => (
            <span key={plan} className="rounded-full border border-[var(--border)] px-3 py-1">{plan}: {count}</span>
          ))}
          <span className="rounded-full border border-[var(--border)] px-3 py-1">Cancellations (30d): {metrics.monetization.cancellationsLast30d}</span>
        </div>
      </section>

      <section className="atlas-panel mb-6 p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-ink dark:text-white">Learning</h2>
          <SectionLabel />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Lessons completed" value={metrics.learning.lessonsCompleted} icon={<FiBookOpen />} />
          <StatCard label="Exercises completed" value={metrics.learning.exercisesCompleted} icon={<FiBookOpen />} />
          <StatCard label="Average accuracy" value={`${metrics.learning.averageAccuracyPercent}%`} icon={<FiBookOpen />} />
          <StatCard label="Vocabulary reviews" value={metrics.learning.vocabularyReviews} icon={<FiBookOpen />} />
        </div>
      </section>

      <section className="atlas-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink dark:text-white">Who to talk to</h2>
          <select
            value={segment}
            onChange={(event) => setSegment(event.target.value as typeof segment)}
            className="input w-auto"
          >
            {SEGMENTS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </div>
        {segmentLoading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : segmentUsers.length === 0 ? (
          <p className="text-sm text-muted">No users in this segment yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-muted">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Joined</th>
                  <th className="pb-2 pr-4">Last active</th>
                  <th className="pb-2">Streak</th>
                </tr>
              </thead>
              <tbody>
                {segmentUsers.map((segmentUser) => (
                  <tr key={segmentUser._id} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-4">{segmentUser.firstName} {segmentUser.lastName}</td>
                    <td className="py-2 pr-4">
                      <a href={`mailto:${segmentUser.email}`} className="inline-flex items-center gap-1 text-[var(--accent)]">
                        <FiMail size={14} /> {segmentUser.email}
                      </a>
                    </td>
                    <td className="py-2 pr-4">{new Date(segmentUser.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{segmentUser.lastActiveDate ? new Date(segmentUser.lastActiveDate).toLocaleDateString() : '—'}</td>
                    <td className="py-2">{segmentUser.streak ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
