'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCanvas(
  title: string,
  slug: string,
  canvasType: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()

  // Get next order_index
  const { count } = await supabase.from('canvases').select('*', { count: 'exact', head: true })
  const orderIndex = count ?? 0

  const { error } = await supabase.from('canvases').insert({
    title: title.trim(),
    slug: slug.trim(),
    canvas_type: canvasType,
    order_index: orderIndex,
    background_type: 'black',
    resonance_profile: {},
    transition_profile: { type: 'fade', duration: 0.8, easing: 'easeInOut' },
    metadata: {},
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  redirect(`/admin/canvas/${slug.trim()}`)
}

export async function createCanvasForAlbum(
  title: string,
  slug: string,
  canvasType: string,
  albumId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()

  const { count } = await supabase.from('canvases').select('*', { count: 'exact', head: true })
  const orderIndex = count ?? 0

  const { error } = await supabase.from('canvases').insert({
    title: title.trim(),
    slug: slug.trim(),
    canvas_type: canvasType,
    album_id: albumId,
    order_index: orderIndex,
    background_type: 'black',
    resonance_profile: {},
    transition_profile: { type: 'fade', duration: 0.8, easing: 'easeInOut' },
    metadata: {},
    lenses: [],
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  redirect(`/admin/canvas/${slug.trim()}`)
}

export async function deleteCanvas(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('canvases').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  redirect('/admin')
}

export async function reorderPlacements(
  placementIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()

  const updates = placementIds.map((id, index) =>
    supabase.from('canvas_placements').update({ order_index: index }).eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)

  if (failed?.error) return { ok: false, error: failed.error.message }

  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

// Legacy alias kept briefly for any remaining callers
export const reorderModules = reorderPlacements

export async function updateCanvasMetadata(
  id: string,
  metadata: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('canvases').update({ metadata }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteCanvasById(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('canvases').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true }
}

export async function duplicateCanvas(id: string): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const supabase = getAdminSupabase()

  const { data: source } = await supabase
    .from('canvases')
    .select('*, canvas_placements(*)')
    .eq('id', id)
    .single()
  if (!source) return { ok: false, error: 'State not found' }

  // Build a unique slug: strip trailing _N, find next unused number
  const baseSlug = source.slug.replace(/_\d+$/, '')
  const { data: existing } = await supabase.from('canvases').select('slug').ilike('slug', `${baseSlug}%`)
  const suffixes = (existing ?? []).map((r: { slug: string }) => {
    const m = r.slug.match(/_(\d+)$/)
    return m ? parseInt(m[1]) : 1
  })
  const nextN = suffixes.length === 0 ? 2 : Math.max(...suffixes) + 1
  const newSlug = `${baseSlug}_${nextN}`

  const { data: newCanvas, error: cErr } = await supabase
    .from('canvases')
    .insert({
      title: `${source.title} ${nextN}`,
      slug: newSlug,
      canvas_type: source.canvas_type,
      order_index: source.order_index + 0.5,
      background_type: source.background_type,
      resonance_profile: source.resonance_profile,
      transition_profile: source.transition_profile,
      metadata: source.metadata,
      lenses: source.lenses ?? [],
      album_id: source.album_id ?? null,
      project_id: source.project_id ?? null,
    })
    .select()
    .single()
  if (cErr) return { ok: false, error: cErr.message }

  const placements = (source.canvas_placements ?? []) as Record<string, unknown>[]
  if (placements.length > 0) {
    await supabase.from('canvas_placements').insert(
      placements.map(({ id: _id, canvas_id: _cid, created_at: _ca, updated_at: _ua, ...rest }) => ({
        ...rest,
        canvas_id: newCanvas.id,
      }))
    )
  }

  revalidatePath('/admin')
  return { ok: true, slug: newSlug }
}
