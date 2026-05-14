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
