export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

type AvatarProps = {
  name?: string
  src?: string | null
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
}

const sizePixels: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
}

function initialsFrom(name?: string) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        width={sizePixels[size]}
        height={sizePixels[size]}
        loading="lazy"
        className={`flex-shrink-0 rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClasses[size]} ${className}`}
      style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }}
      aria-hidden={!name}
    >
      {initialsFrom(name)}
    </div>
  )
}
