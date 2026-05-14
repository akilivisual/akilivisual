'use client'

import { useRef, useState, useEffect } from 'react'
import type { PlacementWithModule } from '@/lib/schema/types'

interface Props {
  placements: PlacementWithModule[]
  selectedId: string | null
  onSelect: (placement: PlacementWithModule) => void
  onCommit: (placementId: string, x: number, y: number) => void
}

const LAYER_Z: Record<string, number> = { background: 1, midground: 2, foreground: 3 }

export function CanvasEditor({ placements, selectedId, onSelect, onCommit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onSelect(null as unknown as PlacementWithModule)
  }

  const sorted = [...placements].sort(
    (a, b) => (LAYER_Z[a.depth_layer ?? 'midground'] ?? 2) - (LAYER_Z[b.depth_layer ?? 'midground'] ?? 2)
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#050505] overflow-hidden select-none"
      onClick={handleBackdropClick}
    >
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '10% 10%',
        }}
      />
      {/* Center axes */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06] pointer-events-none" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.06] pointer-events-none" />

      {sorted.map((placement) => (
        <ModuleCard
          key={placement.id}
          placement={placement}
          selected={selectedId === placement.id}
          containerRef={containerRef}
          onSelect={() => onSelect(placement)}
          onCommit={(x, y) => onCommit(placement.id, x, y)}
        />
      ))}
    </div>
  )
}

function ModuleCard({
  placement,
  selected,
  containerRef,
  onSelect,
  onCommit,
}: {
  placement: PlacementWithModule
  selected: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onCommit: (x: number, y: number) => void
}) {
  const mod = placement.module
  const pos = (placement.position ?? {}) as Record<string, number>
  const hidden = !!((mod.props as Record<string, unknown>)?.hidden)
  const isAtmosphere = mod.module_type === 'atmosphere'

  const [localX, setLocalX] = useState(pos.x ?? 0)
  const [localY, setLocalY] = useState(pos.y ?? 0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  useEffect(() => {
    if (!dragging) {
      setLocalX(pos.x ?? 0)
      setLocalY(pos.y ?? 0)
    }
  }, [pos.x, pos.y, dragging])

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    if (isAtmosphere) return

    startRef.current = { mx: e.clientX, my: e.clientY, px: localX, py: localY }
    setDragging(true)

    function handleMove(ev: MouseEvent) {
      if (!startRef.current || !containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - startRef.current.mx) / width) * 100
      const dy = ((ev.clientY - startRef.current.my) / height) * 100
      setLocalX(startRef.current.px + dx)
      setLocalY(startRef.current.py + dy)
    }

    function handleUp(ev: MouseEvent) {
      if (!startRef.current || !containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - startRef.current.mx) / width) * 100
      const dy = ((ev.clientY - startRef.current.my) / height) * 100
      const nx = Math.round((startRef.current.px + dx) * 10) / 10
      const ny = Math.round((startRef.current.py + dy) * 10) / 10
      setLocalX(nx)
      setLocalY(ny)
      onCommit(nx, ny)
      setDragging(false)
      startRef.current = null
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  const depthDot: Record<string, string> = {
    background: 'bg-white/20',
    midground: 'bg-white/45',
    foreground: 'bg-white/80',
  }

  // Atmosphere: full-canvas overlay with color preview
  if (isAtmosphere) {
    const props = mod.props as Record<string, unknown>
    const bg = (props.background as string) ?? '#000000'
    const gc = (props.gradient_colors as string[]) ?? []
    const atmStyle = gc.length >= 2
      ? { background: `linear-gradient(135deg, ${gc[0]}, ${gc[1]})` }
      : { background: bg }

    return (
      <div
        className={`absolute inset-4 border transition-all pointer-events-auto overflow-hidden ${
          selected ? 'border-white/30' : 'border-white/[0.06] hover:border-white/15'
        } ${hidden ? 'opacity-30' : ''}`}
        style={{ zIndex: LAYER_Z[placement.depth_layer ?? 'midground'] ?? 2 }}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color preview as subtle background */}
        <div className="absolute inset-0 opacity-20" style={atmStyle} />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm border border-white/20" style={atmStyle} />
          <span className="text-[10px] tracking-[0.15em] uppercase text-white/40">
            {mod.name ?? mod.module_type}
          </span>
          <span className="text-[9px] tracking-[0.1em] uppercase text-white/20 border border-white/[0.08] px-1.5 py-0.5">
            atmosphere
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`absolute pointer-events-auto transition-opacity ${hidden ? 'opacity-30' : ''} ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `calc(50% + ${localX}%)`,
        top: `calc(50% + ${localY}%)`,
        transform: 'translate(-50%, -50%)',
        zIndex: dragging ? 50 : (LAYER_Z[placement.depth_layer ?? 'midground'] ?? 2),
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`border transition-all overflow-hidden ${
          selected
            ? 'border-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.7)]'
            : 'border-white/20 hover:border-white/35'
        } ${dragging ? 'shadow-[0_16px_48px_rgba(0,0,0,0.85)]' : ''}`}
        style={{ minWidth: 180 }}
      >
        {/* Media / color preview */}
        <ModulePreview module={mod} />

        {/* Label row */}
        <div className="px-3 py-2.5 bg-black/60">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${depthDot[placement.depth_layer ?? 'midground']}`} />
            <span className="text-[11px] tracking-wide text-white/80 truncate max-w-[200px]">
              {mod.name ?? mod.module_type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-[0.1em] uppercase text-white/25 border border-white/[0.08] px-1.5 py-0.5">
              {mod.module_type}
            </span>
            <span className="text-[9px] text-white/15 font-mono tabular-nums">
              {localX.toFixed(1)}, {localY.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Selection handles */}
      {selected && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 border border-white/60 bg-[#080808]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border border-white/60 bg-[#080808]" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border border-white/60 bg-[#080808]" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border border-white/60 bg-[#080808]" />
        </>
      )}
    </div>
  )
}

