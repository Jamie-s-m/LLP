import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiLock } from 'react-icons/fi'
import Modal from './ui/Modal'
import { useI18n } from '../utils/i18n'
import { PAYWALL_EVENT } from '../services/api'

// Mounted once in App.tsx, outside the route tree, so it survives navigation. api.ts's response
// interceptor dispatches PAYWALL_EVENT on any 402 (Phase 7's entitlement gates) - this is the
// one place that turns that into a real modal with a path to /pricing, rather than each call
// site handling it ad hoc with a generic error toast.
export default function PaywallModal() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const { t } = useI18n()

  useEffect(() => {
    const handlePaywallEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail
      setMessage(detail?.message)
      setOpen(true)
    }
    window.addEventListener(PAYWALL_EVENT, handlePaywallEvent)
    return () => window.removeEventListener(PAYWALL_EVENT, handlePaywallEvent)
  }, [])

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={t('paywall.title')}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
          <FiLock size={16} />
        </div>
        <p className="text-sm text-muted">{message || t('paywall.defaultMessage')}</p>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/pricing" onClick={() => setOpen(false)} className="btn btn-primary flex-1 text-center">
          {t('paywall.viewPlans')}
        </Link>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline flex-1">
          {t('paywall.notNow')}
        </button>
      </div>
    </Modal>
  )
}
