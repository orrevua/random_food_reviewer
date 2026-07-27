import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/db'

export default function Login() {
  const { signIn, signUp } = useAuth()
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
        setInfo('Check your email to confirm your account (if confirmation is enabled).')
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
        <div className="auth-brand">
          <div className="auth-brand-mark">🍜</div>
          <div>
            <div className="auth-title">Food Reviewer</div>
            <div className="auth-subtitle">
              {mode === 'in' ? 'Welcome back — sign in to continue.' : 'Create an account to start reviewing.'}
            </div>
          </div>
        </div>

        <form className="stack-lg" onSubmit={submit}>
          <div className="stack">
            <label className="stack" style={{ gap: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="stack" style={{ gap: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                required
              />
            </label>
          </div>

          <button type="submit" className="primary" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {error && <p className="msg-error" style={{ marginTop: 16 }}>{error}</p>}
        {info && <p className="msg-success" style={{ marginTop: 16 }}>{info}</p>}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--ink-soft)' }}>
          {mode === 'in' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" className="ghost" onClick={toggleMode} style={{ padding: '2px 4px', color: 'var(--accent)' }}>
            {mode === 'in' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
