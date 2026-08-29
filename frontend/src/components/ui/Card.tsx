import { forwardRef, type HTMLAttributes } from 'react'

export type CardPadding = 'sm' | 'md' | 'lg' | 'none'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', className = '', ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] transition-colors duration-200 ${paddingClasses[padding]} ${className}`}
      {...rest}
    />
  )
})

export default Card
