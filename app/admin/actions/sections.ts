'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'
import type { SectionLayoutProps, SectionVisualProps } from '@/lib/schema/types'

export async function createSection(canvasId: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = getAdminSupabase()
  const { count } = await supabase.from('sections').select('*', { count: 'exact', head: true }).eq('canvas_id', canvasId)
  const { data, error } = await supabase.from('sections').insert({
    canvas_id: canvasId,
    title: `Section ${(count ?? 0) + 1}`,
    order_index: count ?? 0,
    height: 'viewport',
    layout_type: 'free',
    layout_props: {},
    visual_props: {},
    metadata: {},
  }).select().single()
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true, id: (data as { id: string }).id }
}

export async function updateSection(
  id: string,
  data: {
    title?: string | null
    height?: string
    layout_type?: 'free' | 'flex'
    layout_props?: SectionLayoutProps
    visual_props?: SectionVisualProps
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('sections').update(data).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true }
}

export async function deleteSection(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  // Null out section_id on placements so they don't disappear
  await supabase.from('canvas_placements').update({ section_id: null }).eq('section_id', id)
  const { error } = await supabase.from('sections').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true }
}

export async function reorderSections(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const updates = ids.map((id, index) =>
    supabase.from('sections').update({ order_index: index }).eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath('/admin')
  return { ok: true }
}

export async function assignPlacementToSection(
  placementId: string,
  sectionId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('canvas_placements').update({ section_id: sectionId }).eq('id', placementId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin')
  return { ok: true }
}
