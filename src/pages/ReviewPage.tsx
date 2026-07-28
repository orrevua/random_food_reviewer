import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/context'
import ReviewForm, { type ReviewFormValues } from '../components/ReviewForm'
import Spinner from '../components/Spinner'
import {
  createReview,
  errorMessage,
  getEstablishment,
  getMyReview,
  listTopics,
  updateReview,
  type EstablishmentWithReview,
  type Review,
  type ReviewRating,
  type ReviewTopic,
} from '../lib/db'

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [est, setEst] = useState<EstablishmentWithReview | null>(null)
  const [topics, setTopics] = useState<ReviewTopic[]>([])
  const [existing, setExisting] = useState<(Review & { review_ratings: ReviewRating[] }) | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    try {
      const e = await getEstablishment(id)
      setEst(e)
      if (e) {
        const [tps, mine] = await Promise.all([
          listTopics(e.category_id),
          getMyReview(user.id, e.id),
        ])
        setTopics(tps)
        setExisting(mine)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    load()
  }, [load])

  const onSubmit = async (values: ReviewFormValues) => {
    if (!user || !est) return
    setBusy(true)
    setError(null)
    try {
      const scoreList = topics.map((t) => ({
        topicId: t.id,
        score: values.scores[t.id],
      }))
      if (existing) {
        await updateReview(
          existing.id,
          user.id,
          values.notes,
          scoreList,
          values.photoFile,
          values.removePhoto,
          existing.photo_url,
        )
      } else {
        await createReview(user.id, est.id, values.notes, scoreList, values.photoFile)
      }
      navigate(`/establishment/${est.id}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner block label={t('common.loading')} />
  if (!est)
    return (
      <div className="stack">
        <p><Link to="/">{t('common.back')}</Link></p>
        <p>{t('establishment.notFound')}</p>
      </div>
    )

  const mode: 'create' | 'edit' = existing ? 'edit' : 'create'
  const initialScores = existing
    ? Object.fromEntries(existing.review_ratings.map((r) => [r.topic_id, r.score]))
    : undefined

  return (
    <div className="stack">
      <p><Link to={`/establishment/${est.id}`}>{t('common.back')}</Link></p>
      <h2>
        {mode === 'edit' ? t('review.editTitle', { name: est.name }) : t('review.createTitle', { name: est.name })}
      </h2>
      <ReviewForm
        mode={mode}
        topics={topics}
        initialScores={initialScores}
        initialNotes={existing?.notes ?? ''}
        initialPhotoUrl={existing?.photo_url ?? null}
        busy={busy}
        error={error}
        onSubmit={onSubmit}
        onCancel={() => navigate(`/establishment/${est.id}`)}
      />
    </div>
  )
}
