'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'

// ── Module (global prefab) ───────────────────────────────────────────

export async function updateModule(
  id: string,
  patch: {
    name?: string
    motion_profile?: Record<string, unknown>
    interaction_profile?: Record<string, unknown>
    resonance_profile?: Record<string, unknown>
    props?: Record<string, unknown>
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { data, error } = await supabase.from('modules').update(patch).eq('id', id).select()
  if (error) return { ok: false, error: error.message }
  if (!data?.length) return { ok: false, error: 'Module not found in database' }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

export async function addModule(
  type: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = getAdminSupabase()

  const { data, error } = await supabase
    .from('modules')
    .insert({
      module_type: type,
      name: `New ${type}`,
      props: defaultModuleProps(type),
      motion_profile: {},
      interaction_profile: {},
      resonance_profile: {},
      metadata: {},
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: data.id }
}

export async function deleteModule(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  // Manual delete actors (no CASCADE guarantee on actors.module_id)
  const { error: actorError } = await supabase.from('actors').delete().eq('module_id', id)
  if (actorError) return { ok: false, error: actorError.message }
  // canvas_placements cascade on module DELETE (via FK CASCADE)
  const { error } = await supabase.from('modules').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

// ── Placement (canvas ↔ module instance) ────────────────────────────

export async function addPlacement(
  canvasId: string,
  moduleId: string,
  orderIndex: number
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('canvas_placements')
    .insert({
      canvas_id: canvasId,
      module_id: moduleId,
      position: {},
      depth_layer: 'midground',
      order_index: orderIndex,
      overrides: {},
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true, id: data.id }
}

export async function updatePlacement(
  id: string,
  patch: {
    position?: Record<string, unknown>
    depth_layer?: string
    overrides?: Record<string, unknown>
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { data, error } = await supabase.from('canvas_placements').update(patch).eq('id', id).select()
  if (error) return { ok: false, error: error.message }
  if (!data?.length) return { ok: false, error: 'Placement not found' }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

export async function deletePlacement(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('canvas_placements').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

// Convenience: create a new global module + immediately place it on a canvas
export async function addModuleToCanvas(
  canvasId: string,
  type: string,
  orderIndex: number
): Promise<{ ok: boolean; moduleId?: string; placementId?: string; error?: string }> {
  const moduleResult = await addModule(type)
  if (!moduleResult.ok || !moduleResult.id) return { ok: false, error: moduleResult.error }

  const placementResult = await addPlacement(canvasId, moduleResult.id, orderIndex)
  if (!placementResult.ok || !placementResult.id) {
    // Roll back the orphan module
    await deleteModule(moduleResult.id)
    return { ok: false, error: placementResult.error }
  }

  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true, moduleId: moduleResult.id, placementId: placementResult.id }
}

// ── Actor ───────────────────────────────────────────────────────────

export async function reorderActors(
  actorIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const updates = actorIds.map((id, index) =>
    supabase.from('actors').update({ order_index: index }).eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

export async function updateActor(
  id: string,
  patch: {
    name?: string
    actor_type?: string
    transform?: Record<string, unknown>
    visual_schema?: Record<string, unknown>
    motion_schema?: Record<string, unknown>
    interaction_schema?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { data, error } = await supabase.from('actors').update(patch).eq('id', id).select()
  if (error) return { ok: false, error: error.message }
  if (!data?.length) return { ok: false, error: 'Actor not found in database' }
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
      : type === 'media'
      ? { src: '', media_type: 'video', width: 400, height: 300, autoplay: true, loop: true }
      : type === 'embed'
      ? { embed_type: 'iframe', url: '', width: 400, height: 300 }
      : type === 'custom'
      ? {}
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

export async function deleteActor(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('actors').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}

// ── Helpers ──────────────────────────────────────────────────────────

function defaultModuleProps(type: string): Record<string, unknown> {
  if (type === 'embed') {
    return { embed_type: 'iframe', url: '', width: null, height: 500, opacity: 1, border_radius: 0 }
  }
  if (type === 'gallery') {
    return { images: [], auto_advance: false, auto_interval: 5, transition_type: 'fade', transition_duration: 0.8, object_fit: 'cover' }
  }
  if (type === 'form') {
    return {
      fields: [
        { id: 'name', label: 'Name', type: 'text', placeholder: 'Your name', required: true },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', required: true },
      ],
      submit_label: 'Send',
      success_message: "Thank you. We'll be in touch.",
    }
  }
  return {}
}
