type SpinnerProps = {
  size?: number
  label?: string
  className?: string
}

// Shared loading indicator. Several pages previously hand-rolled this exact div (animate-spin
// + border-b-2 + a hardcoded color), some with an accessible status announcement and some
// without - this version always announces via role="status" + a visually-hidden label so
// screen-reader users aren't left guessing whether something is happening.
export default function Spinner({ size = 20, label = 'Loading', className = '' }: SpinnerProps) {
  return (
    <span role="status" className={`inline-flex items-center ${className}`}>
      <span
        aria-hidden="true"
        className="animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]"
        style={{ width: size, height: size }}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
