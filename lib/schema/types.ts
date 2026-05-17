// =========================================================
// AKILIVISUAL 2.0 — CORE SCHEMA TYPES
// Stage → Canvas → Placements → Modules → Actors
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
  album_id: string | null
  lenses: string[]
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

export const LENS_OPTIONS = ['art', 'cinema', 'politics', 'history', 'culture', 'science'] as const
export type Lens = typeof LENS_OPTIONS[number]

export interface Album {
  id: string
  title: string
  slug: string
  description: string | null
  theme: string | null
  status: string
  order_index: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AlbumWithStates extends Album {
  states: Canvas[]
}

// Modules are global prefabs — not scoped to any canvas.
// Position, depth, and order live on CanvasPlacement.
export interface Module {
  id: string
  module_type: ModuleType
  name: string | null
  props: Record<string, unknown>
  motion_profile: MotionProfileData
  interaction_profile: InteractionProfile
  resonance_profile: ResonanceProfileData
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// One instance of a module placed on a specific canvas.
export interface CanvasPlacement {
  id: string
  canvas_id: string
  module_id: string
  section_id: string | null
  position: Position
  depth_layer: DepthLayer
  order_index: number
  overrides: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  canvas_id: string
  title: string | null
  order_index: number
  height: string        // 'viewport' | 'auto' | '600px' etc.
  layout_type: 'free' | 'flex'
  layout_props: SectionLayoutProps
  visual_props: SectionVisualProps
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SectionLayoutProps {
  direction?: 'row' | 'column'
  align?: string
  justify?: string
  gap?: number
  wrap?: boolean
  padding_top?: number
  padding_right?: number
  padding_bottom?: number
  padding_left?: number
}

export interface SectionVisualProps {
  background_color?: string
  background_image?: string
  background_opacity?: number
}

export interface SectionWithPlacements extends Section {
  placements: PlacementWithModule[]
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
  opacity: { min: number; max: number }
  scale: { min: number; max: number }
  duration: number
  delay: number
  loop: boolean
  audio_reactivity: number
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
// COMPOSITE FETCH TYPES
// =========================================================

export interface ModuleWithActors extends Module {
  actors: Actor[]
}

export interface PlacementWithModule extends CanvasPlacement {
  module: ModuleWithActors
}

export interface CanvasWithPlacements extends Canvas {
  placements: PlacementWithModule[]
  sections: SectionWithPlacements[]
}

// Legacy alias — remove once all references are migrated
export type CanvasWithModules = CanvasWithPlacements

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
  width?: number
  height?: number
  rotate?: number
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
  font_family?: string
  // media actor
  media_type?: string
  width?: number
  height?: number
  autoplay?: boolean
  loop?: boolean
  // audio player skin
  player_bg?: string
  player_bg_opacity?: number
  player_bg_image?: string
  player_accent?: string
  player_text?: string
  player_radius?: number
  // embed actor
  embed_type?: string
  url?: string
  html?: string
  // image / media layout
  full_width?: boolean
  object_fit?: string
  // gradient edge mask
  mask_preset?: string
  mask_spread?: number
}

export interface KeyframePoint {
  t: number  // 0.0–1.0 normalized position within duration
  v: number  // value at this keyframe
}

export interface KeyframeMap {
  opacity?: KeyframePoint[]
  scale?: KeyframePoint[]
  x?: KeyframePoint[]
  y?: KeyframePoint[]
  rotate?: KeyframePoint[]
  zIndex?: KeyframePoint[]
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
  preset?: string
  keyframes?: KeyframeMap
  scroll_trigger?: boolean
  scroll_from?: number
  scroll_to?: number
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
  // Trigger actions
  click_action?: string    // 'none' | 'navigate_canvas' | 'external_link'
  click_target?: string    // canvas slug or URL
  click_new_tab?: boolean  // external_link only
}

// =========================================================
// SUPABASE DATABASE TYPE MAP
// =========================================================

export type Database = {
  public: {
    Tables: {
      projects: { Row: Project; Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Project> }
      albums: { Row: Album; Insert: Omit<Album, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Album> }
      canvases: { Row: Canvas; Insert: Omit<Canvas, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Canvas> }
      modules: { Row: Module; Insert: Omit<Module, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Module> }
      canvas_placements: { Row: CanvasPlacement; Insert: Omit<CanvasPlacement, 'id' | 'created_at' | 'updated_at'>; Update: Partial<CanvasPlacement> }
      sections: { Row: Section; Insert: Omit<Section, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Section> }
      actors: { Row: Actor; Insert: Omit<Actor, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Actor> }
      media_assets: { Row: MediaAsset; Insert: Omit<MediaAsset, 'id' | 'created_at' | 'updated_at'>; Update: Partial<MediaAsset> }
      personas: { Row: Persona; Insert: Omit<Persona, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Persona> }
      motion_profiles: { Row: MotionProfileRecord; Insert: Omit<MotionProfileRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<MotionProfileRecord> }
      resonance_profiles: { Row: ResonanceProfileRecord; Insert: Omit<ResonanceProfileRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<ResonanceProfileRecord> }
    }
  }
}
