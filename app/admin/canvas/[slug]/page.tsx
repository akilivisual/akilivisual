import { notFound } from 'next/navigation'
import { adminFetchCanvas } from '@/lib/supabase/admin'
import { CanvasStudio } from '@/app/admin/components/CanvasStudio'

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

  return <CanvasStudio canvas={canvas} />
}

function NewCanvasPlaceholder() {
  return (
    <div className="px-10 py-10">
      <h1 className="text-2xl font-light tracking-wide text-white mb-2">New Canvas</h1>
      <p className="text-[11px] text-white/25 tracking-wide">Canvas creation — coming next.</p>
    </div>
  )
}
