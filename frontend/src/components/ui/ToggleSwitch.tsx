type ToggleSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export default function ToggleSwitch({ checked, onChange, label, disabled, className = '' }: ToggleSwitchProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-3 ${className}`}>
      <input
        type="checkbox"
        className="toggle-switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
      {label ? <span className="text-sm text-[var(--text-primary)]">{label}</span> : null}
    </label>
  )
}
