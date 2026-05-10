import Link from 'next/link'
import { notFound } from 'next/navigation'
import { adminFetchCanvas } from '@/lib/supabase/admin'
import type { ModuleWithActors, Actor } from '@/lib/schema/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CanvasInspector({ params }: Props) {
  const { slug } = await params

  if (slug === 'new') {
    return <NewCanvasPlaceholder />
  }

  let canvas = null
  try {
    canvas = await adminFetchCanvas(slug)
  } catch {
    // env not set
  }

  if (!canvas) notFound()

  const totalActors = canvas.modules.reduce((n, m) => n + m.actors.length, 0)

  return (
    <div className="px-10 py-10">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/admin"
          className="text-[10px] tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors mb-6 inline-block"
        >
          ← Canvases
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">{canvas.canvas_type}</p>
            <h1 className="text-2xl font-light tracking-wide text-white">{canvas.title}</h1>
            <p className="text-[11px] tracking-[0.1em] text-white/30 mt-1">{canvas.slug}</p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/?canvas=${canvas.slug}`}
              target="_blank"
              className="px-4 py-2 border border-white/15 text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white hover:border-white/40 transition-colors"
            >
              Preview →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {[
          { label: 'Background', value: canvas.background_type },
          { label: 'Order', value: canvas.order_index },
          { label: 'Modules', value: canvas.modules.length },
          { label: 'Actors', value: totalActors },
        ].map((s) => (
          <div key={s.label} className="border border-white/10 bg-white/[0.02] px-5 py-4">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-1.5">{s.label}</p>
            <p className="text-lg font-light text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Module tree */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30">
          Modules ({canvas.modules.length})
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {canvas.modules.length === 0 ? (
          <EmptyModules />
        ) : (
          canvas.modules.map((mod, i) => (
            <ModuleRow key={mod.id} module={mod} index={i} />
          ))
        )}
      </div>

      {/* Resonance profile */}
      {canvas.resonance_profile && Object.keys(canvas.resonance_profile).length > 0 && (
        <div className="mt-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-3">Resonance Profile</p>
          <div className="border border-white/10 bg-white/[0.02] px-6 py-4">
            <pre className="text-[11px] text-white/40 font-mono leading-relaxed">
              {JSON.stringify(canvas.resonance_profile, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function ModuleRow({ module, index }: { module: ModuleWithActors; index: number }) {
  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Module header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-white/20 w-5">{index + 1}</span>
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

        <span className="text-[10px] tracking-[0.15em] uppercase text-white/25">
          {module.actors.length} {module.actors.length === 1 ? 'actor' : 'actors'}
        </span>
      </div>

      {/* Actors */}
      {module.actors.length > 0 && (
        <div className="divide-y divide-white/[0.04]">
          {module.actors.map((actor, i) => (
            <ActorRow key={actor.id} actor={actor} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function ActorRow({ actor, index }: { actor: Actor; index: number }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 pl-14 bg-white/[0.01]">
      <span className="text-[10px] text-white/15 w-4">{index + 1}</span>
      <div className="flex-1 flex items-center gap-4">
        <span className="text-[11px] tracking-wide text-white/60">
          {actor.name ?? actor.actor_type}
        </span>
        <span className="text-[10px] tracking-[0.15em] uppercase text-white/20 border border-white/[0.08] px-2 py-0.5">
          {actor.actor_type}
        </span>
      </div>

      {/* Visual schema preview */}
      {actor.visual_schema && Object.keys(actor.visual_schema).length > 0 && (
        <div className="flex gap-3 items-center">
          {actor.visual_schema.color && (
            <div
              className="w-3 h-3 rounded-full border border-white/10"
              style={{ backgroundColor: actor.visual_schema.color as string }}
            />
          )}
          {actor.visual_schema.size && (
            <span className="text-[10px] text-white/20">{actor.visual_schema.size as number}px</span>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyModules() {
  return (
    <div className="border border-white/10 border-dashed flex items-center justify-center py-12">
      <p className="text-[11px] tracking-[0.25em] uppercase text-white/15">No modules</p>
    </div>
  )
}

function NewCanvasPlaceholder() {
  return (
    <div className="px-10 py-10">
      <Link
        href="/admin"
        className="text-[10px] tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors mb-6 inline-block"
      >
        ← Canvases
      </Link>
      <h1 className="text-2xl font-light tracking-wide text-white mb-2">New Canvas</h1>
      <p className="text-[11px] text-white/25 tracking-wide">Canvas creation form — coming next.</p>
    </div>
  )
}
