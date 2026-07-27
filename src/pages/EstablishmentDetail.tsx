import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTranslation } from '../i18n/context'
import LocationPreview from '../components/LocationPreview'
import ReviewRow from '../components/ReviewRow'
import {
  deleteEstablishment,
  errorMessage,
  getCategoryRole,
  getEstablishment,
  getProfile,
  listTopics,
  updateEstablishment,
  type EstablishmentWithReview,
  type Profile,
  type ReviewTopic,
} from '../lib/db'

export default function EstablishmentDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()
  const [est, setEst] = useState<EstablishmentWithReview | null>(null)
  const [adderProfile, setAdderProfile] = useState<Profile | null>(null)
  const [topics, setTopics] = useState<ReviewTopic[]>([])
  const [role, setRole] = useState<'owner' | 'member' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const editing = search.get('edit') === '1'

  const load = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    try {
      const e = await getEstablishment(id)
      setEst(e)
      if (e) {
        const [tps, r, prof] = await Promise.all([
          listTopics(e.category_id),
          getCategoryRole(e.category_id, user.id),
          getProfile(e.user_id),
        ])
        setTopics(tps)
        setRole(r)
        setAdderProfile(prof)
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

  const topicsById = useMemo(() => {
    const m = new Map<string, ReviewTopic>()
    topics.forEach((t) => m.set(t.id, t))
    return m
  }, [topics])

  const sortedReviews = useMemo(() => {
    if (!est) return []
    const list = [...(est.reviews ?? [])]
    list.sort((a, b) => {
      if (a.user_id === user?.id && b.user_id !== user?.id) return -1
      if (b.user_id === user?.id && a.user_id !== user?.id) return 1
      return b.created_at.localeCompare(a.created_at)
    })
    return list
  }, [est, user])

  const myReview = useMemo(
    () => (est?.reviews ?? []).find((r) => r.user_id === user?.id) ?? null,
    [est, user],
  )

  const canEdit = !!user && !!est && (est.user_id === user.id || role === 'owner')

  const onDelete = async () => {
    if (!est) return
    if (!confirm(t('category.confirmDeleteEstablishment', { name: est.name }))) return
    try {
      await deleteEstablishment(est.id)
      navigate(`/category/${est.category_id}`)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const toggleEdit = () => {
    const next = new URLSearchParams(search)
    if (editing) next.delete('edit')
    else next.set('edit', '1')
    setSearch(next, { replace: true })
  }

  if (loading) return <p>{t('common.loading')}</p>
  if (!est)
    return (
      <div className="stack">
        <p><Link to="/">{t('common.back')}</Link></p>
        <p>{t('establishment.notFound')}</p>
      </div>
    )

  const addedAt = new Date(est.created_at).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')

  return (
    <div className="stack">
      <p><Link to={`/category/${est.category_id}`}>{t('common.back')}</Link></p>
      <div className="est-detail-header card stack">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1>{est.name}</h1>
          <div className="card-actions">
            {canEdit && (
              <button type="button" onClick={toggleEdit}>
                {editing ? t('common.close') : t('establishment.editInfo')}
              </button>
            )}
            {canEdit && (
              <button type="button" className="danger-btn" onClick={onDelete}>
                {t('common.delete')}
              </button>
            )}
          </div>
        </div>
        {(est.address || est.instagram_handle) && (
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            {est.address && <LocationPreview address={est.address} />}
            {est.instagram_handle && (
              <a
                href={`https://instagram.com/${est.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'none' }}
              >
                @{est.instagram_handle}
              </a>
            )}
          </div>
        )}
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
          {t('establishment.addedBy', { name: adderProfile?.display_name ?? t('common.user'), date: addedAt })}
        </p>
        {editing && canEdit && (
          <EditInfoForm
            est={est}
            onSaved={async () => {
              const next = new URLSearchParams(search)
              next.delete('edit')
              setSearch(next, { replace: true })
              await load()
            }}
            onError={setError}
          />
        )}
      </div>

      {error && <p className="msg-error">{error}</p>}

      {sortedReviews.length === 0 ? (
        <div className="card stack">
          <p>{t('establishment.noReviewsYet')}</p>
          <Link to={`/establishment/${est.id}/review`}>
            <button type="button" className="primary">{t('category.reviewOne')}</button>
          </Link>
        </div>
      ) : (
        <div className="stack">
          {!myReview && (
            <Link to={`/establishment/${est.id}/review`}>
              <button type="button" className="primary">{t('category.reviewOne')}</button>
            </Link>
          )}
          {sortedReviews.map((rev) => {
            const isMine = rev.user_id === user?.id
            return (
              <div key={rev.id} className="card stack">
                <ReviewRow review={rev} topicsById={topicsById} isMine={isMine} />
                {isMine && (
                  <div className="review-actions">
                    <Link to={`/establishment/${est.id}/review`}>
                      {t('establishment.editMyReview')}
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EditInfoForm({
  est,
  onSaved,
  onError,
}: {
  est: EstablishmentWithReview
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(est.name)
  const [address, setAddress] = useState(est.address ?? '')
  const [insta, setInsta] = useState(est.instagram_handle ?? '')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await updateEstablishment(est.id, {
        name: name.trim(),
        address: address.trim() ? address.trim() : null,
        instagram_handle: insta.trim() ? insta.trim().replace(/^@/, '') : null,
      })
      await onSaved()
    } catch (err) {
      onError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="stack"
      onSubmit={submit}
      style={{ padding: 8, borderLeft: '3px solid var(--border)', marginLeft: 8 }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('establishment.namePlaceholder')} />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={t('category.addressPlaceholder')}
      />
      <input
        value={insta}
        onChange={(e) => setInsta(e.target.value)}
        placeholder={t('category.instagramPlaceholder')}
      />
      <button type="submit" className="primary" disabled={busy}>
        {busy ? t('common.saving') : t('common.save')}
      </button>
    </form>
  )
}
