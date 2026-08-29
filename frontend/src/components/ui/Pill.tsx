import type { HTMLAttributes } from 'react'

export type PillVariant = 'accent' | 'success' | 'warning' | 'info' | 'error' | 'neutral'

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: PillVariant
}

const variantClasses: Record<PillVariant, string> = {
  accent: 'bg-[var(--accent-light)] text-[var(--accent)]',
  success: 'bg-[var(--success-light)] text-[var(--success)]',
  warning: 'bg-[var(--warning-light)] text-[var(--warning)]',
  info: 'bg-[var(--info-light)] text-[var(--info)]',
  error: 'bg-[var(--error-light)] text-[var(--error)]',
  neutral: 'bg-[var(--border-light)] text-[var(--text-muted)]',
}

export default function Pill({ variant = 'neutral', className = '', ...rest }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${variantClasses[variant]} ${className}`}
      {...rest}
    />
  )
}
