import { PiHeartFill, PiHeart } from 'react-icons/pi'

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
        index < hearts
          ? <PiHeartFill key={index} size={size} className="text-[var(--error)]" aria-hidden="true" />
          : <PiHeart key={index} size={size} className="text-[var(--border)]" aria-hidden="true" />
      ))}
    </div>
  )
}
