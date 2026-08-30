import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/context'
import {
  createCategory,
  deleteCategory,
  errorMessage,
  joinCategory,
  listCategories,
  type CategoryWithRole,
} from '../lib/db'
import { categoryEmoji } from '../lib/categoryEmoji'
import { usePersistedState } from '../lib/usePersistedState'
import Spinner from '../components/Spinner'

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryWithRole[]>([])
  const [name, setName, clearName] = usePersistedState('draft.dashboard.newCategory', '')
  const [inviteId, setInviteId, clearInvite] = usePersistedState('draft.dashboard.invite', '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listCategories(user.id)
      .then(setCategories)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [user])

  const onAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setError(null)
    try {
      const c = await createCategory(user.id, name.trim())
      setCategories((prev) => [{ ...c, role: 'owner' }, ...prev])
      clearName()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const onJoin = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !inviteId.trim()) return
    setError(null)
    try {
      await joinCategory(inviteId.trim(), user.id)
      clearInvite()
      navigate(`/category/${inviteId.trim()}`)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const onDelete = async (c: CategoryWithRole) => {
    if (!confirm(t('dashboard.confirmDeleteCategory', { name: c.name }))) return
    setError(null)
    try {
      await deleteCategory(c.id)
      setCategories((prev) => prev.filter((x) => x.id !== c.id))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const owned = categories.filter((c) => c.role === 'owner')
  const joined = categories.filter((c) => c.role === 'member')

  return (
    <div className="stack-lg">
      {error && <p className="msg-error">{error}</p>}

      <section className="stack">
        <h2>{t('dashboard.myCategories')}</h2>
        <form className="row" onSubmit={onAdd}>
          <input
            placeholder={t('dashboard.newCategoryPlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="primary">{t('common.add')}</button>
        </form>
        {loading ? (
          <Spinner block label={t('common.loading')} />
        ) : owned.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>{t('dashboard.emptyOwned')}</p>
        ) : (
          <div className="stack">
            {owned.map((c) => (
              <div key={c.id} className="cat-card cat-card--owned">
                <Link to={`/category/${c.id}`} className="cat-card-main">
                  <span className="cat-emoji" aria-hidden>{categoryEmoji(c.name)}</span>
                  <span className="cat-card-name">{c.name}</span>
                </Link>
                <div className="card-actions">
                  <span className="role-badge">{t('dashboard.badgeOwner')}</span>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => onDelete(c)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stack">
        <h2>{t('dashboard.sharedCategories')}</h2>
        <form className="row" onSubmit={onJoin}>
          <input
            placeholder={t('dashboard.invitePlaceholder')}
            value={inviteId}
            onChange={(e) => setInviteId(e.target.value)}
          />
          <button type="submit">{t('dashboard.join')}</button>
        </form>
        {loading ? (
          <Spinner block label={t('common.loading')} />
        ) : joined.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>{t('dashboard.emptyJoined')}</p>
        ) : (
          <div className="stack">
            {joined.map((c) => (
              <div key={c.id} className="cat-card cat-card--joined">
                <Link to={`/category/${c.id}`} className="cat-card-main">
                  <span className="cat-emoji" aria-hidden>{categoryEmoji(c.name)}</span>
                  <span className="cat-card-name">{c.name}</span>
                </Link>
                <span className="role-badge">{t('dashboard.badgeMember')}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
