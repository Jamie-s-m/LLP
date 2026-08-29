import type { ButtonHTMLAttributes } from 'react'

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect'

type OptionCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  state?: OptionState
  marker?: string
}

const stateClasses: Record<OptionState, string> = {
  default: 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]',
  selected: 'border-[var(--accent)] bg-[var(--accent-light)]',
  correct: 'border-[var(--success)] bg-[var(--success-light)]',
  incorrect: 'border-[var(--error)] bg-[var(--error-light)]',
}

const markerStateClasses: Record<OptionState, string> = {
  default: 'border-[var(--border-strong)] text-[var(--text-muted)]',
  selected: 'border-[var(--accent)] bg-[var(--accent)] text-white',
  correct: 'border-[var(--success)] bg-[var(--success)] text-white',
  incorrect: 'border-[var(--error)] bg-[var(--error)] text-white',
}

export default function OptionCard({
  state = 'default',
  marker,
  className = '',
  children,
  ...rest
}: OptionCardProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left font-medium text-[var(--text-primary)] transition-all duration-200 disabled:cursor-not-allowed ${stateClasses[state]} ${className}`}
      {...rest}
    >
      {marker ? (
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${markerStateClasses[state]}`}
        >
          {marker}
        </span>
      ) : null}
      <span className="flex-1">{children}</span>
    </button>
  )
}
