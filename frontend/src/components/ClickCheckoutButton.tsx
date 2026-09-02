import { useMemo } from 'react'
import { FiCreditCard } from 'react-icons/fi'

interface ClickCheckoutButtonProps {
  serviceId: string
  merchantId: string
  checkoutBaseUrl: string
  userId: string
  plan: string
  amountSom: number
  returnUrl: string
  label: string
}

// Unlike Payme, Click has no embeddable JS widget for arbitrary merchants - its real
// integration is a plain redirect to Click's own hosted payment page (my.click.uz), which
// redirects back to returnUrl once the user finishes there. merchant_trans_id is our own
// opaque reference string ("<userId>:<plan>:<nonce>") that Click echoes back verbatim on every
// Prepare/Complete webhook call to billingController.js's handleClickRequest - see that file's
// parseMerchantTransId for the matching decode. The nonce only exists so retrying the same plan
// doesn't reuse an identical merchant_trans_id across attempts.
export default function ClickCheckoutButton({ serviceId, merchantId, checkoutBaseUrl, userId, plan, amountSom, returnUrl, label }: ClickCheckoutButtonProps) {
  const nonce = useMemo(() => Math.random().toString(36).slice(2, 10), [])
  const merchantTransId = `${userId}:${plan}:${nonce}`

  const checkoutUrl = useMemo(() => {
    const url = new URL(checkoutBaseUrl)
    url.searchParams.set('service_id', serviceId)
    url.searchParams.set('merchant_id', merchantId)
    url.searchParams.set('amount', String(amountSom))
    url.searchParams.set('transaction_param', merchantTransId)
    url.searchParams.set('return_url', returnUrl)
    return url.toString()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutBaseUrl, serviceId, merchantId, amountSom, merchantTransId, returnUrl])

  return (
    <a
      href={checkoutUrl}
      className="btn btn-outline inline-flex min-h-11 w-full items-center justify-center gap-2 text-center"
    >
      <FiCreditCard />
      {label}
    </a>
  )
}
