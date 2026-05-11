'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ModuleWithActors, Actor, VisualSchema, MediaAsset } from '@/lib/schema/types'
import { updateModule, updateActor, addActor, deleteActor } from '@/app/admin/actions/modules'
import { createMediaAsset, listMediaAssets } from '@/app/admin/actions/media'
import { getSupabase } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────

type Tab = 'layout' | 'motion' | 'props' | 'actors'

interface Props {
  module: ModuleWithActors
  onClose: () => void
  onSaved: (m: ModuleWithActors) => void
}

// ── Helpers ──────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'layout', label: 'Layout' },
  { id: 'motion', label: 'Motion' },
  { id: 'props', label: 'Props' },
  { id: 'actors', label: 'Actors' },
]

const DEPTH_LAYERS = ['background', 'midground', 'foreground']
const EASING_TYPES = ['easeInOut', 'easeIn', 'easeOut', 'linear', 'spring']
const ACTOR_TYPES = ['logo', 'orb', 'text', 'image', 'media', 'embed', 'particle_field', 'custom']

function defaultVisualSchema(type: string): Record<string, unknown> {
  switch (type) {
    case 'orb':          return { color: '#ffffff', size: 200, blur: 60 }
    case 'text':         return { text: 'Text', color: '#ffffff', font_size: 16, font_weight: '300' }
    case 'image':        return { src: '', size: 200 }
    case 'logo':         return { text: 'AV', size: 120, color: '#ffffff', font_size: 13, font_weight: '300' }
    case 'particle_field': return { color: '#ffffff' }
    case 'media':        return { src: '', media_type: 'video', width: 400, height: 300, autoplay: true, loop: true }
    case 'embed':        return { embed_type: 'iframe', url: '', width: 400, height: 300 }
    case 'custom':       return {}
    default:             return {}
  }
}

// ── Panel ────────────────────────────────────────────────────────────

