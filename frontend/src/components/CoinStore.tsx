import { useState } from 'react'
import api from '../services/api'

export default function CoinStore() {
  const [amount, setAmount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const spend = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await api.post('/daily-reward/spend', { amount, reason: 'Store purchase' })
      setMessage(`Success! New balance: ${res.data.data.newBalance} 🪙`)
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to spend coins')
    } finally { setLoading(false) }
  }

  return (
    <div className="atlas-panel p-4">
      <h3 className="text-lg font-semibold">LinguaCoins Store</h3>
      <p className="text-sm text-muted">Spend your LinguaCoins on bonuses and perks.</p>
      <div className="mt-3 flex items-center gap-2">
        <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="input w-24" />
        <button className="btn btn-primary" onClick={spend} disabled={loading}>{loading ? 'Processing...' : 'Spend'}</button>
      </div>
      {message && <div className="mt-3 text-sm">{message}</div>}
    </div>
  )
}
