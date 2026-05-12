'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CanvasWithModules } from '@/lib/schema/types'
import { ModuleList } from './ModuleList'
import { DeleteCanvasButton } from './DeleteCanvasButton'

interface CanvasStudioProps {
  canvas: CanvasWithModules
}

export function CanvasStudio({ canvas }: CanvasStudioProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const totalActors = canvas.modules.reduce((n, m) => n + m.actors.length, 0)

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
            ← Canvases
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
            { label: 'Modules', value: canvas.modules.length },
            { label: 'Actors', value: totalActors },
          ].map((s) => (
            <div key={s.label} className="border border-white/10 bg-white/[0.02] px-3 py-3">
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-1">{s.label}</p>
              <p className="text-sm font-light text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Module list */}
        <div className="py-5 flex-1">
          <ModuleList
            modules={canvas.modules}
            canvasId={canvas.id}
            onSaved={() => setRefreshKey((k) => k + 1)}
          />
        </div>

        {/* Resonance profile */}
        {canvas.resonance_profile && Object.keys(canvas.resonance_profile).length > 0 && (
          <div className="px-8 pb-8 shrink-0">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-3">Resonance Profile</p>
            <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
              <pre className="text-[11px] text-white/40 font-mono leading-relaxed overflow-x-auto">
                {JSON.stringify(canvas.resonance_profile, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel — live preview ──────────────────────── */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden">

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-5 z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">Live Preview</span>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="pointer-events-auto px-3 py-1 border border-white/10 text-[10px] tracking-[0.15em] uppercase text-white/25 hover:text-white/60 hover:border-white/25 transition-colors"
          >
            ↺ Refresh
          </button>
        </div>

        {/* Canvas iframe */}
        <iframe
          key={refreshKey}
          src={`/preview/${canvas.slug}`}
          className="w-full h-full border-none"
          title={canvas.title}
          allow="autoplay"
        />
      </div>

    </div>
  )
}
