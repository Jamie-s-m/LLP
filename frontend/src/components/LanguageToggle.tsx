import { useEffect, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { useI18n } from '../utils/i18n'

type LanguageCode = 'en' | 'ru' | 'uz'

function FlagIcon({ code }: { code: LanguageCode }) {
  const commonProps = {
    viewBox: '0 0 32 32',
    className: 'h-6 w-6 shrink-0 overflow-hidden rounded-full border border-black/10 shadow-inner dark:border-white/20',
    'aria-hidden': true,
  }

  if (code === 'en') {
    return (
      <svg {...commonProps}>
        <rect width="32" height="32" rx="16" fill="#012169" />
        <path d="M0 0L32 32M32 0L0 32" stroke="#fff" strokeWidth="6" />
        <path d="M0 0L32 32M32 0L0 32" stroke="#C8102E" strokeWidth="3" />
        <path d="M16 0V32M0 16H32" stroke="#fff" strokeWidth="10" />
        <path d="M16 0V32M0 16H32" stroke="#C8102E" strokeWidth="5" />
      </svg>
    )
  }

  if (code === 'ru') {
    return (
      <svg {...commonProps}>
        <rect width="32" height="32" rx="16" fill="#fff" />
        <rect y="0" width="32" height="10.7" fill="#fff" />
        <rect y="10.7" width="32" height="10.7" fill="#0039A6" />
        <rect y="21.4" width="32" height="10.6" fill="#D52B1E" />
      </svg>
    )
  }

  // Uzbekistan: light blue / white / green bands separated by thin red lines, with a white
  // crescent and a cluster of stars in the canton - not the placeholder swirl this replaced.
  return (
    <svg {...commonProps}>
      <rect y="0" width="32" height="9.6" fill="#0099B5" />
      <rect y="9.6" width="32" height="1.6" fill="#CE1126" />
      <rect y="11.2" width="32" height="9.6" fill="#fff" />
      <rect y="20.8" width="32" height="1.6" fill="#CE1126" />
      <rect y="22.4" width="32" height="9.6" fill="#1EB53A" />
      <circle cx="8" cy="5" r="3.1" fill="#fff" />
      <circle cx="9.3" cy="5" r="2.6" fill="#0099B5" />
      <g fill="#fff">
        <circle cx="14" cy="2.9" r="0.55" />
        <circle cx="16.4" cy="2.9" r="0.55" />
        <circle cx="18.8" cy="2.9" r="0.55" />
        <circle cx="14" cy="5" r="0.55" />
        <circle cx="16.4" cy="5" r="0.55" />
        <circle cx="18.8" cy="5" r="0.55" />
        <circle cx="14" cy="7.1" r="0.55" />
        <circle cx="16.4" cy="7.1" r="0.55" />
        <circle cx="18.8" cy="7.1" r="0.55" />
      </g>
    </svg>
  )
}

const languages: Array<{ code: LanguageCode; labelKey: string }> = [
  { code: 'en', labelKey: 'languageSwitcher.english' },
  { code: 'ru', labelKey: 'languageSwitcher.russian' },
  { code: 'uz', labelKey: 'languageSwitcher.uzbek' },
]

export default function LanguageToggle() {
  const { language, setLanguage, t } = useI18n()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const current = languages.find((item) => item.code === language) || languages[0]

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const selectLanguage = (code: LanguageCode) => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-2.5 py-1.5 shadow-sm transition hover:bg-[var(--border-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        aria-label={t('languageSwitcher.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t(current.labelKey)}
      >
        <FlagIcon code={current.code} />
        <FiChevronDown size={14} className={`text-[var(--text-muted)] transition-transform dark:text-white/70 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[130] mt-2 flex min-w-fit gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] p-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-800" role="menu" aria-label={t('languageSwitcher.label')}>
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={language === item.code}
              aria-label={t(item.labelKey)}
              title={t(item.labelKey)}
              onClick={() => selectLanguage(item.code)}
              className={`inline-flex items-center justify-center rounded-full p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                language === item.code
                  ? 'bg-[var(--accent-light)] ring-1 ring-[var(--accent)] dark:bg-neutral-700 dark:ring-white/10'
                  : 'hover:bg-[var(--border-light)] dark:hover:bg-white/5'
              }`}
            >
              <FlagIcon code={item.code} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
