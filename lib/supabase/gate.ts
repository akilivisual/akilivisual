import { getSupabase } from './client'

export interface GateConfig {
  image_url: string | null
  title: string | null
  subtitle: string | null
}

export async function fetchGateConfig(): Promise<GateConfig | null> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('gate_config')
    .select('image_url, title, subtitle')
    .eq('id', 'default')
    .single()
  return (data as GateConfig | null) ?? null
}
