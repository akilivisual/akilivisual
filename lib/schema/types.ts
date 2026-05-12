// =========================================================
// AKILIVISUAL 2.0 — CORE SCHEMA TYPES
// Stage → Canvas → Modules → Actors
// =========================================================

export interface Project {
  id: string
  title: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Canvas {
  id: string
  project_id: string | null
  title: string
  slug: string
  canvas_type: string
  order_index: number
  background_type: string
  resonance_profile: ResonanceProfileData
  transition_profile: TransitionProfile
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  canvas_id: string | null
  module_type: ModuleType
  name: string | null
  depth_layer: DepthLayer
  position: Position
  props: Record<string, unknown>
  motion_profile: MotionProfileData
  interaction_profile: InteractionProfile
  resonance_profile: ResonanceProfileData
  metadata: Record<string, unknown>
  order_index: number
  created_at: string
  updated_at: string
}

export interface Actor {
  id: string
  module_id: string | null
  actor_type: ActorType
  name: string | null
  transform: Transform
  visual_schema: VisualSchema
  motion_schema: MotionProfileData
  interaction_schema: InteractionProfile
  ai_schema: Record<string, unknown>
  metadata: Record<string, unknown>
  order_index: number
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  asset_type: string
  title: string | null
  url: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Persona {
  id: string
  name: string
  slug: string
  system_prompt: string | null
  voice_profile: Record<string, unknown>
  mood_profile: Record<string, unknown>
  gesture_profile: Record<string, unknown>
  memory_enabled: boolean
  transformation_rules: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface MotionProfileRecord {
  id: string
  name: string
  pulse_speed: number
  easing_type: string
  opacity_behavior: Record<string, unknown>
  scale_behavior: Record<string, unknown>
  particle_behavior: Record<string, unknown>
  transition_behavior: Record<string, unknown>
  resonance_rules: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ResonanceProfileRecord {
  id: string
  name: string
  emotional_tone: string | null
  tempo: number
  intensity: number
  motion_multiplier: number
  audio_reactivity: number
  color_bias: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// =========================================================
// CANVAS WITH NESTED MODULES + ACTORS
// =========================================================

export interface CanvasWithModules extends Canvas {
  modules: ModuleWithActors[]
}

export interface ModuleWithActors extends Module {
  actors: Actor[]
}

// =========================================================
// INLINE PROFILE TYPES (stored as JSONB in the DB)
// =========================================================

export type ModuleType =
  | 'focus'
  | 'orbital_interaction'
  | 'atmosphere'
  | 'embed'
  | string

export type ActorType =
  | 'logo'
  | 'orb'
  | 'text'
  | 'image'
  | 'media'
  | 'embed'
  | 'custom'
  | 'particle_field'
  | string

export type DepthLayer = 'background' | 'midground' | 'foreground' | string

export interface Position {
  x?: number
  y?: number
  z?: number
  anchor?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface Transform {
  x?: number
  y?: number
  z?: number
  scale?: number
  rotate?: number
  opacity?: number
}

export interface VisualSchema {
  color?: string
  size?: number
  blur?: number
  gradient?: string[]
  src?: string
  text?: string
  font_size?: number
  font_weight?: string
  // media actor
  media_type?: string
  width?: number
  height?: number
  autoplay?: boolean
  loop?: boolean
  // embed actor
  embed_type?: string
  url?: string
  html?: string
}

export interface MotionProfileData {
  pulse_speed?: number
  easing_type?: string
  opacity_min?: number
  opacity_max?: number
  scale_min?: number
  scale_max?: number
  duration?: number
  delay?: number
  loop?: boolean
}

export interface ResonanceProfileData {
  emotional_tone?: string
  tempo?: number
  intensity?: number
  motion_multiplier?: number
  audio_reactivity?: number
  color_bias?: string
}

export interface TransitionProfile {
  type?: 'fade' | 'slide' | 'scale' | 'none'
  duration?: number
  easing?: string
}

export interface InteractionProfile {
  hover?: boolean
  click?: boolean
  drag?: boolean
  cursor?: string
  // Parallax — module-level, driven by mouse position
  parallax_enabled?: boolean
  parallax_strength?: number
  // Tilt — module-level 3D rotation toward cursor
  tilt_enabled?: boolean
  tilt_max?: number
  tilt_perspective?: number
  // Magnetic — actor-level drift toward cursor (logo/text only)
  magnetic_enabled?: boolean
  magnetic_radius?: number
  magnetic_strength?: number
}

// =========================================================
// SUPABASE DATABASE TYPE MAP
// =========================================================

export type Database = {
  public: {
    Tables: {
      projects: { Row: Project; Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Project> }
      canvases: { Row: Canvas; Insert: Omit<Canvas, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Canvas> }
      modules: { Row: Module; Insert: Omit<Module, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Module> }
      actors: { Row: Actor; Insert: Omit<Actor, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Actor> }
      media_assets: { Row: MediaAsset; Insert: Omit<MediaAsset, 'id' | 'created_at' | 'updated_at'>; Update: Partial<MediaAsset> }
      personas: { Row: Persona; Insert: Omit<Persona, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Persona> }
      motion_profiles: { Row: MotionProfileRecord; Insert: Omit<MotionProfileRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<MotionProfileRecord> }
      resonance_profiles: { Row: ResonanceProfileRecord; Insert: Omit<ResonanceProfileRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<ResonanceProfileRecord> }
    }
  }
}
