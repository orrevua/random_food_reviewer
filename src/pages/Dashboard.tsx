import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  createCategory,
  deleteCategory,
  errorMessage,
  joinCategory,
  listCategories,
  type CategoryWithRole,
} from '../lib/db'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryWithRole[]>([])
  const [name, setName] = useState('')
  const [inviteId, setInviteId] = useState('')
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
      setName('')
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
      navigate(`/category/${inviteId.trim()}`)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const onDelete = async (c: CategoryWithRole) => {
    if (!confirm(`Excluir categoria "${c.name}"? Isso apagará estabelecimentos e avaliações.`)) return
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
        <h2>Minhas categorias</h2>
        <form className="row" onSubmit={onAdd}>
          <input
            placeholder="Nova categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="primary">Adicionar</button>
        </form>
        {loading ? (
          <p>Carregando…</p>
        ) : owned.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>Nenhuma categoria criada.</p>
        ) : (
          <div className="stack">
            {owned.map((c) => (
              <div key={c.id} className="cat-card cat-card--owned">
                <Link to={`/category/${c.id}`}>{c.name}</Link>
                <div className="card-actions">
                  <span className="role-badge">dono</span>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => onDelete(c)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stack">
        <h2>Categorias compartilhadas comigo</h2>
        <form className="row" onSubmit={onJoin}>
          <input
            placeholder="Cole o UUID de convite"
            value={inviteId}
            onChange={(e) => setInviteId(e.target.value)}
          />
          <button type="submit">Entrar</button>
        </form>
        {loading ? null : joined.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>Nenhuma categoria compartilhada.</p>
        ) : (
          <div className="stack">
            {joined.map((c) => (
              <div key={c.id} className="cat-card cat-card--joined">
                <Link to={`/category/${c.id}`}>{c.name}</Link>
                <span className="role-badge">convidado</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
