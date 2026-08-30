import { useEffect, useState } from 'react'
import api from '../services/api'

export default function DailyReward() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await api.get('/daily-reward/status')
      setStatus(res.data.data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load')
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const claim = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/daily-reward/claim')
      setStatus((s: any) => ({ ...s, linguaCoins: res.data.data.newLinguaCoins, currentStreak: res.data.data.newDailyRewardStreak }))
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Claim failed')
    } finally {
      setLoading(false)
    }
  }

  if (error) return <div className="atlas-panel p-4 text-red-400">{error}</div>
  if (!status) return <div className="atlas-panel p-4">Loading...</div>

  return (
    <div className="atlas-panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Daily Check-in</h3>
          <p className="text-sm text-muted">Keep your streak and earn LinguaCoins and XP.</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">{status.linguaCoins ?? 0} 🪙</div>
          <div className="text-xs text-muted">Streak: {status.currentStreak ?? 0} days</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-sm">Today&apos;s reward preview</div>
          <div className="text-base font-semibold">{status.previewCoins} 🪙 • {status.previewXP} XP</div>
        </div>
        <div>
          <button
            onClick={claim}
            disabled={!status.canClaim || loading}
            className="btn btn-primary"
          >
            {status.canClaim ? (loading ? 'Claiming...' : 'Claim') : 'Already claimed'}
          </button>
        </div>
      </div>
    </div>
  )
}
