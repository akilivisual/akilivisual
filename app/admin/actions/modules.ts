'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'

// ── Module ──────────────────────────────────────────────────────────

export async function updateModule(
  id: string,
  patch: {
    name?: string
    depth_layer?: string
    position?: Record<string, unknown>
    motion_profile?: Record<string, unknown>
    resonance_profile?: Record<string, unknown>
    props?: Record<string, unknown>
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('modules').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

// ── Actor ───────────────────────────────────────────────────────────

export async function updateActor(
  id: string,
  patch: {
    name?: string
    actor_type?: string
    transform?: Record<string, unknown>
    visual_schema?: Record<string, unknown>
    motion_schema?: Record<string, unknown>
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('actors').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

export async function addActor(
  moduleId: string,
  orderIndex: number,
  type: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = getAdminSupabase()

  const defaults: Record<string, unknown> = {
    module_id: moduleId,
    actor_type: type,
    name: `New ${type}`,
    order_index: orderIndex,
    transform: { opacity: 1 },
    visual_schema: type === 'orb'
      ? { color: '#ffffff', size: 200, blur: 60 }
      : type === 'text'
      ? { text: 'Text', color: '#ffffff', font_size: 16 }
      : type === 'image'
      ? { src: '', size: 200 }
      : { text: 'AV', size: 120, color: '#ffffff' },
    motion_schema: {},
  }

  const { data, error } = await supabase
    .from('actors')
    .insert(defaults)
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true, id: data.id }
}

function defaultModuleProps(type: string): Record<string, unknown> {
  if (type === 'embed') {
    return { embed_type: 'iframe', url: '', width: null, height: 500, opacity: 1, border_radius: 0 }
  }
  return {}
}

export async function addModule(
  canvasId: string,
  type: string,
  orderIndex: number
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = getAdminSupabase()

  const { data, error } = await supabase
    .from('modules')
    .insert({
      canvas_id: canvasId,
      module_type: type,
      name: `New ${type}`,
      depth_layer: 'midground',
      order_index: orderIndex,
      props: defaultModuleProps(type),
      motion_profile: {},
      resonance_profile: {},
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true, id: data.id }
}

export async function deleteActor(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('actors').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}
