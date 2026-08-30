import { useEffect, useState, type FormEvent } from 'react'
import type { ReviewTopic } from '../lib/db'
import { useTranslation } from '../i18n/context'
import Spinner from './Spinner'

export type ReviewFormValues = {
  scores: Record<string, number>
  notes: string
  photoFile: File | null
  removePhoto: boolean
}

type ReviewDraft = { base: string; scores: Record<string, number>; notes: string }

function readDraft(key: string | null): ReviewDraft | null {
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as ReviewDraft) : null
  } catch {
    return null
  }
}

export default function ReviewForm({
  mode,
  topics,
  initialScores,
  initialNotes = '',
  initialPhotoUrl = null,
  busy = false,
  error = null,
  persistKey = null,
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
  /** When set, notes/scores are persisted to localStorage under this key so an
   *  in-progress review survives navigation and PWA reloads. */
  persistKey?: string | null
  onSubmit: (values: ReviewFormValues) => boolean | void | Promise<boolean | void>
  onCancel?: () => void
}) {
  const { t } = useTranslation()

  const defaultScores = Object.fromEntries(
    topics.map((topic) => [topic.id, initialScores?.[topic.id] ?? 5]),
  )
  // Signature of the saved values this draft is based on. A stored draft is only
  // restored when it matches — otherwise the current saved review is shown (so an
  // edit form always reflects the latest values, not a stale leftover draft).
  const base =
    topics.map((tp) => `${tp.id}:${initialScores?.[tp.id] ?? 5}`).join(',') + '|' + initialNotes

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const d = readDraft(persistKey)
    return d && d.base === base ? { ...defaultScores, ...d.scores } : defaultScores
  })
  const [notes, setNotes] = useState<string>(() => {
    const d = readDraft(persistKey)
    return d && d.base === base ? d.notes : initialNotes
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  // Mirror the in-progress draft to storage so it survives navigation / PWA reloads.
  useEffect(() => {
    if (!persistKey) return
    try {
      window.localStorage.setItem(persistKey, JSON.stringify({ base, scores, notes }))
    } catch {
      // ignore quota / private-mode failures
    }
  }, [persistKey, base, scores, notes])

  const clearDraft = () => {
    if (!persistKey) return
    try {
      window.localStorage.removeItem(persistKey)
    } catch {
      // ignore
    }
  }

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
    if (topics.some((topic) => scores[topic.id] == null)) {
      setLocalError(t('reviewForm.pickForEachTopic'))
      return
    }
    setLocalError(null)
    const result = await onSubmit({ scores, notes, photoFile: photo, removePhoto })
    // Drop the saved draft once the submit succeeds (onSubmit returns false on failure).
    if (result !== false) clearDraft()
  }

  if (topics.length === 0) {
    return (
      <p className="msg-error">
        {t('reviewForm.noTopics')}
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
      {topics.map((topic) => (
        <label key={topic.id} className="row">
          <span style={{ minWidth: 140 }}>{topic.label}:</span>
          <select
            value={scores[topic.id] ?? 5}
            onChange={(e) =>
              setScores((prev) => ({ ...prev, [topic.id]: Number(e.target.value) }))
            }
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      ))}
      <textarea
        placeholder={t('reviewForm.notesPlaceholder')}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <label className="stack" style={{ gap: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {t('reviewForm.photoLabel')}
        </span>
        {showExisting && (
          <img
            src={initialPhotoUrl!}
            alt={t('reviewForm.currentPhotoAlt')}
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
            {t('reviewForm.removeCurrentPhoto')}
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
            alt={t('reviewForm.previewAlt')}
            style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, objectFit: 'cover' }}
          />
        )}
      </label>
      <div className="row">
        <button type="submit" className="primary" disabled={busy}>
          {busy ? (
            <Spinner size="sm" label={t('common.saving')} />
          ) : mode === 'edit' ? (
            t('establishment.saveChanges')
          ) : (
            t('reviewForm.saveReview')
          )}
        </button>
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </button>
        )}
      </div>
      {(error || localError) && <p className="msg-error">{error ?? localError}</p>}
    </form>
  )
}
