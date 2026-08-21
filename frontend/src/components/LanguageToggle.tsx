import { useEffect, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { useI18n } from '../utils/i18n'

type LanguageCode = 'en' | 'ru' | 'uz'

const languages: Array<{ code: LanguageCode; flag: string; labelKey: string }> = [
  { code: 'en', flag: '🇬🇧', labelKey: 'languageSwitcher.english' },
  { code: 'ru', flag: '🇷🇺', labelKey: 'languageSwitcher.russian' },
  { code: 'uz', flag: '🇺🇿', labelKey: 'languageSwitcher.uzbek' },
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
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 text-lg shadow-sm transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
        aria-label={t('languageSwitcher.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t(current.labelKey)}
      >
        <span aria-hidden="true">{current.flag}</span>
        <FiChevronDown size={14} className={`text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[130] mt-2 flex min-w-[126px] gap-1 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-800" role="menu" aria-label={t('languageSwitcher.label')}>
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={language === item.code}
              aria-label={t(item.labelKey)}
              title={t(item.labelKey)}
              onClick={() => selectLanguage(item.code)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${language === item.code ? 'bg-primary-500/15 ring-1 ring-primary-500/30' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
            >
              <span aria-hidden="true">{item.flag}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
