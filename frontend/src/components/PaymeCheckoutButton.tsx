import { useEffect, useId, useRef } from 'react'

const SCRIPT_SRC = 'https://cdn.paycom.uz/integration/js/checkout.min.js'
let scriptLoadPromise: Promise<void> | null = null

const loadPaymeScript = (): Promise<void> => {
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Payme checkout script'))
    document.body.appendChild(script)
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
export default function PaymeCheckoutButton({ merchantId, checkoutBaseUrl, userId, plan, amountTiyin, lang, callbackUrl }: PaymeCheckoutButtonProps) {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const formId = `payme-form-${uid}`
  const containerId = `payme-button-${uid}`
  const renderedRef = useRef(false)

  useEffect(() => {
    renderedRef.current = false
    let cancelled = false

    loadPaymeScript()
      .then(() => {
        if (cancelled || renderedRef.current) return
        const w = window as typeof window & { Paycom?: { Button: (formSelector: string, containerSelector: string) => void } }
        if (w.Paycom?.Button) {
          w.Paycom.Button(`#${formId}`, `#${containerId}`)
          renderedRef.current = true
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [formId, containerId, merchantId, userId, plan, amountTiyin])

  return (
    <form id={formId} method="POST" action={`${checkoutBaseUrl}/`}>
      <input type="hidden" name="merchant" value={merchantId} />
      <input type="hidden" name="account[user_id]" value={userId} />
      <input type="hidden" name="account[plan]" value={plan} />
      <input type="hidden" name="amount" value={amountTiyin} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="callback" value={callbackUrl} />
      <input type="hidden" name="button" data-type="svg" value="colored" />
      <div id={containerId} />
    </form>
  )
}
