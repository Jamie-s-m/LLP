import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiHeart } from 'react-icons/fi'
import { PiCoinDuotone } from 'react-icons/pi'
import api from '../services/api'

const HEART_REFILL_COST = 50

export default function CoinStore() {
  const [hearts, setHearts] = useState({ hearts: 5, maxHearts: 5 })
  const [linguaCoins, setLinguaCoins] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/gamification/hearts')
      .then((response) => setHearts(response.data.data))
      .catch(() => undefined)
  }, [])

  const heartsFull = hearts.hearts >= hearts.maxHearts
  const canAfford = linguaCoins === null || linguaCoins >= HEART_REFILL_COST

  const refill = async () => {
    setLoading(true)
    try {
      const response = await api.post('/gamification/hearts/refill')
      setHearts(response.data.data)
      setLinguaCoins(response.data.data.linguaCoins)
      toast.success('Hearts refilled!')
    } catch (error: any) {
      const data = error.response?.data?.data
      if (typeof data?.linguaCoins === 'number') setLinguaCoins(data.linguaCoins)
      toast.error(error.response?.data?.message || 'Could not refill hearts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="atlas-panel p-4">
      <h3 className="text-lg font-semibold">LinguaCoins Store</h3>
      <p className="text-sm text-muted">Spend your LinguaCoins on real perks.</p>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <FiHeart className="text-coral" />
          <div>
            <p className="text-sm font-semibold">Refill hearts to full</p>
            <p className="text-xs text-muted flex items-center gap-1">{hearts.hearts}/{hearts.maxHearts} hearts · {HEART_REFILL_COST} <PiCoinDuotone className="inline text-sm" aria-hidden="true" /></p>
          </div>
        </div>
        <button
          className="btn btn-primary disabled:opacity-50"
          onClick={refill}
          disabled={loading || heartsFull || !canAfford}
        >
          {loading ? 'Refilling...' : heartsFull ? 'Full' : 'Refill'}
        </button>
      </div>
    </div>
  )
}
