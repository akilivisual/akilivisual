import { notFound } from 'next/navigation'
import { adminFetchCanvas } from '@/lib/supabase/admin'
import { CanvasStudio } from '@/app/admin/components/CanvasStudio'
import { NewCanvasForm } from '@/app/admin/components/NewCanvasForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CanvasInspector({ params }: Props) {
  const { slug } = await params

  if (slug === 'new') {
    return <NewCanvasForm />
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
