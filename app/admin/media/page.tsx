import { adminFetchAllMedia } from '@/lib/supabase/admin'
import type { MediaAsset } from '@/lib/schema/types'
import { MediaLibrary } from '@/app/admin/components/MediaLibrary'

export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  let assets: MediaAsset[] = []
  try { assets = await adminFetchAllMedia() } catch {}
  return <MediaLibrary assets={assets} />
}
