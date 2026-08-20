import { FiMoon, FiSun } from 'react-icons/fi'
import { useThemeStore } from '../store/themeStore'
import { useI18n } from '../utils/i18n'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useI18n()
  const label = theme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  )
}
