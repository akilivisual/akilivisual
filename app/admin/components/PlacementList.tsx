'use client'

import { useState, useEffect } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import type { PlacementWithModule, Actor } from '@/lib/schema/types'
import { reorderPlacements } from '@/app/admin/actions/canvas'
import { addModuleToCanvas, deletePlacement, updateModule } from '@/app/admin/actions/modules'

const MODULE_TYPES = ['atmosphere', 'focus', 'orbital_interaction', 'embed', 'text_block', 'media', 'custom']

interface PlacementListProps {
  placements: PlacementWithModule[]
  canvasId: string
  selectedId: string | null
  onEdit: (placement: PlacementWithModule) => void
  onSaved?: () => void
  onAdd?: (placement: PlacementWithModule) => void
}

export function PlacementList({ placements: initial, canvasId, selectedId, onEdit, onSaved, onAdd }: PlacementListProps) {
  const [placements, setPlacements] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setPlacements(initial)
  }, [initial])

  async function handleAdd(type: string) {
    setAdding(true)
    const result = await addModuleToCanvas(canvasId, type, placements.length)
    setAdding(false)
    if (result.ok && result.moduleId && result.placementId) {
      const placeholder: PlacementWithModule = {
        id: result.placementId,
        canvas_id: canvasId,
        module_id: result.moduleId,
        position: {},
        depth_layer: 'midground',
        order_index: placements.length,
        overrides: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        module: {
          id: result.moduleId,
          module_type: type,
          name: `New ${type}`,
          props: {},
          motion_profile: {},
          interaction_profile: {},
          resonance_profile: {},
          metadata: {},
          actors: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }
      setPlacements(prev => [...prev, placeholder])
      onAdd?.(placeholder)
      onSaved?.()
    }
  }

  async function handleDelete(placementId: string) {
    const snapshot = placements
    setPlacements(prev => prev.filter(p => p.id !== placementId))
    const result = await deletePlacement(placementId)
    if (!result.ok) {
      setPlacements(snapshot)
    } else {
      onSaved?.()
    }
  }

  async function handleReorder(reordered: PlacementWithModule[]) {
    setPlacements(reordered)
    setSaving(true)
    await reorderPlacements(reordered.map(p => p.id))
    setSaving(false)
  }

  async function handleToggleHidden(placementId: string) {
    const placement = placements.find(p => p.id === placementId)
    if (!placement) return
    const currentProps = (placement.module.props ?? {}) as Record<string, unknown>
    const newProps = { ...currentProps, hidden: !currentProps.hidden }
    setPlacements(prev => prev.map(p =>
      p.id === placementId ? { ...p, module: { ...p.module, props: newProps } } : p
    ))
    await updateModule(placement.module.id, { props: newProps })
    onSaved?.()
  }

  function handleSaved(updated?: PlacementWithModule) {
    if (updated) {
      setPlacements(prev => prev.map(p => p.id === updated.id ? updated : p))
    }
    onSaved?.()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30">
          Modules ({placements.length})
        </p>
        {saving && (
          <span className="text-[10px] tracking-[0.15em] uppercase text-white/25 animate-pulse">
            Saving order...
          </span>
        )}
      </div>

      {placements.length === 0 ? (
        <div className="mx-8 border border-white/10 border-dashed flex items-center justify-center py-12">
          <p className="text-[11px] tracking-[0.25em] uppercase text-white/15">No modules</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={placements}
          onReorder={handleReorder}
          className="flex flex-col gap-2 px-8"
        >
          {placements.map((placement, i) => (
            <DraggablePlacement
              key={placement.id}
              placement={placement}
              index={i}
              selected={selectedId === placement.id}
              onEdit={() => onEdit(placement)}
              onDelete={() => handleDelete(placement.id)}
              onToggleHidden={() => handleToggleHidden(placement.id)}
            />
          ))}
        </Reorder.Group>
      )}

      {/* Add Module */}
      <div className="border border-white/[0.08] border-dashed mt-3 mx-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/20 px-5 pt-4 pb-2">
          Add Module
        </p>
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {MODULE_TYPES.map((type) => (
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
      </div>
    </div>
  )
}

function DraggablePlacement({
  placement,
  index,
  selected,
  onEdit,
  onDelete,
  onToggleHidden,
}: {
  placement: PlacementWithModule
  index: number
  selected: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleHidden: () => void
}) {
  const controls = useDragControls()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hidden = !!((placement.module.props as Record<string, unknown>)?.hidden)
  const mod = placement.module

  return (
    <Reorder.Item
      value={placement}
      dragListener={false}
      dragControls={controls}
      className={`border cursor-default select-none transition-all ${hidden ? 'opacity-40 bg-transparent' : 'bg-white/[0.02]'} ${selected ? 'border-white/30' : 'border-white/10'}`}
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
        <div className="flex items-center gap-4 min-w-0 mr-3">
          <div
            className="shrink-0 flex flex-col gap-[3px] cursor-grab active:cursor-grabbing px-1 py-1 opacity-30 hover:opacity-70 transition-opacity"
            onPointerDown={(e) => controls.start(e)}
          >
            <span className="w-3 h-px bg-white block" />
            <span className="w-3 h-px bg-white block" />
            <span className="w-3 h-px bg-white block" />
          </div>

          <span className="shrink-0 text-[10px] text-white/20 w-4">{index + 1}</span>

          <div className="min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm tracking-wide text-white truncate">
                {mod.name ?? mod.module_type}
              </span>
              <span className="shrink-0 text-[10px] tracking-[0.15em] uppercase text-white/25 border border-white/10 px-2 py-0.5">
                {mod.module_type}
              </span>
            </div>
            <p className="text-[10px] text-white/25 mt-0.5 tracking-[0.1em]">
              layer: {placement.depth_layer} · order: {placement.order_index}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <span className="text-[10px] tracking-[0.15em] uppercase text-white/25">
            {mod.actors.length} {mod.actors.length === 1 ? 'actor' : 'actors'}
          </span>
          <button
            onClick={onToggleHidden}
            className={`py-1.5 px-2.5 border text-[10px] tracking-[0.15em] uppercase transition-colors ${
              hidden
                ? 'border-white/30 text-white/60 hover:text-white hover:border-white/50'
                : 'border-white/15 text-white/35 hover:text-white/70 hover:border-white/35'
            }`}
          >
            {hidden ? '● Show' : '○ Hide'}
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 border border-white/15 text-[10px] tracking-[0.15em] uppercase text-white/35 hover:text-white hover:border-white/45 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirmDelete) {
                onDelete()
              } else {
                setConfirmDelete(true)
                setTimeout(() => setConfirmDelete(false), 3000)
              }
            }}
            className={`py-1.5 px-2.5 border text-[10px] tracking-[0.15em] uppercase transition-colors ${
              confirmDelete
                ? 'border-red-500/50 text-red-400/80'
                : 'border-white/10 text-white/20 hover:text-white/50 hover:border-white/25'
            }`}
          >
            {confirmDelete ? 'Sure?' : '✕'}
          </button>
        </div>
      </div>

      {/* Actor rows */}
      {mod.actors.length > 0 && (
        <div className="divide-y divide-white/[0.04]">
          {mod.actors.map((actor, i) => (
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