export function ModuleEditPanel({ module: initial, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>('layout')
  const [module, setModule] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  // Keep local state fresh if parent re-passes module
  useEffect(() => { setModule(initial) }, [initial])

  async function save() {
    setSaving(true)
    setStatus('')
    try {
      const result = await updateModule(module.id, {
        name: module.name ?? undefined,
        depth_layer: module.depth_layer,
        position: (module.position ?? {}) as Record<string, unknown>,
        motion_profile: (module.motion_profile ?? {}) as Record<string, unknown>,
        resonance_profile: (module.resonance_profile ?? {}) as Record<string, unknown>,
        props: (module.props ?? {}) as Record<string, unknown>,
      })
      if (result.ok) {
        setStatus('Saved')
        onSaved(module)
        setTimeout(() => setStatus(''), 2000)
      } else {
        setStatus(result.error ?? 'Error')
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="fixed right-0 top-0 h-full w-[500px] bg-[#080808] border-l border-white/10 z-50 flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-0.5">
              {module.module_type}
            </p>
            <h2 className="text-base font-light tracking-wide text-white">
              {module.name ?? module.module_type}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white transition-colors text-lg leading-none mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-[10px] tracking-[0.2em] uppercase transition-colors ${
                tab === t.id
                  ? 'text-white border-b border-white'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === 'layout' && (
            <LayoutTab module={module} onChange={setModule} />
          )}
          {tab === 'motion' && (
            <MotionTab module={module} onChange={setModule} />
          )}
          {tab === 'props' && (
            <PropsTab module={module} onChange={setModule} />
          )}
          {tab === 'actors' && (
            <ActorsTab module={module} onChange={setModule} onSaved={(m) => { setModule(m); onSaved(m) }} />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <span className={`text-[10px] tracking-[0.15em] ${status === 'Saved' ? 'text-white/40' : 'text-red-400/60'}`}>
            {status}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[11px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 border border-white/20 text-[11px] tracking-[0.2em] uppercase text-white/70 hover:text-white hover:border-white/50 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save Module'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Layout Tab ───────────────────────────────────────────────────────

function LayoutTab({ module, onChange }: { module: ModuleWithActors; onChange: (m: ModuleWithActors) => void }) {
  const pos = (module.position ?? {}) as Record<string, number>

  return (
    <div className="flex flex-col gap-6">
      <Field label="Module Name">
        <Input
          value={module.name ?? ''}
          onChange={(v) => onChange({ ...module, name: v })}
          placeholder="e.g. Logo Focus"
        />
      </Field>

      <Field label="Depth Layer">
        <Select
          value={module.depth_layer}
          options={DEPTH_LAYERS}
          onChange={(v) => onChange({ ...module, depth_layer: v })}
        />
      </Field>

      <Divider label="Position" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="X (%)">
          <NumberInput
            value={pos.x ?? 50}
            min={0} max={100}
            onChange={(v) => onChange({ ...module, position: { ...pos, x: v } })}
          />
        </Field>
        <Field label="Y (%)">
          <NumberInput
            value={pos.y ?? 50}
            min={0} max={100}
            onChange={(v) => onChange({ ...module, position: { ...pos, y: v } })}
          />
        </Field>
      </div>

      <Field label="Z Index">
        <NumberInput
          value={pos.z ?? 0}
          min={-10} max={10}
          onChange={(v) => onChange({ ...module, position: { ...pos, z: v } })}
        />
      </Field>
    </div>
  )
}

// ── Motion Tab ───────────────────────────────────────────────────────

function MotionTab({ module, onChange }: { module: ModuleWithActors; onChange: (m: ModuleWithActors) => void }) {
  const mp = (module.motion_profile ?? {}) as Record<string, unknown>
  function set(key: string, value: unknown) {
    onChange({ ...module, motion_profile: { ...mp, [key]: value } })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pulse Speed">
          <SliderInput value={(mp.pulse_speed as number) ?? 1} min={0} max={4} step={0.1} onChange={(v) => set('pulse_speed', v)} />
        </Field>
        <Field label="Duration (s)">
          <NumberInput value={(mp.duration as number) ?? 2} min={0.1} max={20} step={0.1} onChange={(v) => set('duration', v)} />
        </Field>
      </div>

      <Field label="Easing">
        <Select value={(mp.easing_type as string) ?? 'easeInOut'} options={EASING_TYPES} onChange={(v) => set('easing_type', v)} />
      </Field>

      <Divider label="Opacity" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min">
          <SliderInput value={(mp.opacity_min as number) ?? 0.4} min={0} max={1} step={0.01} onChange={(v) => set('opacity_min', v)} />
        </Field>
        <Field label="Max">
          <SliderInput value={(mp.opacity_max as number) ?? 1} min={0} max={1} step={0.01} onChange={(v) => set('opacity_max', v)} />
        </Field>
      </div>

      <Divider label="Scale" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min">
          <SliderInput value={(mp.scale_min as number) ?? 0.95} min={0.5} max={2} step={0.01} onChange={(v) => set('scale_min', v)} />
        </Field>
        <Field label="Max">
          <SliderInput value={(mp.scale_max as number) ?? 1.05} min={0.5} max={2} step={0.01} onChange={(v) => set('scale_max', v)} />
        </Field>
      </div>

      <Field label="Delay (s)">
        <NumberInput value={(mp.delay as number) ?? 0} min={0} max={10} step={0.1} onChange={(v) => set('delay', v)} />
      </Field>

      <Field label="Loop">
        <Toggle value={(mp.loop as boolean) ?? true} onChange={(v) => set('loop', v)} />
      </Field>
    </div>
  )
}

// ── Props Tab ────────────────────────────────────────────────────────

function PropsTab({ module, onChange }: { module: ModuleWithActors; onChange: (m: ModuleWithActors) => void }) {
  const props = (module.props ?? {}) as Record<string, unknown>
  function set(key: string, value: unknown) {
    onChange({ ...module, props: { ...props, [key]: value } })
  }

  // Atmosphere-specific
  if (module.module_type === 'atmosphere') {
    return (
      <div className="flex flex-col gap-6">
        <Field label="Background Color">
          <ColorInput value={(props.background as string) ?? '#000000'} onChange={(v) => set('background', v)} />
        </Field>
        <Divider label="Gradient Colors" />
        <Field label="Color 1">
          <ColorInput
            value={((props.gradient_colors as string[]) ?? ['#000000', '#000000'])[0]}
            onChange={(v) => {
              const gc = [...((props.gradient_colors as string[]) ?? ['#000000', '#000000'])]
              gc[0] = v
              set('gradient_colors', gc)
            }}
          />
        </Field>
        <Field label="Color 2">
          <ColorInput
            value={((props.gradient_colors as string[]) ?? ['#000000', '#000000'])[1]}
            onChange={(v) => {
              const gc = [...((props.gradient_colors as string[]) ?? ['#000000', '#000000'])]
              gc[1] = v
              set('gradient_colors', gc)
            }}
          />
        </Field>
      </div>
    )
  }

  // Embed-specific editor
  if (module.module_type === 'embed') {
    const embedType = (props.embed_type as string) ?? 'iframe'
    const EMBED_TYPES = ['iframe', 'spline', 'html', 'json']

    function resetContentFields(newType: string) {
      const base = { embed_type: newType, width: props.width, height: props.height, opacity: props.opacity, border_radius: props.border_radius }
      if (newType === 'iframe') return { ...base, url: '', allow_scripts: false }
      if (newType === 'spline') return { ...base, url: '', hide_ui: true }
      if (newType === 'html') return { ...base, html: '' }
      if (newType === 'json') return { ...base, json_data: '', max_height: 400 }
      return base
    }

    return (
      <div className="flex flex-col gap-6">
        <Field label="Embed Type">
          <Select
            value={embedType}
            options={EMBED_TYPES}
            onChange={(v) => onChange({ ...module, props: resetContentFields(v) })}
          />
        </Field>

        {embedType === 'iframe' && (
          <>
            <Field label="URL">
              <Input value={(props.url as string) ?? ''} onChange={(v) => set('url', v)} placeholder="https://..." />
            </Field>
            <Field label="Allow Scripts">
              <Toggle value={(props.allow_scripts as boolean) ?? false} onChange={(v) => set('allow_scripts', v)} />
            </Field>
          </>
        )}

        {embedType === 'spline' && (
          <>
            <Field label="Spline URL">
              <Input value={(props.url as string) ?? ''} onChange={(v) => set('url', v)} placeholder="https://my.spline.design/..." />
            </Field>
            <Field label="Hide UI">
              <Toggle value={(props.hide_ui as boolean) ?? true} onChange={(v) => set('hide_ui', v)} />
            </Field>
          </>
        )}

        {embedType === 'html' && (
          <Field label="HTML Code">
            <textarea
              spellCheck={false}
              className="w-full h-48 bg-white/[0.03] border border-white/10 text-[11px] text-white/60 font-mono p-3 leading-relaxed resize-none focus:outline-none focus:border-white/25"
              value={(props.html as string) ?? ''}
              onChange={(e) => set('html', e.target.value)}
              placeholder="<div style='color:white'>Hello</div>"
            />
          </Field>
        )}

        {embedType === 'json' && (
          <>
            <Field label="JSON Data">
              <textarea
                spellCheck={false}
                className="w-full h-40 bg-white/[0.03] border border-white/10 text-[11px] text-white/60 font-mono p-3 leading-relaxed resize-none focus:outline-none focus:border-white/25"
                value={(props.json_data as string) ?? ''}
                onChange={(e) => set('json_data', e.target.value)}
                placeholder='{"key": "value"}'
              />
            </Field>
            <Field label="Max Height (px)">
              <NumberInput value={(props.max_height as number) ?? 400} min={100} max={2000} onChange={(v) => set('max_height', v)} />
            </Field>
          </>
        )}

        <Divider label="Sizing" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Height (px)">
            <NumberInput value={(props.height as number) ?? 500} min={50} max={2000} onChange={(v) => set('height', v)} />
          </Field>
          <Field label="Width (px, 0=full)">
            <NumberInput
              value={(props.width as number) ?? 0}
              min={0} max={3840}
              onChange={(v) => set('width', v === 0 ? null : v)}
            />
          </Field>
        </div>

        <Field label="Opacity">
          <SliderInput value={(props.opacity as number) ?? 1} min={0} max={1} step={0.01} onChange={(v) => set('opacity', v)} />
        </Field>

        <Field label="Border Radius (px)">
          <NumberInput value={(props.border_radius as number) ?? 0} min={0} max={100} onChange={(v) => set('border_radius', v)} />
        </Field>
      </div>
    )
  }

  // Generic JSON editor for other module types
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] tracking-[0.2em] uppercase text-white/25">Raw Props (JSON)</p>
      <textarea
        className="w-full h-64 bg-white/[0.03] border border-white/10 text-[11px] text-white/60 font-mono p-3 leading-relaxed resize-none focus:outline-none focus:border-white/25"
        value={JSON.stringify(props, null, 2)}
        onChange={(e) => {
          try {
            onChange({ ...module, props: JSON.parse(e.target.value) })
          } catch {}
        }}
      />
    </div>
  )
}

// ── Actors Tab ───────────────────────────────────────────────────────

function ActorsTab({
  module,
  onChange,
  onSaved,
}: {
  module: ModuleWithActors
  onChange: (m: ModuleWithActors) => void
  onSaved: (m: ModuleWithActors) => void
}) {
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleAdd(type: string) {
    setAdding(true)
    setAddError('')
    try {
      const result = await addActor(module.id, module.actors.length, type)
      if (result.ok && result.id) {
        const newActor: Actor = {
          id: result.id,
          module_id: module.id,
          actor_type: type,
          name: `New ${type}`,
          order_index: module.actors.length,
          transform: { opacity: 1 },
          visual_schema: defaultVisualSchema(type),
          motion_schema: {},
          interaction_schema: {},
          ai_schema: {},
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const updated = { ...module, actors: [...module.actors, newActor] }
        onChange(updated)
        setExpandedId(result.id)
        onSaved(updated)
      } else {
        setAddError(result.error ?? 'Failed to add actor')
      }
    } catch {
      setAddError('Unexpected error')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(actorId: string) {
    await deleteActor(actorId)
    const updated = { ...module, actors: module.actors.filter((a) => a.id !== actorId) }
    onChange(updated)
    onSaved(updated)
  }

  function handleActorSaved(savedActor: Actor) {
    const updated = { ...module, actors: module.actors.map(a => a.id === savedActor.id ? savedActor : a) }
    onChange(updated)
    onSaved(updated)
  }

  return (
    <div className="flex flex-col gap-3">
      {module.actors.length === 0 && (
        <p className="text-[11px] text-white/20 text-center py-6 tracking-wide">No actors yet</p>
      )}

      {module.actors.map((actor) => (
        <ActorEditor
          key={actor.id}
          actor={actor}
          expanded={expandedId === actor.id}
          onToggle={() => setExpandedId(expandedId === actor.id ? null : actor.id)}
          onDelete={() => handleDelete(actor.id)}
          onActorSaved={handleActorSaved}
        />
      ))}

      {/* Add actor */}
      <div className="border border-white/[0.08] border-dashed mt-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 px-4 pt-4 pb-2">Add Actor</p>
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {ACTOR_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleAdd(type)}
              disabled={adding}
              className="px-3 py-1.5 border border-white/15 text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-white hover:border-white/40 transition-colors disabled:opacity-30"
            >
              + {type}
            </button>
          ))}
        </div>
        {addError && (
          <p className="text-[10px] text-red-400/70 px-4 pb-3">{addError}</p>
        )}
      </div>
    </div>
  )
}

function ActorEditor({
  actor: initial,
  expanded,
  onToggle,
  onDelete,
  onActorSaved,
}: {
  actor: Actor
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onActorSaved: (a: Actor) => void
}) {
  const [actor, setActor] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => { setActor(initial) }, [initial])

  const vs = (actor.visual_schema ?? {}) as Record<string, unknown>
  const tr = (actor.transform ?? {}) as Record<string, unknown>
  const ms = (actor.motion_schema ?? {}) as Record<string, unknown>

  function setVS(key: string, value: unknown) {
    setActor({ ...actor, visual_schema: { ...vs, [key]: value } })
  }
  function setTR(key: string, value: unknown) {
    setActor({ ...actor, transform: { ...tr, [key]: value } })
  }
  function setMS(key: string, value: unknown) {
    setActor({ ...actor, motion_schema: { ...ms, [key]: value } })
  }

  async function save() {
    setSaving(true)
    setSaveError('')
    try {
      const result = await updateActor(actor.id, {
        name: actor.name ?? undefined,
        actor_type: actor.actor_type,
        transform: (actor.transform ?? {}) as Record<string, unknown>,
        visual_schema: (actor.visual_schema ?? {}) as Record<string, unknown>,
        motion_schema: (actor.motion_schema ?? {}) as Record<string, unknown>,
      })
      if (result.ok) {
        onActorSaved(actor)
      } else {
        setSaveError(result.error ?? 'Save failed')
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Row header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left">
          <span className="text-[10px] text-white/20">{expanded ? '▾' : '▸'}</span>
          <span className="text-[11px] tracking-wide text-white/70">{actor.name ?? actor.actor_type}</span>
          <span className="text-[10px] tracking-[0.12em] uppercase text-white/25 border border-white/[0.08] px-2 py-0.5">
            {actor.actor_type}
          </span>
        </button>
        <button
          onClick={onDelete}
          className="text-[10px] text-white/35 hover:text-red-400/70 transition-colors px-2"
        >
          ✕
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 py-5 flex flex-col gap-5">
              <Field label="Name">
                <Input value={actor.name ?? ''} onChange={(v) => setActor({ ...actor, name: v })} />
              </Field>

              <Field label="Actor Type">
                <Select
                  value={actor.actor_type}
                  options={ACTOR_TYPES}
                  onChange={(v) => setActor({
                    ...actor,
                    actor_type: v,
                    visual_schema: defaultVisualSchema(v),
                  })}
                />
              </Field>

              <Divider label="Transform" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="X (%)">
                  <NumberInput value={(tr.x as number) ?? 50} min={0} max={100} onChange={(v) => setTR('x', v)} />
                </Field>
                <Field label="Y (%)">
                  <NumberInput value={(tr.y as number) ?? 50} min={0} max={100} onChange={(v) => setTR('y', v)} />
                </Field>
                <Field label="Opacity">
                  <SliderInput value={(tr.opacity as number) ?? 1} min={0} max={1} step={0.01} onChange={(v) => setTR('opacity', v)} />
                </Field>
                <Field label="Scale">
                  <SliderInput value={(tr.scale as number) ?? 1} min={0.1} max={3} step={0.01} onChange={(v) => setTR('scale', v)} />
                </Field>
                <Field label="Rotate (deg)">
                  <NumberInput value={(tr.rotate as number) ?? 0} min={-360} max={360} onChange={(v) => setTR('rotate', v)} />
                </Field>
              </div>

              {/* Visual schema — contextual by actor type */}
              <Divider label="Visual" />
              {(actor.actor_type === 'text' || actor.actor_type === 'logo') && (
                <div className="flex flex-col gap-4">
                  <Field label="Text">
                    <Input value={(vs.text as string) ?? ''} onChange={(v) => setVS('text', v)} />
                  </Field>
                  <Field label="Color">
                    <ColorInput value={(vs.color as string) ?? '#ffffff'} onChange={(v) => setVS('color', v)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Font Size">
                      <NumberInput value={(vs.font_size as number) ?? 16} min={8} max={200} onChange={(v) => setVS('font_size', v)} />
                    </Field>
                    <Field label="Font Weight">
                      <Select
                        value={(vs.font_weight as string) ?? '300'}
                        options={['100', '200', '300', '400', '500', '600', '700']}
                        onChange={(v) => setVS('font_weight', v)}
                      />
                    </Field>
                  </div>
                  <Field label="Size (container)">
                    <NumberInput value={(vs.size as number) ?? 120} min={20} max={800} onChange={(v) => setVS('size', v)} />
                  </Field>
                </div>
              )}

              {actor.actor_type === 'orb' && (
                <div className="flex flex-col gap-4">
                  <Field label="Color">
                    <ColorInput value={(vs.color as string) ?? '#ffffff'} onChange={(v) => setVS('color', v)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Size (px)">
                      <NumberInput value={(vs.size as number) ?? 200} min={20} max={1200} onChange={(v) => setVS('size', v)} />
                    </Field>
                    <Field label="Blur (px)">
                      <NumberInput value={(vs.blur as number) ?? 60} min={0} max={200} onChange={(v) => setVS('blur', v)} />
                    </Field>
                  </div>
                </div>
              )}

              {actor.actor_type === 'image' && (
                <div className="flex flex-col gap-4">
                  <Field label="Image">
                    <MediaPickerField
                      src={(vs.src as string) ?? ''}
                      onSrcChange={(url) => setVS('src', url)}
                      onPick={async (url) => {
                        const updatedActor = { ...actor, visual_schema: { ...vs, src: url } }
                        setActor(updatedActor)
                        setSaving(true)
                        setSaveError('')
                        try {
                          const result = await updateActor(updatedActor.id, {
                            visual_schema: updatedActor.visual_schema as Record<string, unknown>,
                          })
                          if (result.ok) onActorSaved(updatedActor)
                          else setSaveError(result.error ?? 'Save failed')
                        } catch (e) {
                          setSaveError(e instanceof Error ? e.message : 'Save failed')
                        } finally {
                          setSaving(false)
                        }
                      }}
                    />
                  </Field>
                  <Field label="Size (px)">
                    <NumberInput value={(vs.size as number) ?? 200} min={20} max={1200} onChange={(v) => setVS('size', v)} />
                  </Field>
                </div>
              )}

              {actor.actor_type === 'particle_field' && (
                <div className="flex flex-col gap-4">
                  <Field label="Color">
                    <ColorInput value={(vs.color as string) ?? '#ffffff'} onChange={(v) => setVS('color', v)} />
                  </Field>
                </div>
              )}

              {actor.actor_type === 'media' && (
                <div className="flex flex-col gap-4">
                  <Field label="Media Type">
                    <Select
                      value={(vs.media_type as string) ?? 'video'}
                      options={['video', 'gif', 'audio']}
                      onChange={(v) => setVS('media_type', v)}
                    />
                  </Field>
                  <Field label="Source URL">
                    <Input value={(vs.src as string) ?? ''} onChange={(v) => setVS('src', v)} placeholder="https://..." />
                  </Field>
                  {(vs.media_type as string) !== 'audio' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Width (px)">
                        <NumberInput value={(vs.width as number) ?? 400} min={50} max={3840} onChange={(v) => setVS('width', v)} />
                      </Field>
                      <Field label="Height (px)">
                        <NumberInput value={(vs.height as number) ?? 300} min={50} max={2160} onChange={(v) => setVS('height', v)} />
                      </Field>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Autoplay">
                      <Toggle value={(vs.autoplay as boolean) ?? true} onChange={(v) => setVS('autoplay', v)} />
                    </Field>
                    <Field label="Loop">
                      <Toggle value={(vs.loop as boolean) ?? true} onChange={(v) => setVS('loop', v)} />
                    </Field>
                  </div>
                </div>
              )}

              {actor.actor_type === 'embed' && (() => {
                const embedType = (vs.embed_type as string) ?? 'iframe'
                const EMBED_TYPES = ['iframe', 'spline', 'html']
                function resetEmbedContent(newType: string) {
                  const base = { embed_type: newType, width: vs.width ?? 400, height: vs.height ?? 300 }
                  if (newType === 'html') return { ...base, html: '' }
                  return { ...base, url: '' }
                }
                return (
                  <div className="flex flex-col gap-4">
                    <Field label="Embed Type">
                      <Select
                        value={embedType}
                        options={EMBED_TYPES}
                        onChange={(v) => setActor({ ...actor, visual_schema: resetEmbedContent(v) as VisualSchema })}
                      />
                    </Field>
                    {(embedType === 'iframe' || embedType === 'spline') && (
                      <Field label="URL">
                        <Input
                          value={(vs.url as string) ?? ''}
                          onChange={(v) => setVS('url', v)}
                          placeholder={embedType === 'spline' ? 'https://my.spline.design/...' : 'https://...'}
                        />
                      </Field>
                    )}
                    {embedType === 'html' && (
                      <Field label="HTML">
                        <textarea
                          spellCheck={false}
                          className="w-full h-32 bg-white/[0.03] border border-white/10 text-[11px] text-white/60 font-mono p-3 leading-relaxed resize-none focus:outline-none focus:border-white/25"
                          value={(vs.html as string) ?? ''}
                          onChange={(e) => setVS('html', e.target.value)}
                          placeholder="<div style='color:white'>Hello</div>"
                        />
                      </Field>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Width (px)">
                        <NumberInput value={(vs.width as number) ?? 400} min={50} max={3840} onChange={(v) => setVS('width', v)} />
                      </Field>
                      <Field label="Height (px)">
                        <NumberInput value={(vs.height as number) ?? 300} min={50} max={2160} onChange={(v) => setVS('height', v)} />
                      </Field>
                    </div>
                  </div>
                )
              })()}

              {actor.actor_type === 'custom' && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] tracking-[0.15em] uppercase text-white/20">Raw Visual Schema (JSON)</p>
                  <textarea
                    spellCheck={false}
                    className="w-full h-36 bg-white/[0.03] border border-white/10 text-[11px] text-white/60 font-mono p-3 leading-relaxed resize-none focus:outline-none focus:border-white/25"
                    value={JSON.stringify(vs, null, 2)}
                    onChange={(e) => {
                      try { setActor({ ...actor, visual_schema: JSON.parse(e.target.value) }) } catch {}
                    }}
                  />
                </div>
              )}

              <Divider label="Motion" />
              <Field label="Preset">
                <Select
                  value={(ms.preset as string) ?? 'phase_in'}
                  options={['phase_in', 'fade_in', 'slide_up', 'scale_in', 'pulse', 'none']}
                  onChange={(v) => setMS('preset', v)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Duration (s)">
                  <NumberInput value={(ms.duration as number) ?? 1.2} min={0.1} max={20} step={0.1} onChange={(v) => setMS('duration', v)} />
                </Field>
                <Field label="Delay (s)">
                  <NumberInput value={(ms.delay as number) ?? 0} min={0} max={10} step={0.1} onChange={(v) => setMS('delay', v)} />
                </Field>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                {saveError && (
                  <span className="text-[10px] text-red-400/70">{saveError}</span>
                )}
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-1.5 border border-white/20 text-[10px] tracking-[0.2em] uppercase text-white/60 hover:text-white hover:border-white/50 transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving...' : 'Save Actor'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Media Picker ─────────────────────────────────────────────────────

function MediaPickerField({
  src,
  onSrcChange,
  onPick,
}: {
  src: string
  onSrcChange: (url: string) => void
  onPick?: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showLibrary, setShowLibrary] = useState(false)
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function pick(url: string) {
    onSrcChange(url)
    onPick?.(url)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError('')
    try {
      const supabase = getSupabase()
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) { setUploadError(error.message); return }
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      await createMediaAsset(publicUrl, 'image', file.name.replace(/\.[^.]+$/, ''), path)
      pick(publicUrl)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function openLibrary() {
    setShowLibrary(true)
    setLoadingLibrary(true)
    const assets = await listMediaAssets()
    setLibraryAssets(assets.filter((a) => a.asset_type === 'image'))
    setLoadingLibrary(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full max-h-28 object-contain border border-white/10 bg-white/[0.02]" />
      )}
      <input
        type="text"
        value={src}
        onChange={(e) => onSrcChange(e.target.value)}
        placeholder="https://... or upload / pick from library"
        className="w-full bg-transparent border-b border-white/10 text-white/70 text-sm py-1.5 focus:outline-none focus:border-white/35 placeholder:text-white/15 transition-colors"
      />
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 border border-white/15 text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-white hover:border-white/40 transition-colors disabled:opacity-40"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <button
          onClick={showLibrary ? () => setShowLibrary(false) : openLibrary}
          className="px-3 py-1.5 border border-white/15 text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-white hover:border-white/40 transition-colors"
        >
          {showLibrary ? 'Close Library' : 'Library'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
        />
      </div>
      {uploadError && <p className="text-[10px] text-red-400/70">{uploadError}</p>}

      {showLibrary && (
        <div className="border border-white/10 bg-black/60 p-3 flex flex-col gap-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-1">Media Library</p>
          {loadingLibrary ? (
            <p className="text-[10px] text-white/20 text-center py-4 animate-pulse">Loading...</p>
          ) : libraryAssets.length === 0 ? (
            <p className="text-[10px] text-white/20 text-center py-4">No image assets in library</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {libraryAssets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { pick(a.url); setShowLibrary(false) }}
                  className="border border-white/10 hover:border-white/40 transition-colors overflow-hidden group relative"
                  title={a.title ?? a.url}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.title ?? ''} className="w-full h-16 object-cover" />
                  {src === a.url && (
                    <div className="absolute inset-0 border-2 border-white/60 pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Primitive inputs ─────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-[0.2em] uppercase text-white/30">{label}</label>
      {children}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-[0.2em] uppercase text-white/20">{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-white/10 text-white/80 text-sm py-1.5 focus:outline-none focus:border-white/35 placeholder:text-white/20 transition-colors"
    />
  )
}

function NumberInput({
  value, onChange, min, max, step = 1,
}: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full bg-transparent border-b border-white/10 text-white/80 text-sm py-1.5 focus:outline-none focus:border-white/35 transition-colors"
    />
  )
}

function SliderInput({
  value, onChange, min, max, step = 0.01,
}: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-white h-px"
      />
      <span className="text-[11px] text-white/40 w-10 text-right tabular-nums">{value.toFixed(2)}</span>
    </div>
  )
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black border-b border-white/10 text-white/80 text-sm py-1.5 focus:outline-none focus:border-white/35 transition-colors"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded-none border border-white/10 bg-transparent cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent border-b border-white/10 text-white/60 text-sm py-1.5 focus:outline-none focus:border-white/35 font-mono transition-colors"
      />
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 text-[11px] tracking-[0.1em] uppercase transition-colors ${value ? 'text-white' : 'text-white/30'}`}
    >
      <span className={`w-7 h-4 border transition-colors relative ${value ? 'border-white/40' : 'border-white/15'}`}>
        <span className={`absolute top-0.5 w-2.5 h-2.5 bg-white transition-all ${value ? 'left-[calc(100%-12px)] opacity-80' : 'left-0.5 opacity-20'}`} />
      </span>
      {value ? 'On' : 'Off'}
    </button>
  )
}
