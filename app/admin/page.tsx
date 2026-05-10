import Link from 'next/link'
import { adminFetchAllCanvases } from '@/lib/supabase/admin'
import type { CanvasWithModules } from '@/lib/schema/types'
import { SeedButton } from './components/SeedButton'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  let canvases: CanvasWithModules[] = []

  try {
    canvases = await adminFetchAllCanvases()
  } catch {
    // env vars not set yet — show empty state
  }

  const totalModules = canvases.reduce((n, c) => n + c.modules.length, 0)
  const totalActors = canvases.reduce((n, c) =>
    n + c.modules.reduce((m, mod) => m + mod.actors.length, 0), 0)

  return (
    <div className="px-10 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Runtime</p>
          <h1 className="text-2xl font-light tracking-wide text-white">Canvases</h1>
        </div>
        <div className="flex items-center gap-3">
          <SeedButton />
          <Link
            href="/admin/canvas/new"
            className="px-4 py-2 border border-white/20 text-[11px] tracking-[0.2em] uppercase text-white/60 hover:text-white hover:border-white/50 transition-colors"
          >
            + New Canvas
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Canvases', value: canvases.length },
          { label: 'Modules', value: totalModules },
          { label: 'Actors', value: totalActors },
        ].map((stat) => (
          <div key={stat.label} className="border border-white/10 px-6 py-5 bg-white/[0.02]">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-2">{stat.label}</p>
            <p className="text-3xl font-light text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Canvas list */}
      {canvases.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2">
          {canvases.map((canvas) => (
            <CanvasRow key={canvas.id} canvas={canvas} />
          ))}
        </div>
      )}
    </div>
  )
}

function CanvasRow({ canvas }: { canvas: CanvasWithModules }) {
  const actorCount = canvas.modules.reduce((n, m) => n + m.actors.length, 0)
  const moduleTypes = canvas.modules.map((m) => m.module_type)

  return (
    <Link href={`/admin/canvas/${canvas.slug}`}>
      <div className="group flex items-center justify-between border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 px-6 py-5 transition-all">
        {/* Left */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span className="text-sm tracking-wide text-white">{canvas.title}</span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/25 border border-white/10 px-2 py-0.5">
              {canvas.canvas_type}
            </span>
          </div>
          <p className="text-[11px] tracking-[0.1em] text-white/30">{canvas.slug}</p>
        </div>

        {/* Center — module types */}
        <div className="flex gap-2">
          {moduleTypes.map((type, i) => (
            <span
              key={i}
              className="text-[10px] tracking-[0.15em] uppercase text-white/25 border border-white/[0.08] px-2 py-1"
            >
              {type}
            </span>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/20 mb-0.5">Modules</p>
            <p className="text-sm text-white/60">{canvas.modules.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/20 mb-0.5">Actors</p>
            <p className="text-sm text-white/60">{actorCount}</p>
          </div>
          <span className="text-white/20 group-hover:text-white/60 transition-colors text-sm">→</span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="border border-white/10 border-dashed flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-1 h-1 rounded-full bg-white/20" />
      <p className="text-[11px] tracking-[0.3em] uppercase text-white/20">No canvases yet</p>
      <p className="text-[11px] text-white/15 max-w-xs text-center leading-relaxed">
        Seed Canvas_0001 to boot the runtime — atmosphere, logo, and two pulsing orbs.
      </p>
      <div className="mt-2">
        <SeedButton />
      </div>
    </div>
  )
}
