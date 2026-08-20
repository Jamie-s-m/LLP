import { useI18n } from '../utils/i18n'

export default function LanguageToggle() {
  const { language, setLanguage, t } = useI18n()

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
      <span className="hidden sm:inline">{t('languageSwitcher.label')}</span>
      <select
        aria-label={t('languageSwitcher.label')}
        className="bg-transparent text-sm font-semibold outline-none"
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'ru' | 'uz')}
      >
        <option value="en">{t('languageSwitcher.english')}</option>
        <option value="ru">{t('languageSwitcher.russian')}</option>
        <option value="uz">{t('languageSwitcher.uzbek')}</option>
      </select>
    </label>
  )
}
