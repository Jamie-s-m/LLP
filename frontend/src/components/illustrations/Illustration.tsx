import illustrationUrls, { type IllustrationName } from './illustrationRegistry'

export type { IllustrationName }

type IllustrationProps = {
  name: IllustrationName
  className?: string
  /** Decorative by default (empty alt, aria-hidden) - pass real alt text only when the
      illustration is the sole carrier of information on screen (rare; most uses here are
      alongside real copy that already says the same thing). */
  alt?: string
  loading?: 'lazy' | 'eager'
}

// The single seam between "functional icon" (react-icons/pi, imported directly in
// components) and "emotional/product artwork" (this). Keeping illustrations behind one
// component - rather than importing SVG URLs ad hoc per page - is what makes that boundary
// enforceable instead of just a convention nobody checks.
export default function Illustration({ name, className = '', alt = '', loading = 'lazy' }: IllustrationProps) {
  return (
    <img
      src={illustrationUrls[name]}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      loading={loading}
      draggable={false}
      className={className}
    />
  )
}
