'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type {
  Section, SectionLayoutProps, SectionVisualProps,
  PlacementWithModule, CanvasWithPlacements, Actor,
} from '@/lib/schema/types'
import { updateCanvasMetadata, reorderPlacements } from '@/app/admin/actions/canvas'
import { createSection, updateSection, deleteSection, assignPlacementToSection } from '@/app/admin/actions/sections'
import { addModuleToCanvas, deletePlacement, updateModule } from '@/app/admin/actions/modules'

// ── Constants ────────────────────────────────────────────────────────────────

const HEIGHT_OPTIONS = ['viewport', 'auto', '50vh', '75vh', '600px', '800px', '1000px']
const MODULE_TYPES = ['atmosphere', 'focus', 'orbital_interaction', 'embed', 'text_block', 'media', 'gallery', 'form', 'custom']

// ── Types ────────────────────────────────────────────────────────────────────

type Containers = Record<string, string[]>
// 'root' → [sectionId | placementId, ...]
// sectionId → [placementId, ...]

type LayerOrderItem = { kind: 'section' | 'placement'; id: string }

interface LayerPanelProps {
  canvas: CanvasWithPlacements
  placements: PlacementWithModule[]
  sections: Section[]
  selectedId: string | null
  onEditPlacement: (p: PlacementWithModule) => void
  onPlacementsChange: (ps: PlacementWithModule[]) => void
  onSaved?: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildContainers(
  sections: Section[],
  placements: PlacementWithModule[],
  layerOrder: LayerOrderItem[],
): Containers {
  const sectionIds = new Set(sections.map(s => s.id))
  const knownIds = new Set(layerOrder.map(i => i.id))

  const rootOrder: string[] = layerOrder.length > 0
    ? [
        ...layerOrder.map(i => i.id),
        // append anything not yet in layer_order
        ...sections.filter(s => !knownIds.has(s.id)).map(s => s.id),
        ...placements.filter(p => p.section_id === null && !knownIds.has(p.id)).map(p => p.id),
      ]
    : [
        ...sections.map(s => s.id),
        ...placements.filter(p => p.section_id === null).map(p => p.id),
      ]

  // Filter root to only include IDs that still exist
  const validRoot = rootOrder.filter(id =>
    sectionIds.has(id) || placements.some(p => p.id === id && p.section_id === null)
  )

  const containers: Containers = { root: validRoot }
  for (const section of sections) {
    containers[section.id] = placements
      .filter(p => p.section_id === section.id)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map(p => p.id)
  }
  return containers
}

// ── LayerPanel ───────────────────────────────────────────────────────────────

export function LayerPanel({
  canvas, placements, sections: initialSections,
  selectedId, onEditPlacement, onPlacementsChange, onSaved,
}: LayerPanelProps) {
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [adding, setAdding] = useState(false)

  const layerOrder = (canvas.metadata?.layer_order as LayerOrderItem[] | undefined) ?? []
  const [containers, _setContainers] = useState<Containers>(() =>
    buildContainers(initialSections, placements, layerOrder)
  )
  const containersRef = useRef(containers)
  function setContainers(updater: Containers | ((prev: Containers) => Containers)) {
    _setContainers(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      containersRef.current = next
      return next
    })
  }

