'use server'

import { getAdminSupabase } from '@/lib/supabase/admin-client'
import type { GateConfig } from '@/lib/supabase/gate'

export async function updateGateConfig(config: Partial<GateConfig>): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminSupabase()
  const { error } = await supabase
    .from('gate_config')
    .upsert({ id: 'default', ...config, updated_at: new Date().toISOString() })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function adminFetchGateConfig(): Promise<GateConfig | null> {
  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('gate_config')
    .select('image_url, title, subtitle')
    .eq('id', 'default')
    .single()
  return (data as GateConfig | null) ?? null
}
