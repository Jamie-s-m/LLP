import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiCreditCard, FiShield, FiTarget, FiUsers } from 'react-icons/fi'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useI18n } from '../utils/i18n'
import PaymeCheckoutButton from '../components/PaymeCheckoutButton'
import ClickCheckoutButton from '../components/ClickCheckoutButton'
import { track } from '../utils/analytics'

type BillingPlanKey = 'local' | 'learner' | 'family' | 'teaching'

// No incomplete/incomplete_expired - those were Stripe payment-intent states with no Payme/Click
// equivalent (both are simple one-time checkouts, not a multi-step payment-intent flow).
type BillingStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'refunded'

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
}

const plans: BillingPlan[] = [
  {
    key: 'local',
    name: 'Local',
    priceLabel: "39,000 so'm/month",
    description: "LinguaNest's full learner plan, priced for Uzbekistan and paid through Payme or Click.",
    roleHint: 'student',
    cta: 'Start learning',
    href: '/register?role=student',
    available: true,
    bestFor: 'Learners paying in soʻm who want the full course, flashcard, and progress experience at a local price.',
    features: ['Unlimited active courses', 'Flashcards and exercises', 'Progress tracking and streaks', 'Community chat access'],
  },
  {
    key: 'learner',
    name: 'Learner',
    priceLabel: "800,000 so'm/month",
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
    priceLabel: "1,200,000 so'm/month",
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
    priceLabel: "2,000,000 so'm/month",
    description: 'For teachers or small academies running guided programs.',
    roleHint: 'teacher',
    cta: 'Open teaching workspace',
    href: '/register?role=student&teacherInterest=1',
    available: true,
    bestFor: 'Teachers and small programs who need course control, learner oversight, and admin visibility.',
    features: ['Course authoring workspace', 'Progress monitoring', 'Teacher applications and moderation', 'Admin-ready operations center'],
  },
]

// Both rails are simple one-time checkouts, not an auto-renewing subscription the way Stripe
// was - "active" just means "paid, currentPeriodEnd hasn't passed yet." There's no portal to
// manage/cancel because there's nothing recurring to cancel; the learner just pays again
// before (or after) the period ends.
const activeStatuses = new Set<BillingStatus>(['trialing', 'active', 'past_due', 'unpaid'])

const STATUS_LABEL_KEYS: Record<BillingStatus, string> = {
  inactive: 'pricing.statusInactive',
  trialing: 'pricing.statusTrialing',
  active: 'pricing.statusActive',
  past_due: 'pricing.statusPastDue',
  canceled: 'pricing.statusCanceled',
  unpaid: 'pricing.statusUnpaid',
  refunded: 'pricing.statusRefunded',
}

