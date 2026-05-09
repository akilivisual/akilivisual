import { supabase } from './client'
import type { Canvas, Module, Actor, CanvasWithModules, ModuleWithActors } from '@/lib/schema/types'

export async function fetchCanvasBySlug(slug: string): Promise<CanvasWithModules | null> {
  const { data: canvas, error: canvasError } = await supabase
    .from('canvases')
    .select('*')
    .eq('slug', slug)
    .single()

  if (canvasError || !canvas) return null

  const typedCanvas = canvas as Canvas

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('canvas_id', typedCanvas.id)
    .order('order_index')

  const typedModules = (modules ?? []) as Module[]

  const modulesWithActors: ModuleWithActors[] = await Promise.all(
    typedModules.map(async (mod) => {
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

export async function fetchCanvasesByProject(projectSlug: string): Promise<CanvasWithModules[]> {
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
