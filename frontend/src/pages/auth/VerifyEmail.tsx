import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiMail, FiRefreshCcw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const initialEmail = searchParams.get('email') || ''
  const initialPreviewUrl = searchParams.get('previewUrl') || ''
  const registered = searchParams.get('registered') === '1'
  const [email, setEmail] = useState(initialEmail)
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState(registered ? 'Account created. Check your inbox for a verification link to finish creating your account.' : 'Check your inbox for a verification link to finish creating your account.')
  const isTokenMode = useMemo(() => !!token, [token])

  useEffect(() => {
    if (!token) return

    setStatus('loading')
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((response) => {
        setStatus('success')
        setMessage(response.data.message || 'Email verified successfully. You can now sign in.')
      })
      .catch((error: any) => {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Verification link is invalid or expired.')
      })
  }, [token])

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setStatus('loading')
      const response = await api.post('/auth/resend-verification', { email })
      setPreviewUrl(response.data.data?.previewUrl || '')
      setStatus('idle')
      toast.success(response.data.message || 'Verification email sent')
      setMessage('We sent a fresh verification link. Please check your inbox and spam folder.')
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Unable to resend verification email')
    }
  }

  return (
    <div className="atlas-page flex items-center justify-center px-4 py-12">
      <div className="atlas-panel w-full max-w-xl p-8">
        <p className="atlas-kicker">Email verification</p>
        <h1 className="mb-2 text-3xl font-semibold text-ink">Verify your account</h1>
        <p className="mb-6 text-muted">{message}</p>

        {previewUrl && !isTokenMode ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            SMTP is not configured in this environment yet. For development only, you can open the verification link directly:{' '}
            <a href={previewUrl} className="break-all font-semibold underline">{previewUrl}</a>
          </div>
        ) : null}

        {status === 'success' ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-800">
            <div className="mb-3 flex items-center gap-3">
              <FiCheckCircle size={22} />
              <strong>Email verified</strong>
            </div>
            <Link to={`/login?${new URLSearchParams({ email, verified: '1' }).toString()}`} className="btn btn-primary mt-2 inline-flex items-center gap-2">
              Continue to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={status === 'loading'}>
                <FiRefreshCcw size={16} />
                {status === 'loading' ? 'Working...' : 'Resend verification email'}
              </button>
              <Link to="/login" className="btn btn-outline inline-flex items-center gap-2">
                <FiMail size={16} />
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
