import { getAdminSupabase as getSupabase } from './admin-client'
import type { Album, AlbumWithStates, Canvas, Module, Actor, Persona, MediaAsset, CanvasWithPlacements, PlacementWithModule, ModuleWithActors, CanvasPlacement } from '@/lib/schema/types'

async function fetchPlacements(supabase: ReturnType<typeof getSupabase>, canvasId: string): Promise<PlacementWithModule[]> {
  const { data: placements } = await supabase
    .from('canvas_placements')
    .select('*')
    .eq('canvas_id', canvasId)
    .order('order_index')

  if (!placements) return []

  return Promise.all(
    (placements as CanvasPlacement[]).map(async (placement) => {
      const { data: mod } = await supabase
        .from('modules')
        .select('*')
        .eq('id', placement.module_id)
        .single()

      if (!mod) return { ...placement, module: { id: placement.module_id, module_type: 'unknown', name: null, props: {}, motion_profile: {}, interaction_profile: {}, resonance_profile: {}, metadata: {}, created_at: '', updated_at: '', actors: [] } }

      const { data: actors } = await supabase
        .from('actors')
        .select('*')
        .eq('module_id', mod.id)
        .order('order_index')

      const moduleWithActors: ModuleWithActors = { ...(mod as Module), actors: (actors ?? []) as Actor[] }
      return { ...placement, module: moduleWithActors }
    })
  )
}

export async function adminFetchAllCanvases(): Promise<CanvasWithPlacements[]> {
  const supabase = getSupabase()

  const { data: canvases } = await supabase
    .from('canvases')
    .select('*')
    .order('order_index')

  if (!canvases) return []

  return Promise.all(
    (canvases as Canvas[]).map(async (canvas) => {
      const placements = await fetchPlacements(supabase, canvas.id)
      return { ...canvas, placements }
    })
  )
}

export async function adminFetchCanvas(slug: string): Promise<CanvasWithPlacements | null> {
  const supabase = getSupabase()

  const { data: canvas } = await supabase
    .from('canvases')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!canvas) return null

  const placements = await fetchPlacements(supabase, (canvas as Canvas).id)
  return { ...(canvas as Canvas), placements }
}

export async function adminFetchAllModules(): Promise<ModuleWithActors[]> {
  const supabase = getSupabase()

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('created_at')

  if (!modules) return []

  return Promise.all(
    (modules as Module[]).map(async (mod) => {
      const { data: actors } = await supabase
        .from('actors')
        .select('*')
        .eq('module_id', mod.id)
        .order('order_index')
      return { ...mod, actors: (actors ?? []) as Actor[] }
    })
  )
}

export async function adminFetchAllPersonas(): Promise<Persona[]> {
  const supabase = getSupabase()
  const { data } = await supabase.from('personas').select('*').order('created_at')
  return (data ?? []) as Persona[]
}

export async function adminFetchAllMedia(): Promise<MediaAsset[]> {
  const supabase = getSupabase()
  const { data } = await supabase.from('media_assets').select('*').order('created_at')
  return (data ?? []) as MediaAsset[]
}

export async function adminFetchAllAlbums(): Promise<Album[]> {
  const supabase = getSupabase()
  const { data } = await supabase.from('albums').select('*').order('order_index')
  return (data ?? []) as Album[]
}

export async function adminFetchAlbumWithStates(slug: string): Promise<AlbumWithStates | null> {
  const supabase = getSupabase()
  const { data: album } = await supabase.from('albums').select('*').eq('slug', slug).single()
  if (!album) return null
  const { data: states } = await supabase
    .from('canvases')
    .select('*')
    .eq('album_id', album.id)
    .order('order_index')
  return { ...(album as Album), states: (states ?? []) as Canvas[] }
}
