import React from 'react'

function PendingDecision({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
      <p className="mb-1 font-semibold uppercase tracking-wide text-xs">Pending founder / legal decision</p>
      <div className="leading-6">{children}</div>
    </div>
  )
}

export default function Privacy() {
  return (
    <div className="atlas-page">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="atlas-panel p-8">
          <p className="atlas-kicker">Legal</p>
          <h1 className="text-4xl text-ink dark:text-white">Privacy policy</h1>
          <p className="mt-2 text-xs uppercase tracking-wide text-muted">Last updated 2026-09-01</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-muted">
            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">1. What we collect</h2>
              <p className="mt-2">To operate LinguaNest we store: your name, email address, and role (student, parent, or teacher); learning data such as course progress, exercise attempts, placement-test results, and flashcard/vocabulary activity; content you create, including forum posts and chat messages; family links between parent and student accounts; and your subscription/billing status. Passwords are stored as one-way bcrypt hashes, never in plain text.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">2. What we don&apos;t store</h2>
              <p className="mt-2">We never receive or store your full card number. Payments are processed by Payme or Click through their own hosted checkout forms — card details go directly to them, not through LinguaNest&apos;s servers.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">3. How we use it</h2>
              <p className="mt-2">To run your account and learning experience, show your progress, enable messaging between the people you&apos;re actually connected to (e.g. a class or a linked family), process payments, and send account-related email (verification, password reset, receipts).</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">4. Who we share it with</h2>
              <p className="mt-2">We use a small number of named third-party services to operate LinguaNest: <strong>Payme</strong> and <strong>Click</strong> (payment processing), <strong>MongoDB Atlas</strong> (database hosting), <strong>Bird</strong> (transactional email delivery — verification links, password resets), and, if you choose to sign in that way, <strong>Google</strong> (OAuth sign-in). We don&apos;t sell personal data to anyone.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">5. Retention &amp; your choices</h2>
              <p className="mt-2">You can update your profile information directly in your account settings. To request a copy of your data or to have your account deleted, contact <a href="mailto:support@linguanest.uz" className="text-primary-600 underline dark:text-primary-300">support@linguanest.uz</a> — this is currently handled manually rather than through a self-serve export/delete tool.</p>
              <div className="mt-3">
                <PendingDecision>
                  There&apos;s no defined retention period yet (how long data is kept after account deletion or after a subscription
                  lapses) and no committed response timeframe for a data or deletion request. The founder needs to set these before
                  they can be stated here as real commitments.
                </PendingDecision>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">6. Children&apos;s data</h2>
              <div className="mt-2">
                <PendingDecision>
                  LinguaNest has a Parent account type and family links, but account signup itself has no age verification — a student
                  account can currently be created directly with no parental-consent step. The founder needs to decide the product&apos;s
                  real policy here (minimum age, whether direct student signup requires a linked parent) before this section can make
                  an accurate claim about how children&apos;s data is handled.
                </PendingDecision>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">7. Security</h2>
              <p className="mt-2">Connections to LinguaNest are encrypted (HTTPS). Passwords are hashed, never stored in readable form. Access to administrative and moderation features is restricted by account role.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">8. Changes &amp; contact</h2>
              <p className="mt-2">We may update this policy as the product changes; the &ldquo;Last updated&rdquo; date above reflects the most recent revision. Questions about this policy can be sent to <a href="mailto:support@linguanest.uz" className="text-primary-600 underline dark:text-primary-300">support@linguanest.uz</a>.</p>
            </section>

            <p className="text-xs text-muted">This page describes LinguaNest&apos;s actual data practices as accurately as possible. The sections marked above still need a founder decision or formal legal review before they&apos;re complete — that gap is stated openly rather than hidden.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
