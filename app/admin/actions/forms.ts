'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'

export async function submitFormAction(
  moduleId: string,
  data: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase
    .from('form_submissions')
    .insert({ module_id: moduleId, data })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
