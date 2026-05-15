import { adminFetchAllAlbums } from '@/lib/supabase/admin'
import { AlbumList } from '@/app/admin/components/AlbumList'

export default async function AlbumsPage() {
  const albums = await adminFetchAllAlbums()
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-sm font-light tracking-[0.3em] uppercase text-white/60">Albums</h1>
        <p className="text-[11px] text-white/25 mt-1 tracking-wide">
          Thematic releases — each album sequences states into a coherent cultural transmission.
        </p>
      </div>
      <AlbumList initialAlbums={albums} />
    </div>
  )
}