function ModulePreview({ module: mod }: { module: PlacementWithModule['module'] }) {
  const props = mod.props as Record<string, unknown>

  // Find first actor with renderable content
  const mediaActor = mod.actors.find(a => a.actor_type === 'media' || a.actor_type === 'image')
  const orbActor = mod.actors.find(a => a.actor_type === 'orb')
  const textActor = mod.actors.find(a => a.actor_type === 'text' || a.actor_type === 'logo')

  if (mediaActor) {
    const vs = (mediaActor.visual_schema ?? {}) as Record<string, unknown>
    const src = vs.src as string
    if (src) {
      const isVideo = (vs.media_type as string) === 'video' || src.match(/\.(mp4|webm|mov)$/i)
      if (isVideo) {
        return (
          <video
            src={src}
            className="w-full h-24 object-cover block"
            muted
            playsInline
            preload="metadata"
          />
        )
      }
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt="" className="w-full h-24 object-cover block" />
    }
  }

  if (mod.module_type === 'text_block') {
    const text = (props.text as string ?? '').replace(/<[^>]+>/g, '').slice(0, 80)
    const color = (props.color as string) ?? '#ffffff'
    if (text) {
      return (
        <div className="px-3 pt-3 pb-1 min-h-[2.5rem]">
          <p className="text-[12px] leading-snug line-clamp-2" style={{ color }}>
            {text}
          </p>
        </div>
      )
    }
  }

  if (orbActor) {
    const vs = (orbActor.visual_schema ?? {}) as Record<string, unknown>
    const color = (vs.color as string) ?? '#ffffff'
    return (
      <div className="flex items-center gap-3 px-3 pt-3 pb-1">
        <div
          className="w-8 h-8 rounded-full shrink-0"
          style={{ backgroundColor: color, filter: 'blur(4px)', boxShadow: `0 0 16px ${color}60` }}
        />
        <span className="text-[10px] text-white/30 font-mono">{color}</span>
      </div>
    )
  }

  if (textActor) {
    const vs = (textActor.visual_schema ?? {}) as Record<string, unknown>
    const text = (vs.text as string) ?? ''
    const color = (vs.color as string) ?? '#ffffff'
    if (text) {
      return (
        <div className="px-3 pt-3 pb-1">
          <p className="text-[13px] truncate" style={{ color }}>{text}</p>
        </div>
      )
    }
  }

  if (mod.module_type === 'embed') {
    const embedType = (props.embed_type as string) ?? 'iframe'
    const url = (props.url as string) ?? ''
    return (
      <div className="px-3 pt-3 pb-1 flex items-center gap-2">
        <span className="text-[9px] tracking-[0.1em] uppercase text-white/30 border border-white/[0.08] px-1.5 py-0.5">{embedType}</span>
        {url && <span className="text-[9px] text-white/20 truncate max-w-[140px]">{url.replace(/^https?:\/\//, '')}</span>}
      </div>
    )
  }

  // Fallback: actor color swatches
  const colorActors = mod.actors.filter(a => {
    const vs = (a.visual_schema ?? {}) as Record<string, unknown>
    return !!vs.color
  })
  if (colorActors.length > 0) {
    return (
      <div className="flex gap-1 px-3 pt-3 pb-1">
        {colorActors.slice(0, 6).map(a => {
          const color = ((a.visual_schema ?? {}) as Record<string, unknown>).color as string
          return <div key={a.id} className="w-4 h-4 rounded-sm border border-white/10" style={{ backgroundColor: color }} />
        })}
      </div>
    )
  }

  return null
}
