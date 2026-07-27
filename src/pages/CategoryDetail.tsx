import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/context'
import StarBar from '../components/StarBar'
import {
  createEstablishment,
  createTopic,
  deleteEstablishment,
  deleteTopic,
  errorMessage,
  getCategory,
  getCategoryRole,
  listEstablishments,
  listTopics,
  renameTopic,
  type Category,
  type Establishment,
  type EstablishmentWithReview,
  type ReviewTopic,
} from '../lib/db'

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [category, setCategory] = useState<Category | null>(null)
  const [role, setRole] = useState<'owner' | 'member' | null>(null)
  const [rows, setRows] = useState<EstablishmentWithReview[]>([])
  const [topics, setTopics] = useState<ReviewTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newInsta, setNewInsta] = useState('')
  const [rollResult, setRollResult] = useState<Establishment | null | 'empty'>(null)
  const [showManage, setShowManage] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    try {
      const [cat, est, tps, r] = await Promise.all([
        getCategory(id),
        listEstablishments(id),
        listTopics(id),
        getCategoryRole(id, user.id),
      ])
      setCategory(cat)
      setRows(est)
      setTopics(tps)
      setRole(r)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    load()
  }, [load])

  const onAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !id || !newName.trim()) return
    try {
      await createEstablishment(
        user.id,
        id,
        newName.trim(),
        newAddress.trim() ? newAddress.trim() : null,
        newInsta.trim() ? newInsta.trim().replace(/^@/, '') : null,
      )
      setNewName('')
      setNewAddress('')
      setNewInsta('')
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const onRoll = async () => {
    if (!id || !user) return
    setRollResult(null)
    try {
      const pick = await pickRandomUnreviewedForUser(id, user.id)
      setRollResult(pick ?? 'empty')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const onShare = async () => {
    if (!id) return
    const url = `${window.location.origin}/join/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const onDeleteEstablishment = async (e: Establishment) => {
    if (!confirm(t('category.confirmDeleteEstablishment', { name: e.name }))) return
    try {
      await deleteEstablishment(e.id)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="stack">
      <p><Link to="/">{t('common.back')}</Link></p>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>
          {category ? category.name : t('category.fallbackTitle')}{' '}
          {role && <RoleBadge role={role} />}
        </h2>
        {role === 'owner' && (
          <button type="button" onClick={onShare}>
            {copied ? t('category.copied') : t('category.share')}
          </button>
        )}
      </div>
      {role === 'owner' && copied && (
        <p className="msg-success">
          {t('category.shareWarning')}
        </p>
      )}

      {role === 'owner' && (
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{t('category.manageTopics')}</strong>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowManage((v) => !v)}
            >
              {showManage ? t('common.close') : t('common.open')}
            </button>
          </div>
          {showManage && (
            <ManageTopics
              topics={topics}
              categoryId={id!}
              onChange={load}
              setError={setError}
            />
          )}
        </div>
      )}

      <div className="card stack">
        <button type="button" className="primary" onClick={onRoll} style={{ fontSize: 20 }}>
          {t('category.rollDice')}
        </button>
        {rollResult === 'empty' && <p>{t('category.allReviewed')}</p>}
        {rollResult && rollResult !== 'empty' && (
          <p>
            {t('category.goTo')}
            <Link to={`/establishment/${rollResult.id}`}>
              <strong>{rollResult.name}</strong>
            </Link>
          </p>
        )}
      </div>

      <form className="stack" onSubmit={onAdd}>
        <div className="row">
          <input
            placeholder={t('category.newEstablishmentPlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit">{t('common.add')}</button>
        </div>
        <input
          placeholder={t('category.addressPlaceholder')}
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <input
          placeholder={t('category.instagramPlaceholder')}
          value={newInsta}
          onChange={(e) => setNewInsta(e.target.value)}
        />
      </form>

      {error && <p className="msg-error">{error}</p>}
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p>{t('category.emptyEstablishments')}</p>
      ) : (
        <div className="stack">
          {rows.map((r) => (
            <EstablishmentRow
              key={r.id}
              est={r}
              currentUserId={user?.id ?? null}
              role={role}
              onDelete={() => onDeleteEstablishment(r)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Client-side dice pool: establishments in this category not reviewed by the current user.
async function pickRandomUnreviewedForUser(
  categoryId: string,
  userId: string,
): Promise<Establishment | null> {
  const rows = await listEstablishments(categoryId)
  const pool = rows.filter((r) => !(r.reviews ?? []).some((rev) => rev.user_id === userId))
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

function EstablishmentRow({
  est,
  currentUserId,
  role,
  onDelete,
}: {
  est: EstablishmentWithReview
  currentUserId: string | null
  role: 'owner' | 'member' | null
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const canDelete =
    !!currentUserId && (currentUserId === est.user_id || role === 'owner')
  const reviews = est.reviews ?? []
  const hasMyReview = !!currentUserId && reviews.some((r) => r.user_id === currentUserId)

  const perReviewAvgs = reviews
    .map((r) => {
      const rs = r.review_ratings ?? []
      if (rs.length === 0) return null
      return rs.reduce((s, x) => s + x.score, 0) / rs.length
    })
    .filter((v): v is number => v != null)
  const overallAvg =
    perReviewAvgs.length > 0
      ? perReviewAvgs.reduce((s, x) => s + x, 0) / perReviewAvgs.length
      : null

  return (
    <div className="est-row">
      <div className="est-row-main">
        <Link to={`/establishment/${est.id}`} className="est-row-name">
          {est.name}
        </Link>
        <div className="est-row-meta">
          <span style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
            {t('category.reviewsCount', { n: reviews.length })}
          </span>
          {overallAvg != null ? (
            <>
              <StarBar value={overallAvg} max={10} />
              <span style={{ fontWeight: 600 }}>{overallAvg.toFixed(2)}</span>
            </>
          ) : (
            <span style={{ color: 'var(--ink-soft)' }}>—</span>
          )}
        </div>
      </div>
      <div className="card-actions">
        <Link to={`/establishment/${est.id}/review`}>
          <button type="button">
            {hasMyReview ? t('category.editReview') : t('category.reviewOne')}
          </button>
        </Link>
        {canDelete && (
          <button type="button" className="danger-btn" onClick={onDelete}>
            {t('common.delete')}
          </button>
        )}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: 'owner' | 'member' }) {
  const { t } = useTranslation()
  return (
    <span className="role-badge" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
      {role === 'owner' ? t('dashboard.badgeOwner') : t('dashboard.badgeMember')}
    </span>
  )
}

function ManageTopics({
  topics,
  categoryId,
  onChange,
  setError,
}: {
  topics: ReviewTopic[]
  categoryId: string
  onChange: () => Promise<void>
  setError: (v: string | null) => void
}) {
  const { t } = useTranslation()
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const onAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    try {
      await createTopic(categoryId, newLabel.trim())
      setNewLabel('')
      await onChange()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const startEdit = (t: ReviewTopic) => {
    setEditingId(t.id)
    setEditLabel(t.label)
  }

  const saveEdit = async () => {
    if (!editingId || !editLabel.trim()) {
      setEditingId(null)
      return
    }
    try {
      await renameTopic(editingId, editLabel.trim())
      setEditingId(null)
      await onChange()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const onDelete = async (id: string) => {
    if (!confirm(t('category.topics.confirmDelete'))) return
    try {
      await deleteTopic(id)
      await onChange()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="stack">
      {topics.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>{t('category.topics.empty')}</p>
      ) : (
        <ul className="stack">
          {topics.map((topic) => (
            <li key={topic.id} className="row" style={{ justifyContent: 'space-between' }}>
              {editingId === topic.id ? (
                <input
                  autoFocus
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
              ) : (
                <>
                  <span onDoubleClick={() => startEdit(topic)}>{topic.label}</span>
                  <div className="row">
                    <button type="button" className="ghost" onClick={() => startEdit(topic)}>
                      {t('common.rename')}
                    </button>
                    <button type="button" className="ghost" onClick={() => onDelete(topic.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form className="row" onSubmit={onAdd}>
        <input
          placeholder={t('category.topics.newPlaceholder')}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button type="submit">{t('category.topics.add')}</button>
      </form>
    </div>
  )
}
