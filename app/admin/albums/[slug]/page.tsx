import { notFound } from 'next/navigation'
import { adminFetchAlbumWithStates, adminFetchAllCanvases } from '@/lib/supabase/admin'
import { AlbumEditor } from '@/app/admin/components/AlbumEditor'

export default async function AlbumDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [album, allCanvases] = await Promise.all([
    adminFetchAlbumWithStates(slug),
    adminFetchAllCanvases(),
  ])
  if (!album) notFound()

  const assignedIds = new Set(album.states.map(s => s.id))
  const unassigned = allCanvases.filter(c => !assignedIds.has(c.id) && !c.album_id)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-baseline gap-4">
        <a href="/admin/albums" className="text-[9px] tracking-[0.2em] uppercase text-white/20 hover:text-white/40 transition-colors">
          ← Albums
        </a>
        <h1 className="text-sm font-light tracking-[0.3em] uppercase text-white/60">{album.title}</h1>
        {album.theme && (
          <span className="text-[9px] tracking-[0.15em] uppercase text-white/25">{album.theme}</span>
        )}
      </div>
      <AlbumEditor album={album} unassignedStates={unassigned} />
    </div>
  )
}
