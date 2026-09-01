import { useEffect, useId, useRef, useState } from 'react'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'

const SCRIPT_SRC = 'https://cdn.paycom.uz/integration/js/checkout.min.js'
let scriptLoadPromise: Promise<void> | null = null

// A failed load must not be cached forever - retry has to trigger a real new network
// attempt, not just replay the same already-rejected promise instantly.
const loadPaymeScript = (): Promise<void> => {
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.remove()
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Payme checkout script'))
    document.body.appendChild(script)
  }).catch((err) => {
    scriptLoadPromise = null
    throw err
  })
  return scriptLoadPromise
}

interface PaymeCheckoutButtonProps {
  merchantId: string
  checkoutBaseUrl: string
  userId: string
  plan: string
  amountTiyin: number
  lang: 'en' | 'ru' | 'uz'
  callbackUrl: string
}

// Renders Payme's official embedded checkout button: a hidden form carrying the payment
// parameters, plus a container div that checkout.min.js fills in with a real button. Clicking
// it opens Payme's own card-entry modal on top of this page - the card number/CVV are typed
// into Payme's iframe, never into anything LinguaNest's servers can see.
type LoadState = 'loading' | 'ready' | 'error'

export default function PaymeCheckoutButton({ merchantId, checkoutBaseUrl, userId, plan, amountTiyin, lang, callbackUrl }: PaymeCheckoutButtonProps) {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const formId = `payme-form-${uid}`
  const containerId = `payme-button-${uid}`
  const renderedRef = useRef(false)
  const [state, setState] = useState<LoadState>('loading')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    renderedRef.current = false
    let cancelled = false
    setState('loading')

    loadPaymeScript()
      .then(() => {
        if (cancelled) return
        const w = window as typeof window & { Paycom?: { Button: (formSelector: string, containerSelector: string) => void } }
        if (w.Paycom?.Button) {
          w.Paycom.Button(`#${formId}`, `#${containerId}`)
          renderedRef.current = true
          setState('ready')
        } else {
          // Script loaded but didn't expose what we need - same user-facing outcome as a
          // network failure: no working payment button, so treat it as an error too.
          setState('error')
        }
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [formId, containerId, merchantId, userId, plan, amountTiyin, retryCount])

  return (
    <form id={formId} method="POST" action={`${checkoutBaseUrl}/`}>
      <input type="hidden" name="merchant" value={merchantId} />
      <input type="hidden" name="account[user_id]" value={userId} />
      <input type="hidden" name="account[plan]" value={plan} />
      <input type="hidden" name="amount" value={amountTiyin} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="callback" value={callbackUrl} />
      <input type="hidden" name="button" data-type="svg" value="colored" />

      {state === 'loading' && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-muted)]" role="status">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
          Loading payment options&hellip;
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3 text-sm text-[var(--error)]" role="alert">
          <div className="flex items-center gap-2 font-medium">
            <FiAlertTriangle size={16} />
            Couldn&apos;t load the payment form
          </div>
          <p className="text-[var(--text-muted)]">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => setRetryCount((n) => n + 1)}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[var(--error)]/40 px-3 py-1.5 font-medium text-[var(--error)] transition-colors hover:bg-[var(--error)]/10"
          >
            <FiRefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      <div id={containerId} className={state === 'ready' ? undefined : 'hidden'} />
    </form>
  )
}