export default function Pricing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [billingStatus, setBillingStatus] = useState<{
    plan: 'none' | BillingPlanKey
    status: BillingStatus
    provider?: 'none' | 'payme' | 'click'
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
  } | null>(null)
  const [configuredPlans, setConfiguredPlans] = useState<Record<string, boolean>>({})
  const [planPricesUzs, setPlanPricesUzs] = useState<Record<string, number>>({})
  const [payme, setPayme] = useState<{ available: boolean; merchantId: string; checkoutBaseUrl: string }>({
    available: false,
    merchantId: '',
    checkoutBaseUrl: '',
  })
  const [click, setClick] = useState<{ available: boolean; serviceId: string; merchantId: string; checkoutBaseUrl: string }>({
    available: false,
    serviceId: '',
    merchantId: '',
    checkoutBaseUrl: '',
  })
  const { user, isAuthenticated, setUser } = useAuthStore()
  const { t, language } = useI18n()

  useEffect(() => {
    track('pricing_viewed')
  }, [])

  const refreshBilling = async () => {
    const response = await api.get('/billing/me')
    const billing = response.data.data?.billing
    setBillingStatus(billing)
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
        const clickConfig = response.data.data?.click
        if (clickConfig) {
          setClick({
            available: Boolean(clickConfig.available),
            serviceId: clickConfig.serviceId || '',
            merchantId: clickConfig.merchantId || '',
            checkoutBaseUrl: clickConfig.checkoutBaseUrl || '',
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

    if (checkoutState === 'payme' || checkoutState === 'click') {
      // Neither Payme's nor Click's own redirect carries a reliable success/failure signal
      // here (the webhook that actually confirms payment can land before or after this
      // redirect), so this can't honestly claim success - it stays neutral and lets the real
      // billing status rendered below speak for itself once refreshBilling() resolves.
      toast(t('pricing.paymentReturnedMessage'))
      if (isAuthenticated) {
        refreshBilling().catch(() => undefined)
      }
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('checkout')
    setSearchParams(nextParams, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, searchParams, setSearchParams])

  const effectiveBilling = billingStatus || user?.billing || null
  const hasManagedSubscription = activeStatuses.has((effectiveBilling?.status || 'inactive') as BillingStatus)

  const enrichedPlans = useMemo(
    () => plans.map((plan) => ({
      ...plan,
      available: configuredPlans[plan.key] ?? false,
      name: plan.key === 'local' ? t('pricing.localName') : plan.key === 'learner' ? t('pricing.learnerName') : plan.key === 'family' ? t('pricing.familyName') : t('pricing.teachingName'),
      bestFor: plan.key === 'local' ? t('pricing.localBestFor') : plan.key === 'learner' ? t('pricing.learnerBestFor') : plan.key === 'family' ? t('pricing.familyBestFor') : t('pricing.teachingBestFor'),
    })),
    [configuredPlans, t]
  )

  // Friendly plan name for the raw plan key stored on a billing record ('none' when there
  // isn't a subscription yet) - previously interpolated straight into user-facing copy.
  const planNameFor = (planKey: string) => enrichedPlans.find((plan) => plan.key === planKey)?.name || planKey

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
              ) : (
                <Link to="/dashboard" className="btn btn-primary w-full sm:w-auto">{t('pricing.goToDashboard')}</Link>
              )}
              <Link to="/courses" className="btn btn-outline w-full sm:w-auto">{t('pricing.exploreCourses')}</Link>
            </div>
          </div>
          <div className="atlas-hero-card">
            <div className="space-y-4 text-sm text-white/85">
              <div className="flex items-start gap-3">
                <FiCreditCard className="mt-0.5 text-lg text-[var(--dark-accent)]" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-white">{t('pricing.localPaymentsTitle')}</p>
                  <p>{t('pricing.localPaymentsCopy')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiShield className="mt-0.5 text-lg text-[var(--dark-success)]" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-white">{t('pricing.accountStatus')}</p>
                  <p>
                    {effectiveBilling
                      ? t('pricing.accountStatusValue', {
                        plan: planNameFor(effectiveBilling.plan),
                        status: t(STATUS_LABEL_KEYS[effectiveBilling.status] || 'pricing.statusInactive'),
                        cancelSuffix: effectiveBilling.cancelAtPeriodEnd ? t('pricing.cancelSuffix') : '',
                      })
                      : t('pricing.accountStatusEmpty')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiTarget className="mt-0.5 text-lg text-[var(--dark-info)]" aria-hidden="true" />
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
              <div key={step} className="rounded-2xl bg-[var(--surface-strong)] p-5 dark:bg-white/5">
                <p className="text-sm font-semibold text-[var(--text-muted)]">0{index + 1}</p>
                <p className="mt-3 text-sm text-[var(--text-muted)]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {enrichedPlans.map((plan) => {
            const isCurrentPlan = effectiveBilling?.plan === plan.key && hasManagedSubscription
            const priceUzs = planPricesUzs[plan.key]
            const returnUrl = `${window.location.origin}/pricing?checkout=payme`
            const clickReturnUrl = `${window.location.origin}/pricing?checkout=click`

            return (
              <section key={plan.name} className="atlas-panel p-6">
                <h2 className="atlas-kicker">{plan.name}</h2>
                <strong className="mt-2 block text-4xl text-ink dark:text-white">{plan.priceLabel}</strong>
                <p className="mt-3 text-sm text-[var(--text-muted)]">{plan.description}</p>
                <div className="mt-4 rounded-2xl bg-[var(--surface-strong)] p-4 text-sm text-[var(--text-muted)] dark:bg-white/5">
                  <strong className="block text-ink dark:text-white">{t('common.bestFor')}</strong>
                  <p className="mt-2">{plan.bestFor}</p>
                </div>
                <ul className="mt-5 space-y-3 text-sm text-[var(--text-muted)]">
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
                ) : (
                  <div className="mt-6 space-y-3">
                    {isCurrentPlan ? (
                      <p className="rounded-xl bg-[var(--surface-strong)] p-3 text-center text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
                        {effectiveBilling?.currentPeriodEnd
                          ? t('pricing.currentlyActiveUntil', { date: new Date(effectiveBilling.currentPeriodEnd).toLocaleDateString() })
                          : t('pricing.currentlyActive')}
                      </p>
                    ) : null}

                    {!plan.available ? (
                      <p className="rounded-xl bg-[var(--surface-strong)] p-3 text-center text-sm text-[var(--text-muted)] dark:bg-white/5">
                        {t('pricing.planNotConfigured')}
                      </p>
                    ) : (
                      <>
                        {payme.available && priceUzs && user?.id ? (
                          <div onClick={() => track('checkout_started', { plan: plan.key, provider: 'payme' })}>
                            <PaymeCheckoutButton
                              merchantId={payme.merchantId}
                              checkoutBaseUrl={payme.checkoutBaseUrl}
                              userId={user.id}
                              plan={plan.key}
                              amountTiyin={priceUzs * 100}
                              lang={language}
                              callbackUrl={returnUrl}
                            />
                          </div>
                        ) : null}
                        {click.available && priceUzs && user?.id ? (
                          <div onClick={() => track('checkout_started', { plan: plan.key, provider: 'click' })}>
                            <ClickCheckoutButton
                              serviceId={click.serviceId}
                              merchantId={click.merchantId}
                              checkoutBaseUrl={click.checkoutBaseUrl}
                              userId={user.id}
                              plan={plan.key}
                              amountSom={priceUzs}
                              returnUrl={clickReturnUrl}
                              label={t('pricing.payWithClick')}
                            />
                          </div>
                        ) : null}
                        {!payme.available && !click.available ? (
                          <p className="rounded-xl bg-[var(--surface-strong)] p-3 text-center text-sm text-[var(--text-muted)] dark:bg-white/5">
                            {t('pricing.planNotConfigured')}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                )}
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
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[var(--surface-strong)] p-4 text-sm text-[var(--text-muted)] dark:bg-white/5">{item}</div>
            ))}
            <div className="rounded-2xl bg-[var(--surface-strong)] p-4 text-sm text-[var(--text-muted)] dark:bg-white/5">
              {t('pricing.trust4')}{' '}
              <Link to="/terms" className="font-semibold text-primary-600 underline dark:text-primary-300">
                {t('pricing.readTerms')}
              </Link>
              {' · '}
              <Link to="/privacy" className="font-semibold text-primary-600 underline dark:text-primary-300">
                {t('pricing.readPrivacy')}
              </Link>
            </div>
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
              <div key={item.question} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 dark:border-white/10 dark:bg-white/5">
                <h3 className="text-base font-semibold text-ink dark:text-white">{item.question}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
