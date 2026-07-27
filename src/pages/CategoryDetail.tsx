import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
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
    if (!confirm(`Excluir estabelecimento "${e.name}"?`)) return
    try {
      await deleteEstablishment(e.id)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="stack">
      <p><Link to="/">← Voltar</Link></p>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>
          {category ? category.name : 'Categoria'}{' '}
          {role && <RoleBadge role={role} />}
        </h2>
        {role === 'owner' && (
          <button type="button" onClick={onShare}>
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>
        )}
      </div>
      {role === 'owner' && copied && (
        <p className="msg-success">
          Link copiado. Qualquer pessoa com este link pode ver e adicionar à categoria.
        </p>
      )}

      {role === 'owner' && (
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Gerenciar tópicos</strong>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowManage((v) => !v)}
            >
              {showManage ? 'Fechar' : 'Abrir'}
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
          🎲 Rolar dado
        </button>
        {rollResult === 'empty' && <p>Todos avaliados — adicione mais!</p>}
        {rollResult && rollResult !== 'empty' && (
          <p>
            Vai em:{' '}
            <Link to={`/establishment/${rollResult.id}`}>
              <strong>{rollResult.name}</strong>
            </Link>
          </p>
        )}
      </div>

      <form className="stack" onSubmit={onAdd}>
        <div className="row">
          <input
            placeholder="Novo estabelecimento"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit">Adicionar</button>
        </div>
        <input
          placeholder="Endereço (opcional)"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <input
          placeholder="Instagram @ (opcional)"
          value={newInsta}
          onChange={(e) => setNewInsta(e.target.value)}
        />
      </form>

      {error && <p className="msg-error">{error}</p>}
      {loading ? (
        <p>Carregando…</p>
      ) : rows.length === 0 ? (
        <p>Nenhum estabelecimento ainda.</p>
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
            {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
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
            {hasMyReview ? 'Editar avaliação' : 'Avaliar'}
          </button>
        </Link>
        {canDelete && (
          <button type="button" className="danger-btn" onClick={onDelete}>
            Excluir
          </button>
        )}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: 'owner' | 'member' }) {
  return (
    <span className="role-badge" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
      {role === 'owner' ? 'dono' : 'convidado'}
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
    if (!confirm('Excluir este tópico? Isso apaga as notas históricas dele.')) return
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
        <p style={{ color: 'var(--ink-soft)' }}>Sem tópicos ainda.</p>
      ) : (
        <ul className="stack">
          {topics.map((t) => (
            <li key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
              {editingId === t.id ? (
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
                  <span onDoubleClick={() => startEdit(t)}>{t.label}</span>
                  <div className="row">
                    <button type="button" className="ghost" onClick={() => startEdit(t)}>
                      Renomear
                    </button>
                    <button type="button" className="ghost" onClick={() => onDelete(t.id)}>
                      Excluir
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
          placeholder="Novo tópico"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button type="submit">Adicionar tópico</button>
      </form>
    </div>
  )
}
