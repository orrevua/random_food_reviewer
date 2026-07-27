import StarBar from './StarBar'
import type { ReviewRating, ReviewTopic, Review } from '../lib/db'
import { useTranslation } from '../i18n/context'

export default function ReviewRow({
  review,
  topicsById,
  isMine,
}: {
  review: Review & { review_ratings?: ReviewRating[] }
  topicsById: Map<string, ReviewTopic>
  isMine: boolean
}) {
  const { t } = useTranslation()
  const ratings: ReviewRating[] = review.review_ratings ?? []
  const avgNum =
    ratings.length > 0 ? ratings.reduce((s, x) => s + x.score, 0) / ratings.length : null
  const avgLabel = avgNum == null ? '—' : avgNum.toFixed(2)
  const sorted = [...ratings].sort((a, b) => {
    const pa = topicsById.get(a.topic_id)?.position ?? 999
    const pb = topicsById.get(b.topic_id)?.position ?? 999
    return pa - pb
  })
  const name = review.profile?.display_name ?? (isMine ? t('reviewRow.you') : t('common.user'))

  return (
    <div className="review-row">
      <div className="review-head">
        <span className="reviewer-name">{name}{isMine ? t('reviewRow.youSuffix') : ''}</span>
        <div className="row" style={{ gap: 10 }}>
          {avgNum != null && <StarBar value={avgNum} max={10} />}
          <span style={{ fontWeight: 600 }}>{avgLabel}</span>
        </div>
      </div>
      {sorted.length > 0 && (
        <ul className="review-topics">
          {sorted.map((rr) => {
            const topic = topicsById.get(rr.topic_id)
            return (
              <li key={rr.topic_id}>
                {topic?.label ?? t('reviewRow.topicRemoved')}: {rr.score}/10
              </li>
            )
          })}
        </ul>
      )}
      {review.notes && <p style={{ color: 'var(--ink-soft)' }}>{review.notes}</p>}
      {review.photo_url && (
        <a href={review.photo_url} target="_blank" rel="noopener noreferrer">
          <img
            src={review.photo_url}
            alt={t('reviewRow.photoAlt')}
            style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, objectFit: 'cover' }}
          />
        </a>
      )}
    </div>
  )
}
