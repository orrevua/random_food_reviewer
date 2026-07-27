import { supabase } from './supabase'

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const e = err as { message?: string; error_description?: string; details?: string; hint?: string; code?: string }
    return e.message ?? e.error_description ?? e.details ?? e.hint ?? e.code ?? JSON.stringify(err)
  }
  return String(err)
}

export type Category = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type CategoryMember = {
  category_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export type CategoryWithRole = Category & { role: 'owner' | 'member' }

export type ReviewTopic = {
  id: string
  category_id: string
  label: string
  position: number
  created_at: string
}

export type ReviewRating = {
  review_id: string
  topic_id: string
  score: number
}

export type Profile = {
  user_id: string
  display_name: string
  created_at: string
}

export type Review = {
  id: string
  user_id: string
  establishment_id: string
  notes: string | null
  photo_url: string | null
  created_at: string
  review_ratings?: ReviewRating[]
  profile?: Pick<Profile, 'user_id' | 'display_name'> | null
}

export type Establishment = {
  id: string
  user_id: string
  category_id: string
  name: string
  address: string | null
  instagram_handle: string | null
  created_at: string
}

export type EstablishmentWithReview = Establishment & {
  reviews: (Review & {
    review_ratings: ReviewRating[]
    profile?: Pick<Profile, 'user_id' | 'display_name'> | null
  })[]
}

const DEFAULT_TOPICS = [
  'Tempo de espera',
  'Aparência',
  'Cheiro',
  'Temperatura',
  'Custo-benefício',
  'Molhos',
]

export async function listCategories(userId: string): Promise<CategoryWithRole[]> {
  const { data, error } = await supabase
    .from('category_members')
    .select('role, joined_at, categories(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as unknown as Array<{
    role: 'owner' | 'member'
    joined_at: string
    categories: Category | null
  }>
  return rows
    .filter((r) => r.categories !== null)
    .map((r) => ({ ...(r.categories as Category), role: r.role }))
}

export async function createCategory(userId: string, name: string): Promise<Category> {
  const { data: cat, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name })
    .select()
    .single()
  if (error) throw error

  try {
    const { error: memErr } = await supabase
      .from('category_members')
      .insert({ category_id: cat.id, user_id: userId, role: 'owner' })
    if (memErr) throw memErr

    await seedDefaultTopics(cat.id)
  } catch (err) {
    await supabase.from('categories').delete().eq('id', cat.id)
    throw err
  }
  return cat
}

export async function joinCategory(categoryId: string, userId: string): Promise<CategoryMember> {
  const { data: sessionData } = await supabase.auth.getSession()
  const jwtSub = sessionData.session?.user.id
  if (jwtSub && jwtSub !== userId) {
    throw new Error(`Session mismatch: JWT user is ${jwtSub}, tried to insert ${userId}`)
  }
  const { data, error } = await supabase
    .from('category_members')
    .insert({ category_id: categoryId, user_id: userId, role: 'member' })
    .select()
    .single()
  if (error) {
    // duplicate PK -> already a member; fetch existing row.
    const { data: existing, error: fetchErr } = await supabase
      .from('category_members')
      .select('*')
      .eq('category_id', categoryId)
      .eq('user_id', userId)
      .maybeSingle()
    if (fetchErr) throw fetchErr
    if (existing) return existing as CategoryMember
    throw error
  }
  return data as CategoryMember
}

export async function getCategoryRole(
  categoryId: string,
  userId: string,
): Promise<'owner' | 'member' | null> {
  const { data, error } = await supabase
    .from('category_members')
    .select('role')
    .eq('category_id', categoryId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.role as 'owner' | 'member' | undefined) ?? null
}

