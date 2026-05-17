import { getSupabase } from './client'
import type { Album, Canvas, Module, Actor, Section, SectionWithPlacements, CanvasWithPlacements, PlacementWithModule, ModuleWithActors, CanvasPlacement } from '@/lib/schema/types'

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

export async function fetchCanvasBySlug(slug: string): Promise<CanvasWithPlacements | null> {
  const supabase = getSupabase()

  const { data: canvas, error: canvasError } = await supabase
    .from('canvases')
    .select('*')
    .eq('slug', slug)
    .single()

  if (canvasError || !canvas) return null

  const placements = await fetchPlacements(supabase, (canvas as Canvas).id)
  const sections = await fetchSections(supabase, (canvas as Canvas).id, placements)
  return { ...(canvas as Canvas), placements, sections }
}

async function fetchSections(supabase: ReturnType<typeof getSupabase>, canvasId: string, placements: PlacementWithModule[]): Promise<SectionWithPlacements[]> {
  const { data } = await supabase.from('sections').select('*').eq('canvas_id', canvasId).order('order_index')
  if (!data) return []
  return (data as Section[]).map(s => ({
    ...s,
    placements: placements.filter(p => (p as unknown as { section_id: string | null }).section_id === s.id),
  }))
}

export async function fetchAllCanvases(): Promise<CanvasWithPlacements[]> {
  const supabase = getSupabase()

  const { data: canvases } = await supabase
    .from('canvases')
    .select('*')
    .order('order_index')

  if (!canvases) return []

  return Promise.all(
    (canvases as Canvas[]).map(async (canvas) => {
      const placements = await fetchPlacements(supabase, canvas.id)
      const sections = await fetchSections(supabase, canvas.id, placements)
      return { ...canvas, placements, sections }
    })
  )
}

export async function fetchAllAlbums(): Promise<Album[]> {
  const supabase = getSupabase()
  const { data } = await supabase.from('albums').select('*').order('order_index')
  return (data ?? []) as Album[]
}

export async function fetchCanvasesByIds(ids: string[]): Promise<CanvasWithPlacements[]> {
  if (ids.length === 0) return []
  const supabase = getSupabase()
  const { data: canvases } = await supabase
    .from('canvases')
    .select('*')
    .in('id', ids)

  if (!canvases) return []

  const withPlacements = await Promise.all(
    (canvases as Canvas[]).map(async (canvas) => {
      const placements = await fetchPlacements(supabase, canvas.id)
      const sections = await fetchSections(supabase, canvas.id, placements)
      return { ...canvas, placements, sections }
    })
  )

  // Return in the same order as `ids`
  return ids.map(id => withPlacements.find(c => c.id === id)).filter(Boolean) as CanvasWithPlacements[]
}

export async function fetchCanvasesByProject(projectSlug: string): Promise<CanvasWithPlacements[]> {
  const supabase = getSupabase()

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', projectSlug)
    .single()

  if (!project) return []

  const { data: canvases } = await supabase
    .from('canvases')
    .select('*')
    .eq('project_id', (project as { id: string }).id)
    .order('order_index')

  if (!canvases) return []

  return Promise.all(
    (canvases as Canvas[]).map(async (canvas) => {
      const placements = await fetchPlacements(supabase, canvas.id)
      const sections = await fetchSections(supabase, canvas.id, placements)
      return { ...canvas, placements, sections }
    })
  )
}
