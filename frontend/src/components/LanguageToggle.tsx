import { useEffect, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { useI18n } from '../utils/i18n'

type LanguageCode = 'en' | 'ru' | 'uz'

function FlagIcon({ code }: { code: LanguageCode }) {
  const commonProps = {
    viewBox: '0 0 32 32',
    className: 'h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20',
    'aria-hidden': true,
  }

  if (code === 'en') {
    return (
      <svg {...commonProps}>
        <rect width="32" height="32" rx="16" fill="#1F4E9D" />
        <rect x="0" y="0" width="32" height="32" fill="#FFFFFF" opacity="0.12" />
        <rect x="0" y="0" width="32" height="32" fill="#FFFFFF" opacity="0.08" />
        <rect x="0" y="0" width="13" height="32" fill="#FFFFFF" />
        <rect x="0" y="0" width="32" height="13" fill="#FFFFFF" />
        <rect x="0" y="0" width="6" height="32" fill="#C8102E" />
        <rect x="0" y="0" width="32" height="6" fill="#C8102E" />
        <rect x="0" y="13" width="32" height="6" fill="#C8102E" />
        <rect x="13" y="0" width="6" height="32" fill="#C8102E" />
      </svg>
    )
  }

  if (code === 'ru') {
    return (
      <svg {...commonProps}>
        <rect width="32" height="32" rx="16" fill="#FFFFFF" />
        <rect x="0" y="0" width="32" height="10.7" fill="#FFFFFF" />
        <rect x="0" y="10.7" width="32" height="10.7" fill="#2C5DFF" />
        <rect x="0" y="21.4" width="32" height="10.6" fill="#E52B50" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <rect width="32" height="32" rx="16" fill="#1E3A8A" />
      <rect x="0" y="0" width="32" height="32" fill="#FFFFFF" opacity="0.08" />
      <rect x="0" y="0" width="32" height="10.7" fill="#1E3A8A" />
      <rect x="0" y="10.7" width="32" height="10.7" fill="#00AEEF" />
      <rect x="0" y="21.4" width="32" height="10.6" fill="#1FBF73" />
      <circle cx="16" cy="16" r="6.4" fill="#F5D742" />
      <path d="M11.5 16H20.5M16 11.5V20.5" stroke="#1E3A8A" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

const languages: Array<{ code: LanguageCode; shortLabel: string; labelKey: string }> = [
  { code: 'en', shortLabel: 'GB', labelKey: 'languageSwitcher.english' },
  { code: 'ru', shortLabel: 'RU', labelKey: 'languageSwitcher.russian' },
  { code: 'uz', shortLabel: 'UZ', labelKey: 'languageSwitcher.uzbek' },
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
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0d3b3f] px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(10,26,31,0.18)] transition hover:bg-[#123f43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d3b3f] dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        aria-label={t('languageSwitcher.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t(current.labelKey)}
      >
        <FlagIcon code={current.code} />
        <span className="tracking-[0.14em] text-[11px] uppercase">{current.shortLabel}</span>
        <FiChevronDown size={14} className={`text-white/80 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[130] mt-2 flex min-w-[170px] gap-1.5 rounded-full border border-white/10 bg-[#0d3b3f] p-1.5 shadow-[0_18px_38px_rgba(10,26,31,0.2)] dark:border-neutral-700 dark:bg-neutral-800" role="menu" aria-label={t('languageSwitcher.label')}>
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={language === item.code}
              aria-label={t(item.labelKey)}
              title={t(item.labelKey)}
              onClick={() => selectLanguage(item.code)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${language === item.code ? 'bg-[#142d31] text-white shadow-inner ring-1 ring-white/10' : 'text-white/75 hover:bg-white/5'}`}
            >
              <FlagIcon code={item.code} />
              <span>{item.shortLabel}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
