import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/context'
import StarBar from '../components/StarBar'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import { categoryEmoji } from '../lib/categoryEmoji'
import { usePersistedState } from '../lib/usePersistedState'
import {
  createEstablishment,
  createTopic,
  deleteEstablishment,
  deleteTopic,
  errorMessage,
  getCategory,
  getCategoryRole,
  listCategoryMembers,
  listEstablishments,
  listTopics,
  renameCategory,
  renameTopic,
  type Category,
  type CategoryMemberWithProfile,
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
  const [members, setMembers] = useState<CategoryMemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName, clearNewName] = usePersistedState(
    id ? `draft.category.${id}.estName` : null,
    '',
  )
  const [newAddress, setNewAddress, clearNewAddress] = usePersistedState(
    id ? `draft.category.${id}.estAddress` : null,
    '',
  )
  const [newInsta, setNewInsta, clearNewInsta] = usePersistedState(
    id ? `draft.category.${id}.estInsta` : null,
    '',
  )
  const [rollResult, setRollResult] = useState<Establishment | null | 'empty'>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [activeMember, setActiveMember] = useState<CategoryMemberWithProfile | null>(null)
  const [showAddEst, setShowAddEst] = useState(false)

  const load = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    try {
      const [cat, est, tps, r, mems] = await Promise.all([
        getCategory(id),
        listEstablishments(id),
        listTopics(id),
        getCategoryRole(id, user.id),
        listCategoryMembers(id),
      ])
      setCategory(cat)
      setRows(est)
      setTopics(tps)
      setRole(r)
      setMembers(mems)
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
      clearNewName()
      clearNewAddress()
      clearNewInsta()
      setShowAddEst(false)
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

  const startEditName = () => {
    setNameDraft(category?.name ?? '')
    setEditingName(true)
  }

  const saveName = async () => {
    if (!id) return
    const next = nameDraft.trim()
    if (!next) {
      setError(t('category.nameEmpty'))
      return
    }
    if (next === category?.name) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    setError(null)
    try {
      const updated = await renameCategory(id, next)
      setCategory(updated)
      setEditingName(false)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSavingName(false)
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
      <div className="cat-detail-head">
        {editingName ? (
          <div className="row" style={{ flex: 1, minWidth: 0 }}>
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              disabled={savingName}
            />
            <button type="button" className="primary" onClick={saveName} disabled={savingName}>
              {savingName ? <Spinner size="sm" label={t('common.saving')} /> : t('common.save')}
            </button>
            <button type="button" className="ghost" onClick={() => setEditingName(false)} disabled={savingName}>
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <>
            <h2 className="row" style={{ minWidth: 0 }}>
              {category && (
                <span aria-hidden style={{ marginRight: 8 }}>{categoryEmoji(category.name)}</span>
              )}
              <span className="cat-card-name">{category ? category.name : t('category.fallbackTitle')}</span>{' '}
              {role && <RoleBadge role={role} />}
              {role === 'owner' && category && (
                <button
                  type="button"
                  className="ghost"
                  onClick={startEditName}
                  aria-label={t('category.editName')}
                  title={t('category.editName')}
                  style={{ fontSize: 14 }}
                >
                  ✏️
                </button>
              )}
            </h2>
            {role === 'owner' && (
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="ghost icon-btn"
                  onClick={onShare}
                  aria-label={t('category.share')}
                  title={copied ? t('category.copied') : t('category.share')}
                >
                  {copied ? '✅' : '🔗'}
                </button>
                <button
                  type="button"
                  className="ghost icon-btn"
                  onClick={() => setShowSettings(true)}
                  aria-label={t('category.manageTopics')}
                  title={t('category.manageTopics')}
                >
                  ⚙️
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {role === 'owner' && copied && (
        <p className="msg-success">
          {t('category.shareWarning')}
        </p>
      )}

      <div className="card stack">
        <div className="action-buttons">
          <button type="button" className="primary" onClick={onRoll} style={{ fontSize: 18 }}>
            {t('category.rollDice')}
          </button>
          <button type="button" onClick={() => setShowAddEst(true)}>
            {t('category.addEstablishment')}
          </button>
        </div>
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

      <div className="member-strip">
        <span className="member-strip-label">{t('category.members', { n: members.length })}</span>
        {loading ? (
          <Spinner size="sm" label={t('common.loading')} />
        ) : members.length === 0 ? (
          <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{t('category.membersEmpty')}</span>
        ) : (
          members.map((m) => (
            <button
              key={m.user_id}
              type="button"
              className={`member-chip${m.role === 'owner' ? ' member-chip--owner' : ''}`}
              onClick={() => setActiveMember(m)}
            >
              <span className="member-chip-avatar" aria-hidden>👤</span>
              <span>
                {m.display_name ?? t('common.user')}
                {user?.id === m.user_id && t('reviewRow.youSuffix')}
              </span>
            </button>
          ))
        )}
      </div>

      {error && <p className="msg-error">{error}</p>}

      <div className="section-head">
        <strong>{t('category.establishments', { n: rows.length })}</strong>
      </div>
      {loading ? (
        <Spinner block label={t('common.loading')} />
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>{t('category.emptyEstablishments')}</p>
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

      {showSettings && role === 'owner' && (
        <Modal onClose={() => setShowSettings(false)}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{t('category.manageTopics')}</h2>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowSettings(false)}
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>
          <ManageTopics topics={topics} categoryId={id!} onChange={load} setError={setError} />
        </Modal>
      )}

      {showAddEst && (
        <Modal onClose={() => setShowAddEst(false)}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{t('category.addEstablishment')}</h2>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowAddEst(false)}
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>
          <form className="stack" onSubmit={onAdd}>
            <input
              autoFocus
              placeholder={t('category.newEstablishmentPlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
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
            <button type="submit" className="primary" disabled={!newName.trim()}>
              {t('common.add')}
            </button>
          </form>
        </Modal>
      )}

      {activeMember && (
        <MemberActivity
          member={activeMember}
          establishments={rows}
          isCurrentUser={user?.id === activeMember.user_id}
          onClose={() => setActiveMember(null)}
        />
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

function MemberActivity({
  member,
  establishments,
  isCurrentUser,
  onClose,
}: {
  member: CategoryMemberWithProfile
  establishments: EstablishmentWithReview[]
  isCurrentUser: boolean
  onClose: () => void
}) {
  const { t, locale } = useTranslation()

  const reviewed = establishments
    .map((est) => {
      const review = (est.reviews ?? []).find((r) => r.user_id === member.user_id)
      if (!review) return null
      const ratings = review.review_ratings ?? []
      const avg =
        ratings.length > 0 ? ratings.reduce((s, x) => s + x.score, 0) / ratings.length : null
      return { est, avg }
    })
    .filter((v): v is { est: EstablishmentWithReview; avg: number | null } => v != null)

  const name = member.display_name ?? t('common.user')
  const joined = new Date(member.joined_at).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Modal onClose={onClose}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="stack" style={{ gap: 4 }}>
            <h2 className="row" style={{ gap: 8 }}>
              <span>
                {name}
                {isCurrentUser && t('reviewRow.youSuffix')}
              </span>
              <span className="role-badge">
                {member.role === 'owner' ? t('dashboard.badgeOwner') : t('dashboard.badgeMember')}
              </span>
            </h2>
            <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
              {t('category.memberJoined', { date: joined })}
            </span>
          </div>
          <button
            type="button"
            className="ghost"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <strong>{t('category.memberReviews', { n: reviewed.length })}</strong>
        {reviewed.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>{t('category.memberNoReviews')}</p>
        ) : (
          <ul className="stack" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {reviewed.map(({ est, avg }) => (
              <li key={est.id} className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
                <Link
                  to={`/establishment/${est.id}`}
                  className="est-row-name"
                  onClick={onClose}
                >
                  {est.name}
                </Link>
                <span className="row" style={{ gap: 8 }}>
                  {avg != null ? (
                    <>
                      <StarBar value={avg} max={10} />
                      <span style={{ fontWeight: 600 }}>{avg.toFixed(2)}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--ink-soft)' }}>—</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
    </Modal>
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
