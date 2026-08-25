import { useEffect, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { useI18n } from '../utils/i18n'

type LanguageCode = 'en' | 'ru' | 'uz'

const languages: Array<{ code: LanguageCode; flag: string; shortLabel: string; labelKey: string }> = [
  { code: 'en', flag: '🇬🇧', shortLabel: 'GB', labelKey: 'languageSwitcher.english' },
  { code: 'ru', flag: '🇷🇺', shortLabel: 'RU', labelKey: 'languageSwitcher.russian' },
  { code: 'uz', flag: '🇺🇿', shortLabel: 'UZ', labelKey: 'languageSwitcher.uzbek' },
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
        <span aria-hidden="true" className="text-base">{current.flag}</span>
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
              <span aria-hidden="true" className="text-sm">{item.flag}</span>
              <span>{item.shortLabel}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
