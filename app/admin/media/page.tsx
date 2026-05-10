import { adminFetchAllMedia } from '@/lib/supabase/admin'
import type { MediaAsset } from '@/lib/schema/types'

export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  let assets: MediaAsset[] = []
  try { assets = await adminFetchAllMedia() } catch {}

  return (
    <div className="px-10 py-10">
      <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Runtime</p>
      <h1 className="text-2xl font-light tracking-wide text-white mb-10">Media</h1>

      {assets.length === 0 ? (
        <div className="border border-white/10 border-dashed flex items-center justify-center py-24">
          <p className="text-[11px] tracking-[0.25em] uppercase text-white/15">No media assets yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {assets.map((a) => (
            <div key={a.id} className="border border-white/10 bg-white/[0.02] px-5 py-4">
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-1">{a.asset_type}</p>
              <p className="text-sm text-white">{a.title ?? 'Untitled'}</p>
              <p className="text-[10px] text-white/25 mt-1 truncate">{a.url}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
