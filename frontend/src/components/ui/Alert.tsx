import type { ReactNode } from 'react'
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

type AlertProps = {
  variant?: AlertVariant
  title?: ReactNode
  children: ReactNode
  className?: string
}

const variantConfig: Record<AlertVariant, { classes: string; Icon: typeof FiInfo; role: 'status' | 'alert' }> = {
  info: { classes: 'bg-[var(--info-light)] text-[var(--info)]', Icon: FiInfo, role: 'status' },
  success: { classes: 'bg-[var(--success-light)] text-[var(--success)]', Icon: FiCheckCircle, role: 'status' },
  warning: { classes: 'bg-[var(--warning-light)] text-[var(--warning)]', Icon: FiAlertTriangle, role: 'alert' },
  error: { classes: 'bg-[var(--error-light)] text-[var(--error)]', Icon: FiAlertCircle, role: 'alert' },
}

// Single Alert implementation for the app - previously every page that needed an inline
// warning/error/info banner hand-rolled its own colors (several with raw Tailwind classes
// that had no dark-mode pairing at all). Color alone never carries the meaning here: each
// variant also gets a distinct icon.
export default function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  const { classes, Icon, role } = variantConfig[variant]

  return (
    <div role={role} className={`flex items-start gap-3 rounded-xl p-4 text-sm ${classes} ${className}`}>
      <Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="mb-1 font-semibold">{title}</p> : null}
        <div className="text-[var(--text-primary)] dark:text-[var(--dark-text-primary)]">{children}</div>
      </div>
    </div>
  )
}
