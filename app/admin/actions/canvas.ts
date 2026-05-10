'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'

export async function reorderModules(
  moduleIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()

  const updates = moduleIds.map((id, index) =>
    supabase.from('modules').update({ order_index: index }).eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)

  if (failed?.error) return { ok: false, error: failed.error.message }

  revalidatePath('/admin/canvas/[slug]', 'page')
  return { ok: true }
}
