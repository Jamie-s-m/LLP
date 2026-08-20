import { Link } from 'react-router-dom'
import { FiCheckCircle, FiCreditCard, FiShield, FiUsers } from 'react-icons/fi'

const plans = [
  {
    name: 'Learner',
    price: '$19',
    cadence: '/month',
    description: 'For individual students building daily momentum.',
    cta: 'Start learning',
    href: '/register',
    features: ['Unlimited active courses', 'Flashcards and exercises', 'Progress tracking and streaks', 'Community chat access'],
  },
  {
    name: 'Family',
    price: '$39',
    cadence: '/month',
    description: 'For parents supporting one or more learners together.',
    cta: 'Create family account',
    href: '/register',
    features: ['Parent dashboard', 'Linked learner progress', 'Family learning insights', 'Priority support chat'],
  },
  {
    name: 'Teaching team',
    price: '$99',
    cadence: '/month',
    description: 'For teachers or small academies running guided programs.',
    cta: 'Open teaching workspace',
    href: '/register',
    features: ['Course authoring workspace', 'Progress monitoring', 'Teacher applications and moderation', 'Admin-ready operations center'],
  },
]

export default function Pricing() {
  return (
    <div className="atlas-page">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="atlas-hero mb-10">
          <div>
            <p className="atlas-kicker">Commercial launchpad</p>
            <h1>Choose a plan that matches your learning model.</h1>
            <p>Start with a learner seat, grow into a family workspace, or run structured teaching programs with admin visibility.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/register" className="btn btn-primary w-full sm:w-auto">Create account</Link>
              <Link to="/courses" className="btn btn-outline w-full border-white/70 text-white hover:bg-white/10 dark:border-white/30 dark:text-white dark:hover:bg-white/10 sm:w-auto">Explore courses</Link>
            </div>
          </div>
          <div className="atlas-panel p-6 dark:bg-white/10">
            <div className="space-y-4 text-sm text-white/85">
              <div className="flex items-start gap-3">
                <FiCreditCard className="mt-0.5 text-lg text-[#f8c16c]" />
                <div>
                  <p className="font-semibold text-white">Billing-ready UI</p>
                  <p>Pricing plans, legal links, and admin billing surfaces are now present and ready for payment provider integration.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiShield className="mt-0.5 text-lg text-[#a7e8d5]" />
                <div>
                  <p className="font-semibold text-white">Operational checklist</p>
                  <p>Before charging live customers, configure your payment processor, tax handling, invoices, and legal review.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <section key={plan.name} className="atlas-panel p-6">
              <p className="atlas-kicker">{plan.name}</p>
              <div className="mt-2 flex items-end gap-1">
                <strong className="text-4xl text-ink dark:text-white">{plan.price}</strong>
                <span className="pb-1 text-slate-500 dark:text-slate-400">{plan.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <FiCheckCircle className="mt-0.5 text-primary-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to={plan.href} className="btn btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 text-center">
                <FiUsers />
                {plan.cta}
              </Link>
            </section>
          ))}
        </div>

        <section className="atlas-panel mt-10 p-6">
          <p className="atlas-kicker">Before you sell</p>
          <h2 className="text-2xl text-ink dark:text-white">Commercial go-live checklist</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              'Connect a payment processor such as Stripe or Lemon Squeezy',
              'Set subscription webhooks and invoice email delivery',
              'Review Terms, Privacy, and Cookie policies with legal counsel',
              'Configure support, refunds, and billing contact workflows',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#f6efe7] p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">{item}</div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
