import { notFound } from 'next/navigation'
import { adminFetchCanvas, adminFetchAllAlbums } from '@/lib/supabase/admin'
import { CanvasStudio } from '@/app/admin/components/CanvasStudio'
import { NewCanvasForm } from '@/app/admin/components/NewCanvasForm'
import type { Album } from '@/lib/schema/types'

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
  let albums: Album[] = []
  try {
    ;[canvas, albums] = await Promise.all([adminFetchCanvas(slug), adminFetchAllAlbums()])
  } catch {
    // env not set
  }

  if (!canvas) notFound()

  return <CanvasStudio canvas={canvas} albums={albums} />
}
