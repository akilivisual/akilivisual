'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const actorCount = canvas.placements.reduce((n, p) => n + p.module.actors.length, 0)
  const moduleTypes = canvas.placements.map(p => p.module.module_type)

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  async function handleDuplicateClick() {
    setDuplicating(true)
    setMenuOpen(false)
    await onDuplicate(canvas.id)
    setDuplicating(false)
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      setMenuOpen(false)
      onDelete(canvas.id)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <div className="flex items-center border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all">

      {/* Three-dot trigger */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={() => { setMenuOpen(o => !o); setConfirmDelete(false) }}
          className={`flex flex-col items-center justify-center gap-[3px] w-10 h-full min-h-[64px] px-3 border-r border-white/[0.06] transition-colors ${
            menuOpen ? 'text-white/70' : 'text-white/20 hover:text-white/50'
          }`}
          aria-label="State actions"
        >
          <span className="w-[3px] h-[3px] rounded-full bg-current block" />
          <span className="w-[3px] h-[3px] rounded-full bg-current block" />
          <span className="w-[3px] h-[3px] rounded-full bg-current block" />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 w-40 bg-[#0e0e0e] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)] py-1">
            <Link
              href={`/admin/canvas/${canvas.slug}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-[11px] tracking-[0.15em] uppercase text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDuplicateClick}
              disabled={duplicating}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] tracking-[0.15em] uppercase text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-30"
            >
              {duplicating ? '…' : 'Duplicate'}
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <button
              onClick={handleDeleteClick}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] tracking-[0.15em] uppercase transition-colors ${
                confirmDelete
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {confirmDelete ? 'Sure?' : 'Delete'}
            </button>
          </div>
        )}
      </div>

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
          <span className="text-white/20 text-sm">→</span>
        </div>
      </Link>

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
