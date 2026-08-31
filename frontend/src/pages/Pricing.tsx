import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiCreditCard, FiShield, FiTarget, FiUsers } from 'react-icons/fi'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useI18n } from '../utils/i18n'
import PaymeCheckoutButton from '../components/PaymeCheckoutButton'

type BillingPlanKey = 'local' | 'learner' | 'family' | 'teaching'

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
  bestFor: string
  // Payme-only plan (no Stripe price exists for it) - the "Local" plan.
  paymeOnly?: boolean
}

const plans: BillingPlan[] = [
  {
    key: 'local',
    name: 'Local',
    priceLabel: "39,000 so'm/month",
    description: "LinguaNest's full learner plan, priced for Uzbekistan and paid through Payme.",
    roleHint: 'student',
    cta: 'Start learning',
    href: '/register?role=student',
    available: true,
    paymeOnly: true,
    bestFor: 'Learners paying in soʻm who want the full course, flashcard, and progress experience at a local price.',
    features: ['Unlimited active courses', 'Flashcards and exercises', 'Progress tracking and streaks', 'Community chat access', 'Paid entirely through Payme'],
  },
  {
    key: 'learner',
    name: 'Learner',
    priceLabel: '$19/month',
    description: 'For individual students building daily momentum.',
    roleHint: 'student',
    cta: 'Start learning',
    href: '/register?role=student',
    available: true,
    bestFor: 'Independent learners who want structured progress and daily fluency momentum.',
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
    bestFor: 'Parents who want visibility, accountability, and support across the home learning loop.',
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
    bestFor: 'Teachers and small programs who need course control, learner oversight, and admin visibility.',
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
    provider?: 'none' | 'stripe' | 'payme'
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
  } | null>(null)
  const [canStartCheckout, setCanStartCheckout] = useState(true)
  const [hasCustomerPortal, setHasCustomerPortal] = useState(false)
  const [configuredPlans, setConfiguredPlans] = useState<Record<string, boolean>>({})
  const [planPricesUzs, setPlanPricesUzs] = useState<Record<string, number>>({})
  const [payme, setPayme] = useState<{ available: boolean; merchantId: string; checkoutBaseUrl: string }>({
    available: false,
    merchantId: '',
    checkoutBaseUrl: '',
  })
  const { user, isAuthenticated, setUser } = useAuthStore()
  const { t, language } = useI18n()

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
        setPlanPricesUzs(
          nextPlans.reduce((acc: Record<string, number>, plan: { key: string; priceUzs?: number }) => {
            if (plan.priceUzs) acc[plan.key] = plan.priceUzs
            return acc
          }, {})
        )
        const paymeConfig = response.data.data?.payme
        if (paymeConfig) {
          setPayme({
            available: Boolean(paymeConfig.available),
            merchantId: paymeConfig.merchantId || '',
            checkoutBaseUrl: paymeConfig.checkoutBaseUrl || '',
          })
        }
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
    if (!checkoutState) return

    if (checkoutState === 'success') {
      toast.success('Checkout completed. Stripe will finish syncing your subscription in a moment.')
      if (isAuthenticated) {
        refreshBilling().catch(() => undefined)
      }
    }

    if (checkoutState === 'canceled') {
      toast('Checkout canceled')
    }

    if (checkoutState === 'payme') {
      // Payme's own redirect carries no reliable success/failure signal here (the webhook
      // that actually confirms payment can land before or after this redirect), so this
      // can't honestly claim success - it stays neutral and lets the real billing status
      // rendered below speak for itself once refreshBilling() resolves.
      toast(t('pricing.paymeReturnedMessage'))
      if (isAuthenticated) {
        refreshBilling().catch(() => undefined)
      }
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('checkout')
    setSearchParams(nextParams, { replace: true })
  }, [isAuthenticated, searchParams, setSearchParams])

  const effectiveBilling = billingStatus || user?.billing || null
  const hasManagedSubscription = activeStatuses.has((effectiveBilling?.status || 'inactive') as BillingStatus)
  // The Stripe billing portal is the only "manage billing" surface that exists - a Payme
  // subscription is real and active, but there's nothing to hand it off to, so it must not
  // be routed into the same dead disabled-button branch as an unconfigured Stripe portal.
  // billing.provider is new tonight and unset ('none') on any subscription granted before
  // this deploy - every such pre-existing active subscription is necessarily Stripe (Payme
  // grants didn't exist until now), so treat an active status with no provider as Stripe too;
  // otherwise a grandfathered Stripe subscriber would fall through to the live "Subscribe"
  // button below and could start paying for a second, duplicate subscription.
  const isStripeManaged = hasManagedSubscription && effectiveBilling?.provider !== 'payme'
  const isPaymeManaged = hasManagedSubscription && effectiveBilling?.provider === 'payme'

  const enrichedPlans = useMemo(
    () => plans.map((plan) => ({
      ...plan,
      available: configuredPlans[plan.key] ?? false,
      name: plan.key === 'local' ? t('pricing.localName') : plan.key === 'learner' ? t('pricing.learnerName') : plan.key === 'family' ? t('pricing.familyName') : t('pricing.teachingName'),
      bestFor: plan.key === 'local' ? t('pricing.localBestFor') : plan.key === 'learner' ? t('pricing.learnerBestFor') : plan.key === 'family' ? t('pricing.familyBestFor') : t('pricing.teachingBestFor'),
    })),
    [configuredPlans, t]
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
            <p className="atlas-kicker">{t('pricing.kicker')}</p>
            <h1>{t('pricing.title')}</h1>
            <p>{t('pricing.copy')}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {!isAuthenticated ? (
                <Link to="/register" className="btn btn-primary w-full sm:w-auto">{t('pricing.createAccount')}</Link>
              ) : isStripeManaged ? (
                <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={openPortal} disabled={openingPortal || !hasCustomerPortal}>
                  {openingPortal ? t('pricing.openingBilling') : t('pricing.manageBilling')}
                </button>
              ) : (
                <Link to="/dashboard" className="btn btn-primary w-full sm:w-auto">{t('pricing.goToDashboard')}</Link>
              )}
              <Link to="/courses" className="btn btn-outline w-full sm:w-auto">{t('pricing.exploreCourses')}</Link>
            </div>
          </div>
          <div className="atlas-hero-card">
            <div className="space-y-4 text-sm text-white/85">
              <div className="flex items-start gap-3">
                <FiCreditCard className="mt-0.5 text-lg text-[#f8c16c]" />
                <div>
                  <p className="font-semibold text-white">{t('pricing.stripeTitle')}</p>
                  <p>{t('pricing.stripeCopy')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiShield className="mt-0.5 text-lg text-[#a7e8d5]" />
                <div>
                  <p className="font-semibold text-white">{t('pricing.accountStatus')}</p>
                  <p>
                    {effectiveBilling
                      ? t('pricing.accountStatusValue', {
                        plan: effectiveBilling.plan,
                        status: effectiveBilling.status,
                        cancelSuffix: effectiveBilling.cancelAtPeriodEnd ? t('pricing.cancelSuffix') : '',
                      })
                      : t('pricing.accountStatusEmpty')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiTarget className="mt-0.5 text-lg text-[#cdd5ff]" />
                <div>
                  <p className="font-semibold text-white">{t('pricing.clearNextStep')}</p>
                  <p>{t('pricing.clearNextStepCopy')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="atlas-panel mb-10 p-6">
          <p className="atlas-kicker">{t('pricing.howToStart')}</p>
          <h2 className="text-2xl text-ink dark:text-white">{t('pricing.simplerPath')}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[t('pricing.onboarding1'), t('pricing.onboarding2'), t('pricing.onboarding3')].map((step, index) => (
              <div key={step} className="rounded-2xl bg-[#f6efe7] p-5 dark:bg-white/5">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">0{index + 1}</p>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {enrichedPlans.map((plan) => {
            const isCurrentPlan = effectiveBilling?.plan === plan.key && hasManagedSubscription
            const canSubscribeToPlan = isAuthenticated && canStartCheckout && plan.available

            return (
              <section key={plan.name} className="atlas-panel p-6">
                <p className="atlas-kicker">{plan.name}</p>
                <strong className="mt-2 block text-4xl text-ink dark:text-white">{plan.priceLabel}</strong>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
                <div className="mt-4 rounded-2xl bg-[#f6efe7] p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
                  <strong className="block text-ink dark:text-white">{t('common.bestFor')}</strong>
                  <p className="mt-2">{plan.bestFor}</p>
                </div>
                <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-primary-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {(() => {
                  const paymeSection = payme.available && planPricesUzs[plan.key] && user?.id ? (
                    <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                        {t('pricing.orDivider')}
                        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                      </p>
                      <p className="mt-3 text-sm font-semibold text-ink dark:text-white">{t('pricing.paymeSectionTitle')}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('pricing.paymeSectionCopy')} · {planPricesUzs[plan.key].toLocaleString()} so&apos;m/month</p>
                      <div className="mt-3">
                        <PaymeCheckoutButton
                          merchantId={payme.merchantId}
                          checkoutBaseUrl={payme.checkoutBaseUrl}
                          userId={user.id}
                          plan={plan.key}
                          amountTiyin={planPricesUzs[plan.key] * 100}
                          lang={language}
                          callbackUrl={`${window.location.origin}/pricing?checkout=payme`}
                        />
                      </div>
                    </div>
                  ) : null

                  if (!isAuthenticated) {
                    return (
                      <Link to={plan.href} className="btn btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 text-center">
                        <FiUsers />
                        {plan.cta}
                      </Link>
                    )
                  }

                  if (isStripeManaged) {
                    return (
                      <button
                        type="button"
                        className="btn btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 text-center"
                        onClick={openPortal}
                        disabled={openingPortal || !hasCustomerPortal}
                      >
                        <FiCreditCard />
                        {isCurrentPlan ? t('pricing.manageBilling') : t('pricing.changeInPortal')}
                      </button>
                    )
                  }

                  if (isPaymeManaged) {
                    return (
                      <>
                        <p className="mt-6 rounded-xl bg-[#f6efe7] p-3 text-center text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
                          {isCurrentPlan ? t('pricing.paymeManagedCurrent') : t('pricing.paymeManagedOther', { plan: plan.name })}
                        </p>
                        {paymeSection}
                      </>
                    )
                  }

                  // This plan only exists to be paid via Payme (see the "Local" plan) - it
                  // has no Stripe price configured, so showing the generic Stripe subscribe
                  // button here would either be disabled forever or 503 on click. Show only
                  // the Payme section, or a plain "not available yet" note if Payme itself
                  // isn't configured in this environment.
                  if (plan.paymeOnly) {
                    return paymeSection || (
                      <p className="mt-6 rounded-xl bg-[#f6efe7] p-3 text-center text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                        {t('pricing.planNotConfigured')}
                      </p>
                    )
                  }

                  return (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 text-center"
                        onClick={() => startCheckout(plan.key)}
                        disabled={busyPlan === plan.key || !canSubscribeToPlan}
                      >
                        <FiCreditCard />
                        {!plan.available ? t('pricing.planNotConfigured') : busyPlan === plan.key ? t('pricing.openingCheckout') : t('pricing.subscribeTo', { plan: plan.name })}
                      </button>
                      {paymeSection}
                    </>
                  )
                })()}
              </section>
            )
          })}
        </div>

        <section className="atlas-panel mt-10 p-6">
          <p className="atlas-kicker">{t('pricing.trustTitle')}</p>
          <h2 className="text-2xl text-ink dark:text-white">{t('pricing.trustHeading')}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              t('pricing.trust1'),
              t('pricing.trust2'),
              t('pricing.trust3'),
              t('pricing.trust4'),
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#f6efe7] p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">{item}</div>
            ))}
          </div>
        </section>

        <section className="atlas-panel mt-10 p-6">
          <p className="atlas-kicker">{t('pricing.faq')}</p>
          <h2 className="text-2xl text-ink dark:text-white">{t('pricing.faqHeading')}</h2>
          <div className="mt-5 grid gap-4">
            {[
              { question: t('pricing.faq1q'), answer: t('pricing.faq1a') },
              { question: t('pricing.faq2q'), answer: t('pricing.faq2a') },
              { question: t('pricing.faq3q'), answer: t('pricing.faq3a') },
            ].map((item) => (
              <div key={item.question} className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <h3 className="text-base font-semibold text-ink dark:text-white">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
