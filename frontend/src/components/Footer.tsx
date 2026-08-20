import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <img src={`${import.meta.env.BASE_URL}auralex-mark.svg`} alt="Auralex" className="h-9 w-9 rounded-xl shadow-[0_12px_30px_rgba(20,184,166,0.28)]" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Auralex</p>
              <h2 className="text-lg font-semibold text-ink dark:text-white">Language mastery, shaped with clarity.</h2>
            </div>
          </div>
          <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Bring learning progress, teacher operations, family visibility, and community support into one premium workspace.
          </p>
        </div>
        <div className="border-t border-neutral-200 pt-6 text-center dark:border-neutral-700 md:border-0 md:pt-0 md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Product</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/courses" className="text-slate-600 transition hover:text-primary-500 dark:text-slate-300 dark:hover:text-white">Courses</Link>
            <Link to="/pricing" className="text-slate-600 transition hover:text-primary-500 dark:text-slate-300 dark:hover:text-white">Pricing</Link>
            <Link to="/forum" className="text-slate-600 transition hover:text-primary-500 dark:text-slate-300 dark:hover:text-white">Community forum</Link>
          </div>
        </div>
        <div className="border-t border-neutral-200 pt-6 text-center dark:border-neutral-700 md:border-0 md:pt-0 md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Legal</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/terms" className="text-slate-600 transition hover:text-primary-500 dark:text-slate-300 dark:hover:text-white">Terms of service</Link>
            <Link to="/privacy" className="text-slate-600 transition hover:text-primary-500 dark:text-slate-300 dark:hover:text-white">Privacy policy</Link>
            <Link to="/cookies" className="text-slate-600 transition hover:text-primary-500 dark:text-slate-300 dark:hover:text-white">Cookie policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
