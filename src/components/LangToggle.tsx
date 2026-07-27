import { useTranslation } from '../i18n/context'

export default function LangToggle() {
  const { locale, setLocale } = useTranslation()
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className={`lang-toggle-option ${locale === 'en' ? 'is-active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        className={`lang-toggle-option ${locale === 'pt' ? 'is-active' : ''}`}
        onClick={() => setLocale('pt')}
        aria-pressed={locale === 'pt'}
      >
        PT
      </button>
    </div>
  )
}
