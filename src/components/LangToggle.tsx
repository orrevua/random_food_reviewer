import { useTranslation } from '../i18n/context'

export default function LangToggle() {
  const { locale, setLocale } = useTranslation()
  return (
    <span className="lang-toggle" aria-label="Language">
      <button
        type="button"
        className="ghost"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        style={{
          padding: '2px 6px',
          fontWeight: locale === 'en' ? 700 : 400,
          textDecoration: locale === 'en' ? 'underline' : 'none',
        }}
      >
        EN
      </button>
      <span aria-hidden style={{ color: 'var(--ink-soft)' }}>|</span>
      <button
        type="button"
        className="ghost"
        onClick={() => setLocale('pt')}
        aria-pressed={locale === 'pt'}
        style={{
          padding: '2px 6px',
          fontWeight: locale === 'pt' ? 700 : 400,
          textDecoration: locale === 'pt' ? 'underline' : 'none',
        }}
      >
        PT
      </button>
    </span>
  )
}
