import { Link } from 'react-router-dom'
import { PiStarFill } from 'react-icons/pi'
import Pill from './Pill'
import ProgressBar from './ProgressBar'
import Illustration from '../illustrations/Illustration'
import { courseDomainFor, DOMAIN_META } from '../../utils/courseDomain'
import { useI18n } from '../../utils/i18n'

const LEVEL_PILL: Record<string, 'success' | 'info' | 'warning'> = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
}

type CourseCardProps = {
  id: string
  title: string
  description?: string
  category?: string
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
  description,
  category,
  level,
  rating,
  reviewsCount,
  progressPercentage,
  to,
  className = '',
}: CourseCardProps) {
  const { t } = useI18n()
  const domain = courseDomainFor({ title, category })
  const meta = DOMAIN_META[domain]
  const levelKey = (level || '').toLowerCase()

  return (
    <Link
      key={id}
      to={to}
      className={`dimensional-card group block overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] transition-transform duration-300 ${className}`}
    >
      <div
        className="flex h-32 items-center justify-center"
        style={{ background: `color-mix(in srgb, var(${meta.colorVar}) 22%, var(--surface-strong))` }}
      >
        <Illustration name={meta.illustration} className="h-24 w-24" />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: `color-mix(in srgb, var(${meta.colorVar}) 16%, transparent)`, color: `var(${meta.colorVar})` }}
          >
            {t(meta.labelKey)}
          </span>
          {level ? <Pill variant={LEVEL_PILL[levelKey] || 'neutral'}>{level}</Pill> : null}
        </div>
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{title}</h3>
        {description ? <p className="line-clamp-2 whitespace-pre-line text-sm text-[var(--text-muted)]">{description}</p> : null}
        {typeof progressPercentage === 'number' ? (
          <ProgressBar value={progressPercentage} />
        ) : rating ? (
          <p className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
            <PiStarFill className="text-[var(--warning)]" aria-hidden="true" /> {rating.toFixed(1)} {reviewsCount ? `· ${reviewsCount} reviews` : ''}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
