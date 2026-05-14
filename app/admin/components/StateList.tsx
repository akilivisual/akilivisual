'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CanvasWithPlacements } from '@/lib/schema/types'
import { deleteCanvasById, duplicateCanvas } from '@/app/admin/actions/canvas'

interface StateListProps {
  initialCanvases: CanvasWithPlacements[]
}

export function StateList({ initialCanvases }: StateListProps) {
  const [canvases, setCanvases] = useState(initialCanvases)
  const router = useRouter()

  async function handleDelete(id: string) {
    setCanvases(prev => prev.filter(c => c.id !== id))
    await deleteCanvasById(id)
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateCanvas(id)
    if (result.ok) router.refresh()
  }

  if (canvases.length === 0) return <EmptyState />

  return (
    <div className="flex flex-col gap-2">
      {canvases.map(canvas => (
        <StateRow
          key={canvas.id}
          canvas={canvas}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      ))}
    </div>
  )
}

function StateRow({
  canvas,
  onDelete,
  onDuplicate,
}: {
  canvas: CanvasWithPlacements
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const actorCount = canvas.placements.reduce((n, p) => n + p.module.actors.length, 0)
  const moduleTypes = canvas.placements.map(p => p.module.module_type)

  async function handleDuplicateClick() {
    setDuplicating(true)
    await onDuplicate(canvas.id)
    setDuplicating(false)
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(canvas.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div className="flex items-center border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all">
      {/* Main content — navigates to detail */}
      <Link
        href={`/admin/canvas/${canvas.slug}`}
        className="flex-1 flex items-center justify-between px-6 py-5 hover:bg-white/[0.03] transition-all min-w-0"
      >
        {/* Left — title + slug */}
        <div className="flex flex-col gap-1.5 min-w-0 mr-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm tracking-wide text-white truncate">{canvas.title}</span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/25 border border-white/10 px-2 py-0.5 shrink-0">
              {canvas.canvas_type}
            </span>
          </div>
          <p className="text-[11px] tracking-[0.1em] text-white/30 truncate">{canvas.slug}</p>
        </div>

        {/* Center — module type tags */}
        <div className="hidden md:flex gap-2 flex-wrap mr-6">
          {moduleTypes.slice(0, 5).map((type, i) => (
            <span
              key={i}
              className="text-[10px] tracking-[0.15em] uppercase text-white/25 border border-white/[0.08] px-2 py-1"
            >
              {type}
            </span>
          ))}
          {moduleTypes.length > 5 && (
            <span className="text-[10px] text-white/15">+{moduleTypes.length - 5}</span>
          )}
        </div>

        {/* Right — counts + arrow */}
        <div className="flex items-center gap-8 shrink-0">
          <div className="text-right">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/20 mb-0.5">Modules</p>
            <p className="text-sm text-white/60">{canvas.placements.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/20 mb-0.5">Actors</p>
            <p className="text-sm text-white/60">{actorCount}</p>
          </div>
          <span className="text-white/20 group-hover:text-white/60 transition-colors text-sm">→</span>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 border-l border-white/[0.06] shrink-0">
        <button
          onClick={handleDuplicateClick}
          disabled={duplicating}
          className="px-3 py-1.5 border border-white/10 text-[10px] tracking-[0.15em] uppercase text-white/30 hover:text-white/70 hover:border-white/30 transition-colors disabled:opacity-30"
        >
          {duplicating ? '…' : 'Duplicate'}
        </button>
        <button
          onClick={handleDeleteClick}
          className={`px-3 py-1.5 border text-[10px] tracking-[0.15em] uppercase transition-colors ${
            confirmDelete
              ? 'border-red-500/50 text-red-400/80'
              : 'border-white/10 text-white/20 hover:text-white/50 hover:border-white/25'
          }`}
        >
          {confirmDelete ? 'Sure?' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="border border-white/10 border-dashed flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-1 h-1 rounded-full bg-white/20" />
      <p className="text-[11px] tracking-[0.3em] uppercase text-white/20">No states yet</p>
      <p className="text-[11px] text-white/15 max-w-xs text-center leading-relaxed">
        Create your first coherence state to begin composing the surface.
      </p>
      <Link
        href="/admin/canvas/new"
        className="mt-2 px-5 py-2.5 border border-white/20 text-[11px] tracking-[0.2em] uppercase text-white/50 hover:text-white hover:border-white/50 transition-colors"
      >
        + New State
      </Link>
    </div>
  )
}
