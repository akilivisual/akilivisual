import Link from 'next/link'
import { adminFetchAllCanvases } from '@/lib/supabase/admin'
import type { CanvasWithPlacements } from '@/lib/schema/types'
import { StateList } from './components/StateList'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  let canvases: CanvasWithPlacements[] = []

  try {
    canvases = await adminFetchAllCanvases()
  } catch {
    // env vars not set yet — show empty state
  }

  const totalModules = canvases.reduce((n, c) => n + c.placements.length, 0)
  const totalActors = canvases.reduce((n, c) =>
    n + c.placements.reduce((m, p) => m + p.module.actors.length, 0), 0)

  return (
    <div className="px-10 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Runtime</p>
          <h1 className="text-2xl font-light tracking-wide text-white">States</h1>
        </div>
        <Link
          href="/admin/canvas/new"
          className="px-4 py-2 border border-white/20 text-[11px] tracking-[0.2em] uppercase text-white/60 hover:text-white hover:border-white/50 transition-colors"
        >
          + New State
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'States', value: canvases.length },
          { label: 'Modules', value: totalModules },
          { label: 'Actors', value: totalActors },
        ].map((stat) => (
          <div key={stat.label} className="border border-white/10 px-6 py-5 bg-white/[0.02]">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-2">{stat.label}</p>
            <p className="text-3xl font-light text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* States list */}
      <StateList initialCanvases={canvases} />
    </div>
  )
}

