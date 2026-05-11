'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'

export async function createMediaAsset(
  url: string,
  assetType: string,
  title: string,
  storagePath?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('media_assets').insert({
    url,
    asset_type: assetType,
    title,
    metadata: storagePath ? { storage_path: storagePath } : {},
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/media')
  return { ok: true }
}

export async function deleteMediaAsset(
  id: string,
  storagePath?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()

  if (storagePath) {
    await supabase.storage.from('media').remove([storagePath])
  }

  const { error } = await supabase.from('media_assets').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/media')
  return { ok: true }
}
