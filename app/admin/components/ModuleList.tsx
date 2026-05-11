'use client'

import { useState } from 'react'
import { Reorder, useDragControls, AnimatePresence } from 'framer-motion'
import type { ModuleWithActors, Actor } from '@/lib/schema/types'
import { reorderModules } from '@/app/admin/actions/canvas'
import { addModule } from '@/app/admin/actions/modules'
import { ModuleEditPanel } from './ModuleEditPanel'

const MODULE_TYPES = ['atmosphere', 'focus', 'orbital_interaction', 'embed', 'text_block', 'media', 'custom']

interface ModuleListProps {
  modules: ModuleWithActors[]
  canvasId: string
}

export function ModuleList({ modules: initial, canvasId }: ModuleListProps) {
  const [modules, setModules] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<ModuleWithActors | null>(null)

  async function handleAddModule(type: string) {
    setAdding(true)
    const result = await addModule(canvasId, type, modules.length)
    setAdding(false)
    if (result.ok) {
      // Optimistically add a placeholder — page revalidation fills real data
      const placeholder: ModuleWithActors = {
        id: result.id!,
        canvas_id: canvasId,
        module_type: type,
        name: `New ${type}`,
        depth_layer: 'midground',
        order_index: modules.length,
        props: {},
        motion_profile: {},
        interaction_profile: {},
        resonance_profile: {},
        metadata: {},
        position: {},
        actors: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setModules((prev) => [...prev, placeholder])
    }
  }

  async function handleReorder(reordered: ModuleWithActors[]) {
    setModules(reordered)
    setSaving(true)
    await reorderModules(reordered.map((m) => m.id))
    setSaving(false)
  }

  function handleSaved() {
    // Refresh module data in editing panel by re-fetching from current list
    // The page will revalidate via server action — local state stays optimistic
    if (editing) {
      const updated = modules.find((m) => m.id === editing.id)
      if (updated) setEditing(updated)
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/30">
            Modules ({modules.length})
          </p>
          {saving && (
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/25 animate-pulse">
              Saving order...
            </span>
          )}
        </div>

        {modules.length === 0 ? (
          <div className="border border-white/10 border-dashed flex items-center justify-center py-12">
            <p className="text-[11px] tracking-[0.25em] uppercase text-white/15">No modules</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={modules}
            onReorder={handleReorder}
            className="flex flex-col gap-2"
          >
            {modules.map((mod, i) => (
              <DraggableModule
                key={mod.id}
                module={mod}
                index={i}
                onEdit={() => setEditing(mod)}
              />
            ))}
          </Reorder.Group>
        )}
        {/* Add Module */}
        <div className="border border-white/[0.08] border-dashed mt-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/20 px-5 pt-4 pb-2">
            Add Module
          </p>
          <div className="flex flex-wrap gap-2 px-5 pb-4">
            {MODULE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleAddModule(type)}
                disabled={adding}
                className="px-3 py-1.5 border border-white/15 text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-white hover:border-white/40 transition-colors disabled:opacity-30"
              >
                + {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Edit panel */}
      <AnimatePresence>
        {editing && (
          <ModuleEditPanel
            module={editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function DraggableModule({
  module,
  index,
  onEdit,
}: {
  module: ModuleWithActors
  index: number
  onEdit: () => void
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={module}
      dragListener={false}
      dragControls={controls}
      className="border border-white/10 bg-white/[0.02] cursor-default select-none"
      whileDrag={{
        scale: 1.01,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 10,
      }}
      transition={{ duration: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          {/* Drag handle */}
          <div
            className="flex flex-col gap-[3px] cursor-grab active:cursor-grabbing px-1 py-1 opacity-30 hover:opacity-70 transition-opacity"
            onPointerDown={(e) => controls.start(e)}
          >
            <span className="w-3 h-px bg-white block" />
            <span className="w-3 h-px bg-white block" />
            <span className="w-3 h-px bg-white block" />
          </div>

          <span className="text-[10px] text-white/20 w-4">{index + 1}</span>

          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm tracking-wide text-white">
                {module.name ?? module.module_type}
              </span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-white/25 border border-white/10 px-2 py-0.5">
                {module.module_type}
              </span>
            </div>
            <p className="text-[10px] text-white/25 mt-0.5 tracking-[0.1em]">
              layer: {module.depth_layer} · order: {module.order_index}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] tracking-[0.15em] uppercase text-white/25">
            {module.actors.length} {module.actors.length === 1 ? 'actor' : 'actors'}
          </span>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 border border-white/15 text-[10px] tracking-[0.15em] uppercase text-white/35 hover:text-white hover:border-white/45 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Actor rows */}
      {module.actors.length > 0 && (
        <div className="divide-y divide-white/[0.04]">
          {module.actors.map((actor, i) => (
            <ActorRow key={actor.id} actor={actor} index={i} />
          ))}
        </div>
      )}
    </Reorder.Item>
  )
}

function ActorRow({ actor, index }: { actor: Actor; index: number }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 pl-[4.5rem] bg-white/[0.01]">
      <span className="text-[10px] text-white/15 w-4">{index + 1}</span>
      <div className="flex-1 flex items-center gap-4">
        <span className="text-[11px] tracking-wide text-white/60">
          {actor.name ?? actor.actor_type}
        </span>
        <span className="text-[10px] tracking-[0.15em] uppercase text-white/20 border border-white/[0.08] px-2 py-0.5">
          {actor.actor_type}
        </span>
      </div>
      {actor.visual_schema?.color && (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full border border-white/10"
            style={{ backgroundColor: actor.visual_schema.color as string }}
          />
          {actor.visual_schema?.size && (
            <span className="text-[10px] text-white/20">{actor.visual_schema.size as number}px</span>
          )}
        </div>
      )}
    </div>
  )
}
