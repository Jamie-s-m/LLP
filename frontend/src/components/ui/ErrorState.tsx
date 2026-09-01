import type { ReactNode } from 'react'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'

type ErrorStateProps = {
  title?: ReactNode
  description?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

// Shared "something actually went wrong" pattern - distinct from EmptyState on purpose. The
// audit found a systemic bug across several screens: a failed fetch (.catch(() => {})) rendered
// the exact same "no data" UI as a genuinely empty account, so users and the team had no signal
// that anything had broken. Screens migrating to this component should show ErrorState on a
// caught fetch failure and EmptyState only when the request succeeded with a genuinely empty
// result - never let the two collapse into the same visual state again.
export default function ErrorState({
  title = "Something didn't load",
  description = 'Check your connection and try again.',
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: ErrorStateProps) {
  return (
    <div role="alert" className={`flex flex-col items-center gap-3 rounded-2xl border border-[var(--error)]/20 bg-[var(--error-light)] p-10 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--error)]">
        <FiAlertTriangle size={22} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[var(--error)]/40 px-3 py-1.5 text-sm font-medium text-[var(--error)] transition-colors hover:bg-[var(--error)]/10"
        >
          <FiRefreshCw size={14} />
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
