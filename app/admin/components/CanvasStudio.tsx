'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import type { CanvasWithPlacements, PlacementWithModule } from '@/lib/schema/types'
import { updatePlacement, deletePlacement } from '@/app/admin/actions/modules'
import { PlacementList } from './PlacementList'
import { CanvasEditor } from './CanvasEditor'
import { ModuleEditPanel } from './ModuleEditPanel'
import { DeleteCanvasButton } from './DeleteCanvasButton'

interface CanvasStudioProps {
  canvas: CanvasWithPlacements
}

type Mode = 'edit' | 'preview'

export function CanvasStudio({ canvas }: CanvasStudioProps) {
  const [placements, setPlacements] = useState(canvas.placements)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<PlacementWithModule | null>(null)
  const [mode, setMode] = useState<Mode>('edit')

  const totalActors = placements.reduce((n, p) => n + p.module.actors.length, 0)

  function handleSaved(updated?: PlacementWithModule) {
    if (updated) {
      setPlacements(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditing(updated)
    }
    setRefreshKey(k => k + 1)
  }

  async function handleMove(placementId: string, x: number, y: number, width?: number, height?: number) {
    const existing = (placements.find(p => p.id === placementId)?.position ?? {}) as Record<string, unknown>
    const newPos: Record<string, unknown> = { ...existing, x, y }
    if (width !== undefined) newPos.width = width
    if (height !== undefined) newPos.height = height
    setPlacements(prev => prev.map(p => p.id === placementId ? { ...p, position: newPos } : p))
    await updatePlacement(placementId, { position: newPos })
  }

  async function handleDelete(placementId: string) {
    setPlacements(prev => prev.filter(p => p.id !== placementId))
    if (editing?.id === placementId) setEditing(null)
    await deletePlacement(placementId)
    setRefreshKey(k => k + 1)
  }

  function handleSelect(placement: PlacementWithModule | null) {
    setEditing(placement)
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left panel — controls ───────────────────────────── */}
      <div className="w-[460px] shrink-0 border-r border-white/10 overflow-y-auto flex flex-col min-h-0">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/10 shrink-0">
          <Link
            href="/admin"
            className="text-[10px] tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors mb-5 inline-block"
          >
            ← States
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">{canvas.canvas_type}</p>
              <h1 className="text-xl font-light tracking-wide text-white truncate">{canvas.title}</h1>
              <p className="text-[11px] tracking-[0.1em] text-white/30 mt-1">{canvas.slug}</p>
            </div>
            <div className="shrink-0">
              <DeleteCanvasButton canvasId={canvas.id} canvasTitle={canvas.title} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-8 py-5 border-b border-white/[0.06] shrink-0">
          {[
            { label: 'Type', value: canvas.canvas_type },
            { label: 'Modules', value: placements.length },
            { label: 'Actors', value: totalActors },
          ].map((s) => (
            <div key={s.label} className="border border-white/10 bg-white/[0.02] px-3 py-3">
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-1">{s.label}</p>
              <p className="text-sm font-light text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Placement list */}
        <div className="py-5 flex-1">
          <PlacementList
            placements={placements}
            canvasId={canvas.id}
            selectedId={editing?.id ?? null}
            onEdit={setEditing}
            onAdd={(placement) => setPlacements(prev => [...prev, placement])}
            onSaved={() => setRefreshKey(k => k + 1)}
          />
        </div>

      </div>

      {/* ── Right panel — editor / preview ─────────────────── */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden flex flex-col">

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-5 z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-none">
            <div className={`w-1.5 h-1.5 rounded-full ${mode === 'preview' ? 'bg-white/40 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">
              {mode === 'edit' ? 'State Editor' : 'Live Preview'}
            </span>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 border text-[10px] tracking-[0.15em] uppercase transition-colors ${
                mode === 'edit'
                  ? 'border-white/30 text-white/70'
                  : 'border-white/10 text-white/25 hover:text-white/50 hover:border-white/20'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => { setMode('preview'); setRefreshKey(k => k + 1) }}
              className={`px-3 py-1 border text-[10px] tracking-[0.15em] uppercase transition-colors ${
                mode === 'preview'
                  ? 'border-white/30 text-white/70'
                  : 'border-white/10 text-white/25 hover:text-white/50 hover:border-white/20'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Canvas Editor */}
        {mode === 'edit' && (
          <CanvasEditor
            placements={placements}
            selectedId={editing?.id ?? null}
            onSelect={handleSelect}
            onCommit={handleMove}
            onDelete={handleDelete}
          />
        )}

        {/* Live Preview iframe */}
        {mode === 'preview' && (
          <iframe
            key={refreshKey}
            src={`/preview/${canvas.slug}`}
            className="w-full h-full border-none"
            title={canvas.title}
            allow="autoplay"
          />
        )}

      </div>

      {/* Module edit panel — shared between list and canvas editor */}
      <AnimatePresence>
        {editing && (
          <ModuleEditPanel
            placement={editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
            onDelete={() => handleDelete(editing.id)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
