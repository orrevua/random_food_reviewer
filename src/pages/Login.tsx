import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/db'
import { useTranslation } from '../i18n/context'
import LangToggle from '../components/LangToggle'
import ThemeToggle from '../components/ThemeToggle'
import Spinner from '../components/Spinner'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const { t } = useTranslation()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'in') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setInfo(t('login.checkEmail'))
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const toggleMode = () => {
    setMode((m) => (m === 'in' ? 'up' : 'in'))
    setError(null)
    setInfo(null)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <ThemeToggle />
          <LangToggle />
        </div>
        <div className="auth-brand">
          <div className="auth-brand-mark">🍜</div>
          <div>
            <div className="auth-title">Food Reviewer</div>
            <div className="auth-subtitle">
              {mode === 'in' ? t('login.welcomeBack') : t('login.createAccountCta')}
            </div>
          </div>
        </div>

        <form className="stack-lg" onSubmit={submit}>
          <div className="stack">
            <label className="stack" style={{ gap: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('login.emailLabel')}</span>
              <input
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="stack" style={{ gap: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('login.passwordLabel')}</span>
              <input
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                required
              />
            </label>
          </div>

          <button type="submit" className="primary" disabled={busy} style={{ width: '100%' }}>
            {busy ? (
              <Spinner size="sm" label={t('common.pleaseWait')} />
            ) : mode === 'in' ? (
              t('login.signIn')
            ) : (
              t('login.createAccount')
            )}
          </button>
        </form>

        {error && <p className="msg-error" style={{ marginTop: 16 }}>{error}</p>}
        {info && <p className="msg-success" style={{ marginTop: 16 }}>{info}</p>}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--ink-soft)' }}>
          {mode === 'in' ? t('login.noAccount') : t('login.haveAccount')}{' '}
          <button type="button" className="ghost" onClick={toggleMode} style={{ padding: '2px 4px', color: 'var(--accent)' }}>
            {mode === 'in' ? t('login.signUp') : t('login.signIn')}
          </button>
        </div>
      </div>
    </div>
  )
}
