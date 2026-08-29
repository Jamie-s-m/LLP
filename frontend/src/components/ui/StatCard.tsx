import type { ReactNode } from 'react'
import Card from './Card'
import Pill from './Pill'

type StatCardProps = {
  label: string
  value: ReactNode
  icon?: ReactNode
  change?: { direction: 'up' | 'down'; label: string }
  className?: string
}

export default function StatCard({ label, value, icon, change, className = '' }: StatCardProps) {
  return (
    <Card padding="md" className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
          {icon}
          {label}
        </span>
        {change ? (
          <Pill variant={change.direction === 'up' ? 'success' : 'error'}>
            {change.direction === 'up' ? '↑' : '↓'} {change.label}
          </Pill>
        ) : null}
      </div>
      <strong className="font-display text-3xl font-extrabold text-[var(--text-primary)]">{value}</strong>
    </Card>
  )
}
