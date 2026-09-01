import type { ComponentType, ReactNode } from 'react'
import { FiInbox } from 'react-icons/fi'

type EmptyStateProps = {
  icon?: ComponentType<{ size?: number }>
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

// Shared "nothing here yet" pattern. Several audited screens rendered an empty result the
// same way as a broken fetch (silently blank) - this component exists so that distinction is
// always visible: an EmptyState is a deliberate, honest "there's genuinely nothing here",
// never a stand-in for an error (see ErrorState for that).
export default function EmptyState({ icon: Icon = FiInbox, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] p-10 text-center dark:border-[var(--dark-border)] ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--border-light)] text-[var(--text-muted)] dark:bg-white/5 dark:text-[var(--dark-text-secondary)]">
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] dark:text-[var(--dark-text-primary)]">{title}</h3>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--text-muted)] dark:text-[var(--dark-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
