import { useTheme, type Theme } from '../lib/theme'
import { useTranslation } from '../i18n/context'

const ICON: Record<Theme, string> = { light: '☀️', dark: '🌙', feast: '🍕' }

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useTranslation()
  const label = t('theme.change', { name: t(`theme.name.${theme}`) })
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span aria-hidden>{ICON[theme]}</span>
    </button>
  )
}
