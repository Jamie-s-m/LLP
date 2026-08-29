type HeartsRowProps = {
  hearts: number
  maxHearts?: number
  size?: number
  className?: string
}

export default function HeartsRow({ hearts, maxHearts = 5, size = 20, className = '' }: HeartsRowProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`${hearts} of ${maxHearts} hearts remaining`}>
      {Array.from({ length: maxHearts }).map((_, index) => (
        <span key={index} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">
          {index < hearts ? '❤️' : '🤍'}
        </span>
      ))}
    </div>
  )
}
