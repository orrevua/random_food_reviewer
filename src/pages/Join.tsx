import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { errorMessage, joinCategory } from '../lib/db'

export default function Join() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !id) return
    let cancelled = false
    joinCategory(id, user.id)
      .then(() => {
        if (!cancelled) navigate(`/category/${id}`, { replace: true })
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [id, user, navigate])

  return (
    <div className="stack">
      <h2>Entrar na categoria…</h2>
      {error ? <p className="msg-error">{error}</p> : <p>Processando convite…</p>}
    </div>
  )
}
