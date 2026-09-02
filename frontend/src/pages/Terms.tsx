import React from 'react'

function PendingDecision({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
      <p className="mb-1 font-semibold uppercase tracking-wide text-xs">Pending founder / legal decision</p>
      <div className="leading-6">{children}</div>
    </div>
  )
}

export default function Terms() {
  return (
    <div className="atlas-page">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="atlas-panel p-8">
          <p className="atlas-kicker">Legal</p>
          <h1 className="text-4xl text-ink dark:text-white">Terms of service</h1>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Last updated 2026-09-01</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700 dark:text-slate-200">
            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">1. What LinguaNest is</h2>
              <p className="mt-2">LinguaNest is a language-learning platform providing courses, lessons, exercises, flashcards, progress tracking, messaging, and account dashboards for students, teachers, parents, and administrators, accessible at linguanest.uz.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">2. Accounts</h2>
              <p className="mt-2">Creating an account requires accurate information (name, email, and a role selection of student, parent, or teacher). You are responsible for keeping your login credentials secure and for activity that happens under your account. Teacher access requires an application that an administrator reviews and approves before it takes effect.</p>
              <div className="mt-3">
                <PendingDecision>
                  Signup today has no age verification or parental-consent step, even though a Parent account type and family links exist.
                  The founder needs to decide LinguaNest&apos;s actual policy on minors creating their own accounts directly (a minimum age,
                  and whether parental consent is required below it) before this can be stated here as a real term rather than left open.
                </PendingDecision>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">3. Acceptable use</h2>
              <p className="mt-2">You agree to use LinguaNest lawfully and not to abuse its messaging, forum, or content-moderation systems — including harassment, spam, impersonation, or attempting to access another user&apos;s account or data without authorization.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">4. Subscriptions &amp; billing</h2>
              <p className="mt-2">Paid plans are charged in UZS (so&apos;m) via Payme or Click, whichever you choose at checkout. Each payment covers one month of access — neither provider auto-renews your plan, so you pay again to continue or to switch plans. Neither LinguaNest&apos;s servers nor its frontend ever receive your full card number — card details are entered directly into Payme&apos;s or Click&apos;s own hosted payment form. Current pricing is shown on the <a href="/pricing" className="text-primary-600 underline dark:text-primary-300">Pricing</a> page before you check out.</p>
              <div className="mt-3">
                <PendingDecision>
                  No refund or cancellation window is defined yet (e.g. prorated refunds, a grace period, or a no-refund policy).
                  The founder needs to set this explicitly — it cannot be inferred from the code, and stating one here without that
                  decision would be inventing a policy users could hold the business to.
                </PendingDecision>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">5. Your content</h2>
              <p className="mt-2">Forum posts, chat messages, and other content you submit remain yours. By posting, you allow LinguaNest to store and display it to the other users it&apos;s intended for (e.g. a class, a family link, or a public forum thread) as part of operating the service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">6. Termination</h2>
              <p className="mt-2">You may stop using LinguaNest at any time. We may suspend or terminate an account that violates these terms, including abusive behavior or fraudulent payment activity.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">7. Legal entity &amp; governing law</h2>
              <div className="mt-2">
                <PendingDecision>
                  The registered legal entity operating LinguaNest, its business address, and the jurisdiction/governing law for these
                  terms are not yet on file here. This section will name them once the founder confirms the business&apos;s actual
                  registration status — inventing a jurisdiction or entity name would be a false legal claim.
                </PendingDecision>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">8. Changes &amp; contact</h2>
              <p className="mt-2">We may update these terms as the product changes; the &ldquo;Last updated&rdquo; date above reflects the most recent revision. Questions about these terms can be sent to <a href="mailto:support@linguanest.uz" className="text-primary-600 underline dark:text-primary-300">support@linguanest.uz</a>.</p>
            </section>

            <p className="text-xs text-slate-500 dark:text-slate-400">This page describes LinguaNest&apos;s actual product behavior as accurately as possible. The sections marked above still need a founder decision or formal legal review before they&apos;re complete — that gap is stated openly rather than hidden.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