export async function getCategory(id: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function listTopics(categoryId: string): Promise<ReviewTopic[]> {
  const { data, error } = await supabase
    .from('review_topics')
    .select('*')
    .eq('category_id', categoryId)
    .order('position', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createTopic(categoryId: string, label: string): Promise<ReviewTopic> {
  const existing = await listTopics(categoryId)
  const nextPos = existing.length ? Math.max(...existing.map((t) => t.position)) + 1 : 0
  const { data, error } = await supabase
    .from('review_topics')
    .insert({ category_id: categoryId, label, position: nextPos })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renameTopic(id: string, label: string): Promise<ReviewTopic> {
  const { data, error } = await supabase
    .from('review_topics')
    .update({ label })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await supabase.from('review_topics').delete().eq('id', id)
  if (error) throw error
}

export async function seedDefaultTopics(categoryId: string): Promise<ReviewTopic[]> {
  const rows = DEFAULT_TOPICS.map((label, position) => ({
    category_id: categoryId,
    label,
    position,
  }))
  const { data, error } = await supabase.from('review_topics').insert(rows).select()
  if (error) throw error
  return data ?? []
}

export async function listEstablishments(categoryId: string): Promise<EstablishmentWithReview[]> {
  // Reviewer profile is fetched separately because there is no FK from `reviews.user_id`
  // to `profiles.user_id` (both reference `auth.users`), so PostgREST cannot resolve an
  // embed hint. We batch-fetch profiles by distinct reviewer id and stitch client-side.
  const { data, error } = await supabase
    .from('establishments')
    .select('*, reviews(*, review_ratings(*))')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as EstablishmentWithReview[]

  const reviewerIds = new Set<string>()
  for (const est of rows) {
    for (const rev of est.reviews ?? []) reviewerIds.add(rev.user_id)
  }
  if (reviewerIds.size > 0) {
    const profiles = await listProfiles(Array.from(reviewerIds))
    const byId = new Map(profiles.map((p) => [p.user_id, p]))
    for (const est of rows) {
      for (const rev of est.reviews ?? []) {
        const p = byId.get(rev.user_id)
        rev.profile = p ? { user_id: p.user_id, display_name: p.display_name } : null
      }
    }
  }
  return rows
}

export async function createEstablishment(
  userId: string,
  categoryId: string,
  name: string,
  address: string | null = null,
  instagramHandle: string | null = null,
): Promise<Establishment> {
  const { data, error } = await supabase
    .from('establishments')
    .insert({
      user_id: userId,
      category_id: categoryId,
      name,
      address,
      instagram_handle: instagramHandle,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEstablishment(id: string): Promise<void> {
  const { error } = await supabase.from('establishments').delete().eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertProfile(userId: string, displayName: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, display_name: displayName }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function ensureProfile(user: { id: string; email?: string | null }): Promise<Profile> {
  const existing = await getProfile(user.id)
  if (existing) return existing
  const fallback = (user.email ?? '').split('@')[0] || 'Usuário'
  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: user.id, display_name: fallback })
    .select()
    .single()
  if (error) {
    // Concurrent-tab race: another insert won → refetch.
    const refetched = await getProfile(user.id)
    if (refetched) return refetched
    throw error
  }
  return data
}

export async function listProfiles(userIds: string[]): Promise<Profile[]> {
  if (userIds.length === 0) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds)
  if (error) throw error
  return data ?? []
}

export async function getEstablishment(id: string): Promise<EstablishmentWithReview | null> {
  const { data, error } = await supabase
    .from('establishments')
    .select('*, reviews(*, review_ratings(*))')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as EstablishmentWithReview
  const reviewerIds = new Set<string>()
  for (const rev of row.reviews ?? []) reviewerIds.add(rev.user_id)
  reviewerIds.add(row.user_id)
  const profiles = await listProfiles(Array.from(reviewerIds))
  const byId = new Map(profiles.map((p) => [p.user_id, p]))
  for (const rev of row.reviews ?? []) {
    const p = byId.get(rev.user_id)
    rev.profile = p ? { user_id: p.user_id, display_name: p.display_name } : null
  }
  return row
}

export async function updateEstablishment(
  id: string,
  patch: { name?: string; address?: string | null; instagram_handle?: string | null },
): Promise<Establishment> {
  const { data, error } = await supabase
    .from('establishments')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMyReview(
  userId: string,
  establishmentId: string,
): Promise<(Review & { review_ratings: ReviewRating[] }) | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, review_ratings(*)')
    .eq('user_id', userId)
    .eq('establishment_id', establishmentId)
    .maybeSingle()
  if (error) throw error
  return (data as (Review & { review_ratings: ReviewRating[] }) | null) ?? null
}

function extractPhotoPath(publicUrl: string): string | null {
  const marker = '/review-photos/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}

export async function deleteReviewPhoto(currentPhotoUrl: string | null): Promise<void> {
  if (!currentPhotoUrl) return
  const path = extractPhotoPath(currentPhotoUrl)
  if (!path) return
  const { error } = await supabase.storage.from('review-photos').remove([path])
  if (error && !/not.?found/i.test(error.message)) throw error
}

export async function updateReview(
  reviewId: string,
  userId: string,
  notes: string,
  scores: { topicId: string; score: number }[],
  photoFile: File | null,
  removePhoto: boolean,
  currentPhotoUrl: string | null,
): Promise<Review> {
  const { error: notesErr } = await supabase
    .from('reviews')
    .update({ notes: notes.trim() ? notes : null })
    .eq('id', reviewId)
  if (notesErr) throw notesErr

  const { error: delErr } = await supabase
    .from('review_ratings')
    .delete()
    .eq('review_id', reviewId)
  if (delErr) throw delErr

  if (scores.length > 0) {
    const ratingRows = scores.map((s) => ({
      review_id: reviewId,
      topic_id: s.topicId,
      score: s.score,
    }))
    const { error: insErr } = await supabase.from('review_ratings').insert(ratingRows)
    if (insErr) throw insErr
  }

  let nextPhotoUrl: string | null | undefined
  if (photoFile) {
    await deleteReviewPhoto(currentPhotoUrl)
    const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${reviewId}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('review-photos')
      .upload(path, photoFile, { upsert: true, contentType: photoFile.type })
    if (upErr) throw upErr
    const { data: pub } = supabase.storage.from('review-photos').getPublicUrl(path)
    nextPhotoUrl = pub.publicUrl
  } else if (removePhoto) {
    await deleteReviewPhoto(currentPhotoUrl)
    nextPhotoUrl = null
  }

  if (nextPhotoUrl !== undefined) {
    const { error: updErr } = await supabase
      .from('reviews')
      .update({ photo_url: nextPhotoUrl })
      .eq('id', reviewId)
    if (updErr) throw updErr
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .single()
  if (error) throw error
  return data
}

export async function createReview(
  userId: string,
  establishmentId: string,
  notes: string,
  scores: { topicId: string; score: number }[],
  photoFile: File | null = null,
): Promise<Review> {
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      establishment_id: establishmentId,
      notes: notes.trim() ? notes : null,
    })
    .select()
    .single()
  if (error) throw error

  if (scores.length > 0) {
    const ratingRows = scores.map((s) => ({
      review_id: review.id,
      topic_id: s.topicId,
      score: s.score,
    }))
    const { error: ratErr } = await supabase.from('review_ratings').insert(ratingRows)
    if (ratErr) {
      await supabase.from('reviews').delete().eq('id', review.id)
      throw ratErr
    }
  }

  if (photoFile) {
    try {
      const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${review.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('review-photos')
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('review-photos').getPublicUrl(path)
      const { error: updErr } = await supabase
        .from('reviews')
        .update({ photo_url: pub.publicUrl })
        .eq('id', review.id)
      if (updErr) throw updErr
      review.photo_url = pub.publicUrl
    } catch (err) {
      await supabase.from('reviews').delete().eq('id', review.id)
      throw err
    }
  }

  return review
}

