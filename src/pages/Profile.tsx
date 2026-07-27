import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { errorMessage, getProfile, upsertProfile } from '../lib/db'

export default function Profile() {
  const { user } = useAuth()
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
      setSuccess('Perfil salvo.')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <p><Link to="/">← Voltar</Link></p>
      <h2>Perfil</h2>
      {loading ? (
        <p>Carregando…</p>
      ) : (
        <form className="stack card" onSubmit={onSave}>
          <label className="stack">
            <span>Nome de exibição</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como você aparece nas avaliações"
            />
          </label>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
            Email: {user?.email}
          </p>
          <button type="submit" className="primary" disabled={busy || !displayName.trim()}>
            {busy ? 'Salvando…' : 'Salvar'}
          </button>
          {error && <p className="msg-error">{error}</p>}
          {success && <p className="msg-success">{success}</p>}
        </form>
      )}
    </div>
  )
}
