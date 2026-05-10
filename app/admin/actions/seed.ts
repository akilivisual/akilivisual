'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'

export type SeedResult =
  | { ok: true; canvasSlug: string; message: string }
  | { ok: false; error: string }

export async function seedCanvas0001(): Promise<SeedResult> {
  const supabase = getAdminSupabase()

  // ── Guard: skip if already exists ──────────────────────────────
  const { data: existing } = await supabase
    .from('canvases')
    .select('id')
    .eq('slug', 'canvas_0001')
    .maybeSingle()

  if (existing) {
    return { ok: true, canvasSlug: 'canvas_0001', message: 'Canvas_0001 already exists.' }
  }

  // ── 1. Canvas ───────────────────────────────────────────────────
  const { data: canvas, error: canvasErr } = await supabase
    .from('canvases')
    .insert({
      title: 'Canvas 0001',
      slug: 'canvas_0001',
      canvas_type: 'default',
      order_index: 0,
      background_type: 'black',
      resonance_profile: {
        emotional_tone: 'focused',
        tempo: 0.8,
        intensity: 0.6,
        motion_multiplier: 1.0,
      },
      transition_profile: {
        type: 'fade',
        duration: 1.2,
        easing: 'easeInOut',
      },
    })
    .select()
    .single()

  if (canvasErr || !canvas) {
    return { ok: false, error: canvasErr?.message ?? 'Failed to insert canvas' }
  }

  // ── 2. AtmosphereModule ─────────────────────────────────────────
  const { data: atmMod, error: atmErr } = await supabase
    .from('modules')
    .insert({
      canvas_id: canvas.id,
      module_type: 'atmosphere',
      name: 'Atmosphere',
      depth_layer: 'background',
      order_index: 0,
      props: {
        background: '#000000',
        gradient_colors: ['#0a0a0a', '#000000'],
      },
      motion_profile: {},
      resonance_profile: {},
    })
    .select()
    .single()

  if (atmErr || !atmMod) {
    return { ok: false, error: atmErr?.message ?? 'Failed to insert atmosphere module' }
  }

  // ── 3. FocusModule ──────────────────────────────────────────────
  const { data: focusMod, error: focusErr } = await supabase
    .from('modules')
    .insert({
      canvas_id: canvas.id,
      module_type: 'focus',
      name: 'Logo Focus',
      depth_layer: 'midground',
      order_index: 1,
      props: {},
      motion_profile: {
        duration: 1.4,
        easing_type: 'easeOut',
      },
      resonance_profile: {},
    })
    .select()
    .single()

  if (focusErr || !focusMod) {
    return { ok: false, error: focusErr?.message ?? 'Failed to insert focus module' }
  }

  // Logo actor inside FocusModule
  const { error: logoErr } = await supabase
    .from('actors')
    .insert({
      module_id: focusMod.id,
      actor_type: 'logo',
      name: 'AV Wordmark',
      order_index: 0,
      transform: { opacity: 1, scale: 1 },
      visual_schema: {
        text: 'AkiliVisual',
        size: 140,
        color: '#ffffff',
        font_size: 13,
        font_weight: '300',
      },
      motion_schema: {},
    })

  if (logoErr) return { ok: false, error: logoErr.message }

  // ── 4. OrbitalInteractionModule ─────────────────────────────────
  const { data: orbMod, error: orbModErr } = await supabase
    .from('modules')
    .insert({
      canvas_id: canvas.id,
      module_type: 'orbital_interaction',
      name: 'Orbital Orbs',
      depth_layer: 'foreground',
      order_index: 2,
      props: {},
      motion_profile: {
        pulse_speed: 1.0,
        opacity_min: 0.15,
        opacity_max: 0.5,
        scale_min: 0.92,
        scale_max: 1.08,
        duration: 3.5,
        loop: true,
      },
      resonance_profile: {},
    })
    .select()
    .single()

  if (orbModErr || !orbMod) {
    return { ok: false, error: orbModErr?.message ?? 'Failed to insert orbital module' }
  }

  // Orb actors — left and right
  const orbs = [
    {
      name: 'Orb Left',
      transform: { x: 28, y: 50, opacity: 0.4 },
      visual_schema: { color: '#ffffff', size: 320, blur: 80 },
      order_index: 0,
    },
    {
      name: 'Orb Right',
      transform: { x: 72, y: 50, opacity: 0.4 },
      visual_schema: { color: '#ffffff', size: 320, blur: 80 },
      order_index: 1,
    },
  ]

  for (const orb of orbs) {
    const { error: orbErr } = await supabase.from('actors').insert({
      module_id: orbMod.id,
      actor_type: 'orb',
      name: orb.name,
      order_index: orb.order_index,
      transform: orb.transform,
      visual_schema: orb.visual_schema,
      motion_schema: {},
    })
    if (orbErr) return { ok: false, error: orbErr.message }
  }

  return {
    ok: true,
    canvasSlug: 'canvas_0001',
    message: 'Canvas_0001 seeded — atmosphere, logo, 2 orbs.',
  }
}
