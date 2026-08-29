import { forwardRef, useId, type InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div>
      {label ? (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input ref={ref} id={inputId} className={`input ${className}`} {...rest} />
      {error ? <p className="mt-1.5 text-sm text-[var(--error)]">{error}</p> : null}
    </div>
  )
})

export default TextField
