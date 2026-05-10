import { adminFetchAllPersonas } from '@/lib/supabase/admin'
import type { Persona } from '@/lib/schema/types'

export const dynamic = 'force-dynamic'

export default async function PersonasPage() {
  let personas: Persona[] = []
  try { personas = await adminFetchAllPersonas() } catch {}

  return (
    <div className="px-10 py-10">
      <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Runtime</p>
      <h1 className="text-2xl font-light tracking-wide text-white mb-10">Personas</h1>

      {personas.length === 0 ? (
        <div className="border border-white/10 border-dashed flex items-center justify-center py-24">
          <p className="text-[11px] tracking-[0.25em] uppercase text-white/15">No personas yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {personas.map((p) => (
            <div key={p.id} className="border border-white/10 bg-white/[0.02] px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-sm text-white">{p.name}</span>
                <p className="text-[10px] text-white/30 mt-0.5">{p.slug}</p>
              </div>
              <span className="text-[10px] tracking-[0.15em] uppercase text-white/20 border border-white/10 px-2 py-0.5">
                {p.memory_enabled ? 'memory on' : 'memory off'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
