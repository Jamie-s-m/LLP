import type { ReactNode } from 'react'

type ProgressRingProps = {
  value: number
  size?: number
  thickness?: number
  label?: ReactNode
  className?: string
}

export default function ProgressRing({
  value,
  size = 120,
  thickness = 10,
  label,
  className = '',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
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
