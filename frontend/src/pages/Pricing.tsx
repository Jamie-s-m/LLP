import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiCreditCard, FiShield, FiUsers } from 'react-icons/fi'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

type BillingPlanKey = 'learner' | 'family' | 'teaching'

type BillingStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired'

interface BillingPlan {
  key: BillingPlanKey
  name: string
  priceLabel: string
  description: string
  roleHint: 'student' | 'parent' | 'teacher'
  available: boolean
  cta: string
  href: string
  features: string[]
}

const plans: BillingPlan[] = [
  {
    key: 'learner',
    name: 'Learner',
    priceLabel: '$19/month',
    description: 'For individual students building daily momentum.',
    roleHint: 'student',
    cta: 'Start learning',
    href: '/register?role=student',
    available: true,
    features: ['Unlimited active courses', 'Flashcards and exercises', 'Progress tracking and streaks', 'Community chat access'],
  },
  {
    key: 'family',
    name: 'Family',
    priceLabel: '$39/month',
    description: 'For parents supporting one or more learners together.',
    roleHint: 'parent',
    cta: 'Create family account',
    href: '/register?role=parent',
    available: true,
    features: ['Parent dashboard', 'Linked learner progress', 'Family learning insights', 'Priority support chat'],
  },
  {
    key: 'teaching',
    name: 'Teaching team',
    priceLabel: '$99/month',
    description: 'For teachers or small academies running guided programs.',
    roleHint: 'teacher',
    cta: 'Open teaching workspace',
    href: '/register?role=student&teacherInterest=1',
    available: true,
    features: ['Course authoring workspace', 'Progress monitoring', 'Teacher applications and moderation', 'Admin-ready operations center'],
  },
]

const activeStatuses = new Set<BillingStatus>(['trialing', 'active', 'past_due', 'unpaid', 'incomplete'])