  // Track known section assignments so we only fire API on actual changes
  const knownSectionMap = useRef(
    new Map<string, string | null>(placements.map(p => [p.id, p.section_id]))
  )

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overContainerId, setOverContainerId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Sync containers when placements/sections IDs change (add/remove)
  const placementIds = placements.map(p => p.id).join(',')
  const sectionIds = sections.map(s => s.id).join(',')
  useEffect(() => {
    setContainers(prev => {
      const existingOrder: LayerOrderItem[] = prev.root.map(id => ({
        kind: (sections.find(s => s.id === id) ? 'section' : 'placement') as 'section' | 'placement',
        id,
      }))
      return buildContainers(sections, placements, existingOrder)
    })
    // Update knownSectionMap for any new placements
    placements.forEach(p => {
      if (!knownSectionMap.current.has(p.id)) {
        knownSectionMap.current.set(p.id, p.section_id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementIds, sectionIds])

  // ── Container helpers ──────────────────────────────────────────────────────

  function findContainer(id: string): string | undefined {
    if (id in containersRef.current) return id
    return Object.keys(containersRef.current).find(key =>
      containersRef.current[key].includes(id)
    )
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) { setOverContainerId(null); return }

    const activeId = active.id as string
    const overId = over.id as string
    const activeContainer = findContainer(activeId)
    // If over is itself a container key, that's the target container
    const overContainer = (overId in containersRef.current)
      ? overId
      : findContainer(overId)

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      // highlight section if we're hovering over it with a placement
      if (overContainer && overContainer !== 'root' && sections.find(s => s.id === overContainer)) {
        setOverContainerId(overContainer)
      } else {
        setOverContainerId(null)
      }
      return
    }

    // Only allow placements to cross containers (not sections)
    if (!placements.find(p => p.id === activeId)) return

    setOverContainerId(overContainer !== 'root' ? overContainer : null)

    setContainers(prev => {
      const activeItems = [...(prev[activeContainer] ?? [])]
      const overItems = [...(prev[overContainer] ?? [])]
      const activeIdx = activeItems.indexOf(activeId)
      if (activeIdx < 0) return prev
      activeItems.splice(activeIdx, 1)
      const overIdx = overItems.indexOf(overId)
      overItems.splice(overIdx >= 0 ? overIdx : overItems.length, 0, activeId)
      return { ...prev, [activeContainer]: activeItems, [overContainer]: overItems }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setOverContainerId(null)
    setActiveId(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeContainer = findContainer(activeId)
    const overContainer = (overId in containersRef.current)
      ? overId
      : findContainer(overId)

    if (!activeContainer || !overContainer) return

    if (activeContainer === overContainer) {
      // Reorder within container
      setContainers(prev => {
        const items = prev[activeContainer]
        const oldIdx = items.indexOf(activeId)
        const newIdx = items.indexOf(overId)
        if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return prev
        return { ...prev, [activeContainer]: arrayMove(items, oldIdx, newIdx) }
      })
    }

    // Persist after state has been updated
    requestAnimationFrame(() => saveContainers(containersRef.current))
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  const saveContainers = useCallback(async (c: Containers) => {
    // 1. Save root layer_order
    const layerOrder: LayerOrderItem[] = c.root.map(id => ({
      kind: (sections.find(s => s.id === id) ? 'section' : 'placement') as 'section' | 'placement',
      id,
    }))
    await updateCanvasMetadata(canvas.id, { ...canvas.metadata, layer_order: layerOrder })

    // 2. Assign section membership for moved placements
    for (const [containerId, ids] of Object.entries(c)) {
      const targetSectionId = containerId === 'root' ? null : containerId
      for (const id of ids) {
        if (!placements.find(p => p.id === id)) continue
        if (knownSectionMap.current.get(id) !== targetSectionId) {
          await assignPlacementToSection(id, targetSectionId)
          knownSectionMap.current.set(id, targetSectionId)
        }
      }
    }

    // 3. Reorder placements within each section
    for (const [containerId, ids] of Object.entries(c)) {
      if (containerId === 'root') continue
      const sectionPlacementIds = ids.filter(id => placements.find(p => p.id === id))
      if (sectionPlacementIds.length > 0) await reorderPlacements(sectionPlacementIds)
    }

    onSaved?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas.id, canvas.metadata, sections, placements])

  // ── Section handlers ───────────────────────────────────────────────────────

  async function handleAddSection() {
    const result = await createSection(canvas.id)
    if (!result.ok || !result.id) return
    const newSection: Section = {
      id: result.id,
      canvas_id: canvas.id,
      title: `Section ${sections.length + 1}`,
      order_index: sections.length,
      height: 'viewport',
      layout_type: 'free',
      layout_props: {},
      visual_props: {},
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSections(prev => [...prev, newSection])
    setContainers(prev => ({
      ...prev,
      root: [...prev.root, result.id!],
      [result.id!]: [],
    }))
    // Save new layer_order
    const newC = { ...containersRef.current, root: [...containersRef.current.root, result.id!], [result.id!]: [] }
    const layerOrder: LayerOrderItem[] = newC.root.map(id => ({
      kind: ([...sections, newSection].find(s => s.id === id) ? 'section' : 'placement') as 'section' | 'placement',
      id,
    }))
    await updateCanvasMetadata(canvas.id, { ...canvas.metadata, layer_order: layerOrder })
    onSaved?.()
  }

  async function handleDeleteSection(id: string) {
    await deleteSection(id)
    // Placements that were in this section become free (server nulls section_id)
    const freed = placements.filter(p => p.section_id === id).map(p => p.id)
    freed.forEach(pid => knownSectionMap.current.set(pid, null))
    setSections(prev => prev.filter(s => s.id !== id))
    setContainers(prev => {
      const childIds = prev[id] ?? []
      const newRoot = prev.root.filter(rid => rid !== id)
      const remaining = { ...prev }
      delete remaining[id]
      // Freed placements stay in their visual position but move to root visually
      return { ...remaining, root: [...newRoot, ...childIds] }
    })
    onSaved?.()
  }

  async function handleUpdateSection(id: string, data: Partial<Section>) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    await updateSection(id, data as Parameters<typeof updateSection>[1])
  }

  // ── Placement handlers ─────────────────────────────────────────────────────

  async function handleAddModule(type: string) {
    setAdding(true)
    const result = await addModuleToCanvas(canvas.id, type, placements.length)
    setAdding(false)
    if (!result.ok || !result.moduleId || !result.placementId) return
    const placeholder: PlacementWithModule = {
      id: result.placementId,
      canvas_id: canvas.id,
      module_id: result.moduleId,
      section_id: null,
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
    onPlacementsChange([...placements, placeholder])
    knownSectionMap.current.set(result.placementId, null)
    setContainers(prev => ({ ...prev, root: [...prev.root, result.placementId!] }))
    onSaved?.()
  }

  async function handleDeletePlacement(placementId: string) {
    const snapshot = placements
    onPlacementsChange(placements.filter(p => p.id !== placementId))
    setContainers(prev => {
      const updated: Containers = {}
      for (const [k, v] of Object.entries(prev)) {
        updated[k] = v.filter(id => id !== placementId)
      }
      return updated
    })
    const result = await deletePlacement(placementId)
    if (!result.ok) {
      onPlacementsChange(snapshot)
    } else {
      knownSectionMap.current.delete(placementId)
      onSaved?.()
    }
  }

  async function handleToggleHidden(placementId: string) {
    const placement = placements.find(p => p.id === placementId)
    if (!placement) return
    const currentProps = (placement.module.props ?? {}) as Record<string, unknown>
    const newProps = { ...currentProps, hidden: !currentProps.hidden }
    onPlacementsChange(placements.map(p =>
      p.id === placementId ? { ...p, module: { ...p.module, props: newProps } } : p
    ))
    await updateModule(placement.module.id, { props: newProps })
    onSaved?.()
  }

  async function handleRename(placementId: string, moduleId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    onPlacementsChange(placements.map(p =>
      p.id === placementId ? { ...p, module: { ...p.module, name: trimmed } } : p
    ))
    await updateModule(moduleId, { name: trimmed })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const activePlacement = activeId ? placements.find(p => p.id === activeId) ?? null : null
  const activeSection = activeId ? sections.find(s => s.id === activeId) ?? null : null

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30">
          Layers ({sections.length} sections · {placements.length} modules)
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={containers.root} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1 px-8">
            {containers.root.map(id => {
              const section = sections.find(s => s.id === id)
              if (section) {
                const childIds = containers[id] ?? []
                const childPlacements = childIds
                  .map(cid => placements.find(p => p.id === cid))
                  .filter(Boolean) as PlacementWithModule[]
                return (
                  <SortableSectionRow
                    key={id}
                    section={section}
                    childPlacements={childPlacements}
                    childIds={childIds}
                    selectedId={selectedId}
                    isOver={overContainerId === id}
                    onEditPlacement={onEditPlacement}
                    onUpdate={(data) => handleUpdateSection(id, data)}
                    onDelete={() => handleDeleteSection(id)}
                    onToggleHidden={handleToggleHidden}
                    onRename={handleRename}
                    onDeletePlacement={handleDeletePlacement}
                  />
                )
              }
              const placement = placements.find(p => p.id === id)
              if (placement) {
                return (
                  <SortablePlacementRow
                    key={id}
                    placement={placement}
                    depth={0}
                    selected={selectedId === id}
                    onEdit={() => onEditPlacement(placement)}
                    onDelete={() => handleDeletePlacement(id)}
                    onToggleHidden={() => handleToggleHidden(id)}
                    onRename={(name) => handleRename(id, placement.module.id, name)}
                  />
                )
              }
              return null
            })}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activePlacement && (
            <div className="bg-white/[0.08] border border-white/25 px-4 py-2 text-[11px] text-white/70 tracking-wide shadow-xl">
              {activePlacement.module.name ?? activePlacement.module.module_type}
            </div>
          )}
          {activeSection && (
            <div className="bg-white/[0.08] border border-white/25 px-4 py-2 text-[11px] text-white/70 tracking-wide shadow-xl">
              {activeSection.title ?? 'Section'}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add controls */}
      <div className="border border-white/[0.08] border-dashed mt-3 mx-8">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/20">Add</p>
          <button
            onClick={handleAddSection}
            className="text-[10px] tracking-[0.15em] uppercase text-white/30 hover:text-white/70 border border-white/15 hover:border-white/35 px-2.5 py-1 transition-colors"
          >
            + Section
          </button>
        </div>
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {MODULE_TYPES.map(type => (
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
  )
}

// ── SortableSectionRow ────────────────────────────────────────────────────────

function SortableSectionRow({
  section, childPlacements, childIds, selectedId, isOver,
  onEditPlacement, onUpdate, onDelete, onToggleHidden, onRename, onDeletePlacement,
}: {
  section: Section
  childPlacements: PlacementWithModule[]
  childIds: string[]
  selectedId: string | null
  isOver: boolean
  onEditPlacement: (p: PlacementWithModule) => void
  onUpdate: (data: Partial<Section>) => void
  onDelete: () => void
  onToggleHidden: (id: string) => void
  onRename: (placementId: string, moduleId: string, name: string) => void
  onDeletePlacement: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const vp = (section.visual_props ?? {}) as Record<string, unknown>
  const lp = (section.layout_props ?? {}) as Record<string, unknown>
  const isFlex = section.layout_type === 'flex'

  return (
    <div ref={setNodeRef} style={style} className={`border transition-colors ${isOver ? 'border-white/40 bg-white/[0.04]' : 'border-white/[0.12] bg-white/[0.015]'}`}>
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 flex flex-col gap-[3px] cursor-grab active:cursor-grabbing px-1 py-1 opacity-25 hover:opacity-60 transition-opacity"
        >
          <span className="w-3 h-px bg-white block" />
          <span className="w-3 h-px bg-white block" />
          <span className="w-3 h-px bg-white block" />
        </div>

        <button
          onClick={() => setIsExpanded(e => !e)}
          className="text-[10px] text-white/30 hover:text-white/60 w-3 shrink-0"
        >
          {isExpanded ? '▾' : '▸'}
        </button>

        <span className="text-[9px] tracking-[0.15em] uppercase text-white/35 shrink-0 border border-white/[0.1] px-1.5 py-0.5">
          section
        </span>

        <span className="text-[11px] text-white/70 flex-1 truncate font-light">
          {section.title || 'Untitled Section'}
        </span>

        <span className="text-[9px] text-white/20 tracking-[0.08em] shrink-0">
          {section.height} · {section.layout_type} · {childPlacements.length}m
        </span>

        <button
          onClick={() => {
            if (confirmDelete) { onDelete(); setConfirmDelete(false) }
            else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
          }}
          className={`text-[9px] transition-colors shrink-0 ${confirmDelete ? 'text-red-400/80' : 'text-white/20 hover:text-white/50'}`}
        >
          {confirmDelete ? 'Sure?' : '×'}
        </button>
      </div>

      {/* Drop hint when nothing inside and hovering */}
      {isOver && childPlacements.length === 0 && (
        <div className="mx-3 mb-2 border border-dashed border-white/20 py-2 flex items-center justify-center">
          <span className="text-[9px] text-white/25 tracking-[0.15em] uppercase">Drop here</span>
        </div>
      )}

      {/* Child modules */}
      {(isExpanded || isOver) && childPlacements.length > 0 && (
        <div className="pb-1.5">
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            {childPlacements.map(p => (
              <SortablePlacementRow
                key={p.id}
                placement={p}
                depth={1}
                selected={selectedId === p.id}
                onEdit={() => onEditPlacement(p)}
                onDelete={() => onDeletePlacement(p.id)}
                onToggleHidden={() => onToggleHidden(p.id)}
                onRename={(name) => onRename(p.id, p.module.id, name)}
              />
            ))}
          </SortableContext>
        </div>
      )}

      {/* Inline section editor */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 flex flex-col gap-3 border-t border-white/[0.06]">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-[0.15em] uppercase text-white/25 w-14 shrink-0">Title</span>
            <input
              type="text"
              value={section.title ?? ''}
              onChange={e => onUpdate({ title: e.target.value })}
              onPointerDown={e => e.stopPropagation()}
              className="flex-1 bg-transparent border-b border-white/10 text-white/60 text-[11px] py-0.5 focus:outline-none focus:border-white/30"
              placeholder="Untitled Section"
            />
          </div>

          {/* Height */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-[0.15em] uppercase text-white/25 w-14 shrink-0">Height</span>
            <select
              value={section.height}
              onChange={e => onUpdate({ height: e.target.value })}
              className="flex-1 bg-black border-b border-white/10 text-white/60 text-[11px] py-0.5 focus:outline-none"
            >
              {HEIGHT_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Layout */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-[0.15em] uppercase text-white/25 w-14 shrink-0">Layout</span>
            <div className="flex gap-2">
              {(['free', 'flex'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => onUpdate({ layout_type: t })}
                  className={`text-[9px] tracking-[0.15em] uppercase px-2 py-1 border transition-colors ${section.layout_type === t ? 'border-white/35 text-white/70' : 'border-white/10 text-white/25 hover:border-white/20'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {isFlex && (
            <div className="flex flex-col gap-2 pl-[68px]">
              {(['direction', 'align', 'justify'] as const).map(key => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[9px] text-white/20 w-16 capitalize">{key}</span>
                  <select
                    value={(lp[key] as string) ?? (key === 'direction' ? 'column' : key === 'align' ? 'center' : 'flex-start')}
                    onChange={e => onUpdate({ layout_props: { ...lp, [key]: e.target.value } as SectionLayoutProps })}
                    className="bg-black border-b border-white/10 text-white/50 text-[10px] py-0.5 focus:outline-none"
                  >
                    {key === 'direction'
                      ? ['column', 'row'].map(v => <option key={v} value={v}>{v}</option>)
                      : key === 'align'
                        ? ['flex-start', 'center', 'flex-end', 'stretch'].map(v => <option key={v} value={v}>{v}</option>)
                        : ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'].map(v => <option key={v} value={v}>{v}</option>)
                    }
                  </select>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/20 w-16">Gap</span>
                <input
                  type="number"
                  value={(lp.gap as number) ?? 0}
                  onChange={e => onUpdate({ layout_props: { ...lp, gap: Number(e.target.value) } as SectionLayoutProps })}
                  className="w-16 bg-transparent border-b border-white/10 text-white/50 text-[10px] py-0.5 focus:outline-none"
                />
                <span className="text-[9px] text-white/15">px</span>
              </div>
            </div>
          )}

          {/* Padding */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-[0.15em] uppercase text-white/25 w-14 shrink-0">Padding</span>
            <div className="flex gap-2">
              {(['padding_top', 'padding_right', 'padding_bottom', 'padding_left'] as const).map((k, pi) => (
                <div key={k} className="flex flex-col items-center gap-0.5">
                  <input
                    type="number"
                    value={(lp[k] as number) ?? 0}
                    onChange={e => onUpdate({ layout_props: { ...lp, [k]: Number(e.target.value) } as SectionLayoutProps })}
                    className="w-10 bg-transparent border-b border-white/10 text-white/50 text-[10px] py-0.5 text-center focus:outline-none"
                  />
                  <span className="text-[8px] text-white/15">{['T', 'R', 'B', 'L'][pi]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-[0.15em] uppercase text-white/25 w-14 shrink-0">Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(vp.background_color as string) || '#000000'}
                onChange={e => onUpdate({ visual_props: { ...vp, background_color: e.target.value } as SectionVisualProps })}
                className="w-6 h-6 bg-transparent border border-white/10 cursor-pointer rounded-none p-0"
              />
              <input
                type="text"
                value={(vp.background_color as string) || ''}
                onChange={e => onUpdate({ visual_props: { ...vp, background_color: e.target.value || undefined } as SectionVisualProps })}
                placeholder="transparent"
                className="bg-transparent border-b border-white/10 text-white/40 text-[10px] font-mono py-0.5 w-24 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-[0.15em] uppercase text-white/25 w-14 shrink-0">Opacity</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={(vp.background_opacity as number) ?? 1}
              onChange={e => onUpdate({ visual_props: { ...vp, background_opacity: Number(e.target.value) } as SectionVisualProps })}
              className="flex-1 accent-white/60"
            />
            <span className="text-[9px] text-white/25 w-6">{Math.round(((vp.background_opacity as number) ?? 1) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SortablePlacementRow ──────────────────────────────────────────────────────

function SortablePlacementRow({
  placement, depth, selected,
  onEdit, onDelete, onToggleHidden, onRename,
}: {
  placement: PlacementWithModule
  depth: number
  selected: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleHidden: () => void
  onRename: (name: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: placement.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const [editingName, setEditingName] = useState(false)
  const [localName, setLocalName] = useState(placement.module.name ?? placement.module.module_type)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const mod = placement.module
  const hidden = !!((mod.props as Record<string, unknown>)?.hidden)

  useEffect(() => {
    setLocalName(mod.name ?? mod.module_type)
  }, [mod.name, mod.module_type])

  function commitName() {
    setEditingName(false)
    const trimmed = localName.trim() || (mod.name ?? mod.module_type)
    setLocalName(trimmed)
    if (trimmed !== (mod.name ?? mod.module_type)) onRename(trimmed)
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center justify-between border-b border-white/[0.04] cursor-default select-none transition-all ${
          hidden ? 'opacity-40' : ''
        } ${selected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
        style={{ paddingLeft: depth === 1 ? '2.5rem' : '0.75rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="shrink-0 flex flex-col gap-[3px] cursor-grab active:cursor-grabbing px-0.5 py-0.5 opacity-20 hover:opacity-60 transition-opacity"
          >
            <span className="w-2.5 h-px bg-white block" />
            <span className="w-2.5 h-px bg-white block" />
            <span className="w-2.5 h-px bg-white block" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              {editingName ? (
                <input
                  ref={nameRef}
                  value={localName}
                  onChange={e => setLocalName(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitName()
                    if (e.key === 'Escape') { setLocalName(mod.name ?? mod.module_type); setEditingName(false) }
                    e.stopPropagation()
                  }}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  className="text-[11px] tracking-wide text-white bg-transparent border-b border-white/30 focus:outline-none flex-1 min-w-0"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setEditingName(true); setTimeout(() => nameRef.current?.select(), 0) }}
                  className="text-[11px] tracking-wide text-white/70 truncate hover:text-white/50 transition-colors text-left"
                  title="Click to rename"
                >
                  {localName}
                </button>
              )}
              <span className="shrink-0 text-[9px] tracking-[0.12em] uppercase text-white/20 border border-white/[0.08] px-1.5 py-0.5">
                {mod.module_type}
              </span>
            </div>
            <p className="text-[9px] text-white/20 mt-0.5 tracking-[0.08em]">
              {mod.actors.length} {mod.actors.length === 1 ? 'actor' : 'actors'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <button
            onClick={onToggleHidden}
            className={`py-1 px-2 border text-[9px] tracking-[0.12em] uppercase transition-colors ${
              hidden ? 'border-white/30 text-white/60' : 'border-white/10 text-white/25 hover:text-white/60 hover:border-white/25'
            }`}
          >
            {hidden ? '●' : '○'}
          </button>
          <button
            onClick={onEdit}
            className="px-2 py-1 border border-white/10 text-[9px] tracking-[0.12em] uppercase text-white/30 hover:text-white hover:border-white/35 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirmDelete) { onDelete() }
              else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
            }}
            className={`py-1 px-2 border text-[9px] tracking-[0.12em] uppercase transition-colors ${
              confirmDelete ? 'border-red-500/50 text-red-400/80' : 'border-white/[0.08] text-white/15 hover:text-white/45 hover:border-white/20'
            }`}
          >
            {confirmDelete ? 'Sure?' : '✕'}
          </button>
        </div>
      </div>

      {/* Actor rows */}
      {mod.actors.length > 0 && (
        <div className="divide-y divide-white/[0.03]" style={{ paddingLeft: depth === 1 ? '2.5rem' : '0' }}>
          {mod.actors.map((actor, i) => (
            <ActorRow key={actor.id} actor={actor} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── ActorRow ──────────────────────────────────────────────────────────────────

function ActorRow({ actor, index }: { actor: Actor; index: number }) {
  return (
    <div className="flex items-center gap-4 py-2 bg-white/[0.01]" style={{ paddingLeft: '4rem' }}>
      <span className="text-[9px] text-white/15 w-3 shrink-0">{index + 1}</span>
      <span className="text-[10px] tracking-wide text-white/50">
        {actor.name ?? actor.actor_type}
      </span>
      <span className="text-[9px] tracking-[0.12em] uppercase text-white/15 border border-white/[0.06] px-1.5 py-0.5">
        {actor.actor_type}
      </span>
      {actor.visual_schema?.color && (
        <div className="flex items-center gap-1.5 ml-auto">
          <div
            className="w-2.5 h-2.5 rounded-full border border-white/10"
            style={{ backgroundColor: actor.visual_schema.color as string }}
          />
        </div>
      )}
    </div>
  )
}
