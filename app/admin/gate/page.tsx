import { adminFetchGateConfig } from '@/app/admin/actions/gate'
import { GateEditor } from '@/app/admin/components/GateEditor'

export const dynamic = 'force-dynamic'

export default async function GatePage() {
  let config = null
  try {
    config = await adminFetchGateConfig()
  } catch {
    // table not yet created — show empty editor
  }

  return (
    <div className="px-10 py-10 max-w-xl">
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Runtime</p>
        <h1 className="text-2xl font-light tracking-wide text-white">Entry Gate</h1>
        <p className="text-[11px] text-white/30 mt-2 leading-relaxed">
          The gate is the first thing visitors see. One click unlocks audio for the session and the gate fades away.
        </p>
      </div>
      <GateEditor initial={config} />
    </div>
  )
}