export default function Pricing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [busyPlan, setBusyPlan] = useState<BillingPlanKey | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [billingStatus, setBillingStatus] = useState<{
    plan: 'none' | BillingPlanKey
    status: BillingStatus
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
  } | null>(null)
  const [canStartCheckout, setCanStartCheckout] = useState(true)
  const [hasCustomerPortal, setHasCustomerPortal] = useState(false)
  const [configuredPlans, setConfiguredPlans] = useState<Record<string, boolean>>({})
  const { user, isAuthenticated, setUser } = useAuthStore()

  const refreshBilling = async () => {
    const response = await api.get('/billing/me')
    const billing = response.data.data?.billing
    setBillingStatus(billing)
    setCanStartCheckout(Boolean(response.data.data?.canStartCheckout))
    setHasCustomerPortal(Boolean(response.data.data?.hasCustomerPortal))
    if (user && billing) {
      setUser({ ...user, billing })
    }
  }

  useEffect(() => {
    api.get('/billing/plans')
      .then((response) => {
        const nextPlans = response.data.data?.plans || []
        setConfiguredPlans(
          nextPlans.reduce((acc: Record<string, boolean>, plan: { key: string; available: boolean }) => {
            acc[plan.key] = Boolean(plan.available)
            return acc
          }, {})
        )
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setBillingStatus(user?.billing || null)
      return
    }

    refreshBilling().catch((error: any) => {
      toast.error(error.response?.data?.message || 'Billing status could not be loaded')
    })
  }, [isAuthenticated])

  useEffect(() => {
    const checkoutState = searchParams.get('checkout')
    if (!checkoutState) {
      return
    }

    if (checkoutState === 'success') {
      toast.success('Checkout completed. Stripe will finish syncing your subscription in a moment.')
      if (isAuthenticated) {
        refreshBilling().catch(() => undefined)
      }
    }

    if (checkoutState === 'canceled') {
      toast('Checkout canceled')
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('checkout')
    setSearchParams(nextParams, { replace: true })
  }, [isAuthenticated, searchParams, setSearchParams])

  const effectiveBilling = billingStatus || user?.billing || null
  const hasManagedSubscription = activeStatuses.has((effectiveBilling?.status || 'inactive') as BillingStatus)

  const enrichedPlans = useMemo(
    () => plans.map((plan) => ({ ...plan, available: configuredPlans[plan.key] ?? false })),
    [configuredPlans]
  )

  const startCheckout = async (planKey: BillingPlanKey) => {
    try {
      setBusyPlan(planKey)
      const response = await api.post('/billing/checkout-session', { plan: planKey })
      const url = response.data.data?.url
      if (!url) {
        throw new Error('Stripe checkout session was not returned')
      }
      window.location.href = url
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Checkout could not be started')
    } finally {
      setBusyPlan(null)
    }
  }

  const openPortal = async () => {
    try {
      setOpeningPortal(true)
      const response = await api.post('/billing/portal-session')
      const url = response.data.data?.url
      if (!url) {
        throw new Error('Billing portal URL was not returned')
      }
      window.location.href = url
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Billing portal could not be opened')
    } finally {
      setOpeningPortal(false)
    }
  }

  return (
    <div className="atlas-page">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="atlas-hero mb-10">
          <div>
            <p className="atlas-kicker">Commercial launchpad</p>
            <h1>Choose a plan that matches your learning model.</h1>
            <p>Start with a learner seat, grow into a family workspace, or run structured teaching programs with admin visibility.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {!isAuthenticated ? (
                <Link to="/register" className="btn btn-primary w-full sm:w-auto">Create account</Link>
              ) : hasManagedSubscription ? (
                <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={openPortal} disabled={openingPortal || !hasCustomerPortal}>
                  {openingPortal ? 'Opening billing...' : 'Manage billing'}
                </button>
              ) : (
                <Link to="/dashboard" className="btn btn-primary w-full sm:w-auto">Go to dashboard</Link>
              )}
              <Link to="/courses" className="btn btn-outline w-full border-white/70 text-white hover:bg-white/10 dark:border-white/30 dark:text-white dark:hover:bg-white/10 sm:w-auto">Explore courses</Link>
            </div>
          </div>
          <div className="atlas-hero-card">
            <div className="space-y-4 text-sm text-white/85">
              <div className="flex items-start gap-3">
                <FiCreditCard className="mt-0.5 text-lg text-[#f8c16c]" />
                <div>
                  <p className="font-semibold text-white">Stripe subscriptions</p>
                  <p>Real checkout, webhook syncing, and the billing portal are now wired into Auralex.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiShield className="mt-0.5 text-lg text-[#a7e8d5]" />
                <div>
                  <p className="font-semibold text-white">Account status</p>
                  <p>
                    {effectiveBilling
                      ? `Current plan: ${effectiveBilling.plan} · ${effectiveBilling.status}${effectiveBilling.cancelAtPeriodEnd ? ' · cancels at period end' : ''}`
                      : 'Sign in to launch checkout and manage your subscription.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {enrichedPlans.map((plan) => {
            const isCurrentPlan = effectiveBilling?.plan === plan.key && hasManagedSubscription
            const canSubscribeToPlan = isAuthenticated && canStartCheckout && plan.available

            return (
              <section key={plan.name} className="atlas-panel p-6">
                <p className="atlas-kicker">{plan.name}</p>
                <strong className="mt-2 block text-4xl text-ink dark:text-white">{plan.priceLabel}</strong>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
                <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-primary-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {!isAuthenticated ? (
                  <Link to={plan.href} className="btn btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 text-center">
                    <FiUsers />
                    {plan.cta}
                  </Link>
                ) : hasManagedSubscription ? (
                  <button
                    type="button"
                    className="btn btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 text-center"
                    onClick={openPortal}
                    disabled={openingPortal || !hasCustomerPortal}
                  >
                    <FiCreditCard />
                    {isCurrentPlan ? 'Manage current plan' : 'Change in billing portal'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 text-center"
                    onClick={() => startCheckout(plan.key)}
                    disabled={busyPlan === plan.key || !canSubscribeToPlan}
                  >
                    <FiCreditCard />
                    {!plan.available ? 'Plan not configured' : busyPlan === plan.key ? 'Opening checkout...' : `Subscribe to ${plan.name}`}
                  </button>
                )}
              </section>
            )
          })}
        </div>

        <section className="atlas-panel mt-10 p-6">
          <p className="atlas-kicker">Go-live operations</p>
          <h2 className="text-2xl text-ink dark:text-white">What still needs live-business setup</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              'Add your live Stripe secret, webhook secret, and plan price IDs in the backend environment.',
              'Enable customer portal plan changes, invoices, and cancellation behavior in Stripe.',
              'Review Terms, Privacy, refund policy, and tax handling with legal and finance ownership.',
              'Set billing support workflows for failed payments, refunds, disputes, and account recovery.',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#f6efe7] p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">{item}</div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
