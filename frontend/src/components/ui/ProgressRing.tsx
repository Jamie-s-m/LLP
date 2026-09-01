import type { ReactNode } from 'react'

type ProgressRingProps = {
  value: number
  size?: number
  thickness?: number
  label?: ReactNode
  /** Accessible name for the progress value, e.g. "Course progress". Falls back to a generic
   * "Progress" label - pass this explicitly whenever there's more than one ring on a page. */
  ariaLabel?: string
  className?: string
}

export default function ProgressRing({
  value,
  size = 120,
  thickness = 10,
  label,
  ariaLabel = 'Progress',
  className = '',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative flex items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--accent) ${clamped * 3.6}deg, var(--border-light) 0deg)`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-[var(--surface)] text-center"
        style={{ width: size - thickness * 2, height: size - thickness * 2 }}
      >
        {label}
      </div>
    </div>
  )
}
