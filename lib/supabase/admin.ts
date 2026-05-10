import { getAdminSupabase as getSupabase } from './admin-client'
import type { Canvas, Module, Actor, Persona, MediaAsset, CanvasWithModules, ModuleWithActors } from '@/lib/schema/types'

export async function adminFetchAllCanvases(): Promise<CanvasWithModules[]> {
  const supabase = getSupabase()

  const { data: canvases } = await supabase
    .from('canvases')
    .select('*')
    .order('order_index')

  if (!canvases) return []

  return Promise.all(
    (canvases as Canvas[]).map(async (canvas) => {
      const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .eq('canvas_id', canvas.id)
        .order('order_index')

      const modulesWithActors: ModuleWithActors[] = await Promise.all(
        ((modules ?? []) as Module[]).map(async (mod) => {
          const { data: actors } = await supabase
            .from('actors')
            .select('*')
            .eq('module_id', mod.id)
            .order('order_index')
          return { ...mod, actors: (actors ?? []) as Actor[] }
        })
      )

      return { ...canvas, modules: modulesWithActors }
    })
  )
}

export async function adminFetchCanvas(slug: string): Promise<CanvasWithModules | null> {
  const supabase = getSupabase()

  const { data: canvas } = await supabase
    .from('canvases')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!canvas) return null

  const typedCanvas = canvas as Canvas

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('canvas_id', typedCanvas.id)
    .order('order_index')

  const modulesWithActors: ModuleWithActors[] = await Promise.all(
    ((modules ?? []) as Module[]).map(async (mod) => {
      const { data: actors } = await supabase
        .from('actors')
        .select('*')
        .eq('module_id', mod.id)
        .order('order_index')
      return { ...mod, actors: (actors ?? []) as Actor[] }
    })
  )

  return { ...typedCanvas, modules: modulesWithActors }
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
