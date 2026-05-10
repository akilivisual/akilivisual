import Link from 'next/link'
import { notFound } from 'next/navigation'
import { adminFetchCanvas } from '@/lib/supabase/admin'
import { ModuleList } from '@/app/admin/components/ModuleList'

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
    <div className="px-10 py-10 min-h-screen">
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

          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 border border-white/15 text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white hover:border-white/40 transition-colors"
          >
            Preview →
          </Link>
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

      {/* Draggable module list */}
      <ModuleList modules={canvas.modules} />

      {/* Resonance profile */}
      {canvas.resonance_profile && Object.keys(canvas.resonance_profile).length > 0 && (
        <div className="mt-10 pb-10">
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
