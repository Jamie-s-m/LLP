import { Link } from 'react-router-dom'
import Pill from './Pill'
import ProgressBar from './ProgressBar'

const LANGUAGE_STYLES: Record<string, { gradient: string; flag: string }> = {
  german: { gradient: 'linear-gradient(135deg, #3A4A6B, #2A3A5B)', flag: '🇩🇪' },
  spanish: { gradient: 'linear-gradient(135deg, #C84B31, #8A2F1D)', flag: '🇪🇸' },
  french: { gradient: 'linear-gradient(135deg, #4A5FA8, #2E3D74)', flag: '🇫🇷' },
  japanese: { gradient: 'linear-gradient(135deg, #B23A5A, #7A2340)', flag: '🇯🇵' },
  turkish: { gradient: 'linear-gradient(135deg, #C84B31, #A33D28)', flag: '🇹🇷' },
  korean: { gradient: 'linear-gradient(135deg, #4A5FA8, #7A2340)', flag: '🇰🇷' },
  english: { gradient: 'linear-gradient(135deg, #2D6A4F, #1F4E38)', flag: '🇬🇧' },
  russian: { gradient: 'linear-gradient(135deg, #4A5FA8, #2A3A5B)', flag: '🇷🇺' },
  uzbek: { gradient: 'linear-gradient(135deg, #2D6A4F, #C84B31)', flag: '🇺🇿' },
}

const LEVEL_PILL: Record<string, 'success' | 'info' | 'warning'> = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
}

function styleForLanguage(language?: string) {
  const key = (language || '').toLowerCase()
  return LANGUAGE_STYLES[key] || { gradient: 'linear-gradient(135deg, #A8A29E, #78716C)', flag: '🌐' }
}

type CourseCardProps = {
  id: string
  title: string
  language?: string
  level?: string
  rating?: number
  reviewsCount?: number
  progressPercentage?: number
  to: string
  className?: string
}

export default function CourseCard({
  id,
  title,
  language,
  level,
  rating,
  reviewsCount,
  progressPercentage,
  to,
  className = '',
}: CourseCardProps) {
  const { gradient, flag } = styleForLanguage(language)
  const levelKey = (level || '').toLowerCase()

  return (
    <Link
      to={to}
      key={id}
      className={`group block overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      <div className="flex h-40 items-center justify-center" style={{ background: gradient }}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl">{flag}</span>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{title}</h3>
          {level ? <Pill variant={LEVEL_PILL[levelKey] || 'neutral'}>{level}</Pill> : null}
        </div>
        {typeof progressPercentage === 'number' ? (
          <ProgressBar value={progressPercentage} />
        ) : rating ? (
          <p className="text-sm text-[var(--text-muted)]">
            ★ {rating.toFixed(1)} {reviewsCount ? `· ${reviewsCount} reviews` : ''}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
