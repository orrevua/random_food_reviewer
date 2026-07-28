import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { errorMessage, getProfile, upsertProfile } from '../lib/db'
import { useTranslation } from '../i18n/context'
import Spinner from '../components/Spinner'

export default function Profile() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getProfile(user.id)
      .then((p) => setDisplayName(p?.display_name ?? ''))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [user])

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !displayName.trim()) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await upsertProfile(user.id, displayName.trim())
      setSuccess(t('profile.saved'))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <p><Link to="/">{t('common.back')}</Link></p>
      <h2>{t('profile.title')}</h2>
      {loading ? (
        <Spinner block label={t('common.loading')} />
      ) : (
        <form className="stack card" onSubmit={onSave}>
          <label className="stack">
            <span>{t('profile.displayNameLabel')}</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('profile.displayNamePlaceholder')}
            />
          </label>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
            {t('profile.emailLabel', { email: user?.email ?? '' })}
          </p>
          <button type="submit" className="primary" disabled={busy || !displayName.trim()}>
            {busy ? <Spinner size="sm" label={t('common.saving')} /> : t('common.save')}
          </button>
          {error && <p className="msg-error">{error}</p>}
          {success && <p className="msg-success">{success}</p>}
        </form>
      )}
    </div>
  )
}
