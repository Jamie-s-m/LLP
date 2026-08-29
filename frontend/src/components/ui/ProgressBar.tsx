type ProgressBarProps = {
  value: number
  className?: string
  fillClassName?: string
}

export default function ProgressBar({ value, className = '', fillClassName = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-[var(--border-light)] ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full bg-[var(--accent)] transition-all duration-500 ${fillClassName}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
