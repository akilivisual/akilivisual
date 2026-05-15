'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAlbum(
  title: string,
  slug: string,
  theme?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { count } = await supabase.from('albums').select('*', { count: 'exact', head: true })
  const { error } = await supabase.from('albums').insert({
    title: title.trim(),
    slug: slug.trim(),
    theme: theme?.trim() || null,
    status: 'draft',
    order_index: count ?? 0,
    metadata: {},
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/albums')
  redirect(`/admin/albums/${slug.trim()}`)
}

export async function updateAlbum(
  id: string,
  fields: { title?: string; slug?: string; description?: string | null; theme?: string | null; status?: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('albums').update(fields).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/albums')
  return { ok: true }
}

export async function deleteAlbum(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  // Unassign all states in this album before deleting
  await supabase.from('canvases').update({ album_id: null }).eq('album_id', id)
  const { error } = await supabase.from('albums').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/albums')
  return { ok: true }
}

export async function reorderAlbums(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const updates = ids.map((id, index) =>
    supabase.from('albums').update({ order_index: index }).eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath('/admin/albums')
  return { ok: true }
}

export async function assignStateToAlbum(
  canvasId: string,
  albumId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('canvases').update({ album_id: albumId }).eq('id', canvasId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/albums')
  revalidatePath('/admin')
  return { ok: true }
}

export async function reorderAlbumStates(
  albumId: string,
  canvasIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const updates = canvasIds.map((id, index) =>
    supabase.from('canvases').update({ order_index: index }).eq('id', id).eq('album_id', albumId)
  )
  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath('/admin/albums')
  return { ok: true }
}

export async function updateCanvasLenses(
  canvasId: string,
  lenses: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('canvases').update({ lenses }).eq('id', canvasId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true }
}
