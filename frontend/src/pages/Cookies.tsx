import React from 'react'

function PendingDecision({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
      <p className="mb-1 font-semibold uppercase tracking-wide text-xs">Pending founder / legal decision</p>
      <div className="leading-6">{children}</div>
    </div>
  )
}

export default function Cookies() {
  return (
    <div className="atlas-page">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="atlas-panel p-8">
          <p className="atlas-kicker">Legal</p>
          <h1 className="text-4xl text-ink dark:text-white">Cookie policy</h1>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Last updated 2026-09-01</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700 dark:text-slate-200">
            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">What LinguaNest actually stores in your browser</h2>
              <p className="mt-2">LinguaNest doesn&apos;t set third-party tracking cookies today. It uses your browser&apos;s local storage (not cookies, technically) to keep you signed in and remember your preferences: your session token and profile, your selected interface language, and your light/dark theme choice. These are strictly necessary for the app to function — clearing them signs you out and resets your preferences.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">Third-party services</h2>
              <p className="mt-2">When you check out, Payme or Click&apos;s own hosted payment pages may set their own cookies under their domains — those are governed by Payme&apos;s and Click&apos;s own policies, not this one. If you sign in with Google, Google&apos;s sign-in flow may do the same.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">Consent</h2>
              <div className="mt-2">
                <PendingDecision>
                  LinguaNest doesn&apos;t currently show a cookie-consent banner, and doesn&apos;t use any non-essential (analytics or
                  marketing) cookies that would require one. If that changes — e.g. a product analytics tool is added — this policy and
                  a real consent mechanism both need to be updated together, not after the fact. The founder should treat adding any
                  non-essential tracking as a decision that requires updating this page first.
                </PendingDecision>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink dark:text-white">Your controls</h2>
              <p className="mt-2">You can clear local storage or cookies for linguanest.uz at any time through your browser&apos;s settings; doing so will sign you out. Questions about this policy can be sent to <a href="mailto:support@linguanest.uz" className="text-primary-600 underline dark:text-primary-300">support@linguanest.uz</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
