import { useEffect, useState, type FormEvent } from 'react'
import type { ReviewTopic } from '../lib/db'

export type ReviewFormValues = {
  scores: Record<string, number>
  notes: string
  photoFile: File | null
  removePhoto: boolean
}

export default function ReviewForm({
  mode,
  topics,
  initialScores,
  initialNotes = '',
  initialPhotoUrl = null,
  busy = false,
  error = null,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  topics: ReviewTopic[]
  initialScores?: Record<string, number>
  initialNotes?: string
  initialPhotoUrl?: string | null
  busy?: boolean
  error?: string | null
  onSubmit: (values: ReviewFormValues) => void | Promise<void>
  onCancel?: () => void
}) {
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(topics.map((t) => [t.id, initialScores?.[t.id] ?? 5])),
  )
  const [notes, setNotes] = useState(initialNotes)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const onPickPhoto = (file: File | null) => {
    setPhoto(file)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
    if (file) setRemovePhoto(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (topics.some((t) => scores[t.id] == null)) {
      setLocalError('Escolha uma nota para cada tópico.')
      return
    }
    setLocalError(null)
    await onSubmit({ scores, notes, photoFile: photo, removePhoto })
  }

  if (topics.length === 0) {
    return (
      <p className="msg-error">
        Nenhum tópico configurado — peça ao dono da categoria para adicionar tópicos.
      </p>
    )
  }

  const showExisting = mode === 'edit' && initialPhotoUrl && !photo && !removePhoto

  return (
    <form
      className="stack"
      onSubmit={submit}
      style={{ padding: 8, borderLeft: '3px solid var(--border)', marginLeft: 8 }}
    >
      {topics.map((t) => (
        <label key={t.id} className="row">
          <span style={{ minWidth: 140 }}>{t.label}:</span>
          <select
            value={scores[t.id] ?? 5}
            onChange={(e) =>
              setScores((prev) => ({ ...prev, [t.id]: Number(e.target.value) }))
            }
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      ))}
      <textarea
        placeholder="Notas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <label className="stack" style={{ gap: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          Foto da comida (opcional)
        </span>
        {showExisting && (
          <img
            src={initialPhotoUrl!}
            alt="Foto atual"
            style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, objectFit: 'cover' }}
          />
        )}
        {mode === 'edit' && initialPhotoUrl && !photo && (
          <label className="row" style={{ gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={removePhoto}
              onChange={(e) => setRemovePhoto(e.target.checked)}
            />
            Remover foto atual
          </label>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
        />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Prévia"
            style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, objectFit: 'cover' }}
          />
        )}
      </label>
      <div className="row">
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Salvando…' : mode === 'edit' ? 'Salvar alterações' : 'Salvar avaliação'}
        </button>
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
        )}
      </div>
      {(error || localError) && <p className="msg-error">{error ?? localError}</p>}
    </form>
  )
}
