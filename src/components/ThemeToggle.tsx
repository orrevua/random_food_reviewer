import { useTheme } from '../lib/theme'
import { useTranslation } from '../i18n/context'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark')
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span aria-hidden>{isDark ? '☀️' : '🌙'}</span>
    </button>
  )
}
