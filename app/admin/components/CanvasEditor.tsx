'use client'

import { useRef, useState, useEffect } from 'react'
import type { PlacementWithModule } from '@/lib/schema/types'

interface Props {
  placements: PlacementWithModule[]
  selectedId: string | null
  onSelect: (placement: PlacementWithModule) => void
  onCommit: (placementId: string, x: number, y: number, width?: number, height?: number) => void
  onDelete: (placementId: string) => void
}

const LAYER_Z: Record<string, number> = { background: 1, midground: 2, foreground: 3 }

export function CanvasEditor({ placements, selectedId, onSelect, onCommit, onDelete }: Props) {
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
          onCommit={(x, y, w, h) => onCommit(placement.id, x, y, w, h)}
          onDelete={() => onDelete(placement.id)}
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
  onDelete,
}: {
  placement: PlacementWithModule
  selected: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onCommit: (x: number, y: number, width?: number, height?: number) => void
  onDelete: () => void
}) {
  const mod = placement.module
  const pos = (placement.position ?? {}) as Record<string, number>
  const hidden = !!((mod.props as Record<string, unknown>)?.hidden)
  const isAtmosphere = mod.module_type === 'atmosphere'

  const [localX, setLocalX] = useState(pos.x ?? 0)
  const [localY, setLocalY] = useState(pos.y ?? 0)
  const [localW, setLocalW] = useState<number | undefined>(pos.width as number | undefined)
  const [localH, setLocalH] = useState<number | undefined>(pos.height as number | undefined)
  const [dragging, setDragging] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  useEffect(() => {
    if (!dragging) {
      setLocalX(pos.x ?? 0)
      setLocalY(pos.y ?? 0)
      setLocalW(pos.width as number | undefined)
      setLocalH(pos.height as number | undefined)
    }
  }, [pos.x, pos.y, pos.width, pos.height, dragging])

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    if (isAtmosphere) return

    dragRef.current = { mx: e.clientX, my: e.clientY, px: localX, py: localY }
    setDragging(true)

    function onMove(ev: MouseEvent) {
      if (!dragRef.current || !containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - dragRef.current.mx) / width) * 100
      const dy = ((ev.clientY - dragRef.current.my) / height) * 100
      setLocalX(dragRef.current.px + dx)
      setLocalY(dragRef.current.py + dy)
    }

    function onUp(ev: MouseEvent) {
      if (!dragRef.current || !containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - dragRef.current.mx) / width) * 100
      const dy = ((ev.clientY - dragRef.current.my) / height) * 100
      const nx = Math.round((dragRef.current.px + dx) * 10) / 10
      const ny = Math.round((dragRef.current.py + dy) * 10) / 10
      setLocalX(nx)
      setLocalY(ny)
      onCommit(nx, ny, localW, localH)
      setDragging(false)
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // corner: 'tl' | 'tr' | 'bl' | 'br'
  // Width sign: right corners +dx, left corners -dx
  // Height sign: bottom corners +dy, top corners -dy
  // Center always moves by (dx/2, dy/2)
  function handleResizeMouseDown(corner: 'tl' | 'tr' | 'bl' | 'br', e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const container = containerRef.current
    const card = cardRef.current
    if (!container || !card) return

    const cRect = container.getBoundingClientRect()
    const kRect = card.getBoundingClientRect()
    const startW = (kRect.width / cRect.width) * 100
    const startH = (kRect.height / cRect.height) * 100
    const startX = localX
    const startY = localY
    const startMX = e.clientX
    const startMY = e.clientY
    const xSign = corner.includes('r') ? 1 : -1
    const ySign = corner.includes('b') ? 1 : -1

    function onMove(ev: MouseEvent) {
      const dx = ((ev.clientX - startMX) / cRect.width) * 100
      const dy = ((ev.clientY - startMY) / cRect.height) * 100
      setLocalW(Math.max(5, startW + xSign * dx))
      setLocalH(Math.max(5, startH + ySign * dy))
      setLocalX(startX + dx / 2)
      setLocalY(startY + dy / 2)
    }

    function onUp(ev: MouseEvent) {
      const dx = ((ev.clientX - startMX) / cRect.width) * 100
      const dy = ((ev.clientY - startMY) / cRect.height) * 100
      const nw = Math.max(5, startW + xSign * dx)
      const nh = Math.max(5, startH + ySign * dy)
      const nx = Math.round((startX + dx / 2) * 10) / 10
      const ny = Math.round((startY + dy / 2) * 10) / 10
      setLocalW(nw)
      setLocalH(nh)
      setLocalX(nx)
      setLocalY(ny)
      onCommit(nx, ny, nw, nh)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const hasFullWidth = mod.actors.some(a => !!((a.visual_schema as Record<string, unknown>)?.full_width))
  // Media fills the card whenever the card has been explicitly sized OR actor has full_width
  const fillCard = hasFullWidth || (localW !== undefined && localH !== undefined)

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
        {selected && (
          <button
            className="absolute top-2 right-2 text-[9px] tracking-[0.1em] uppercase px-2 py-1 border border-red-500/30 text-red-400/60 hover:text-red-400 hover:border-red-500/60 transition-colors pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          >
            Remove
          </button>
        )}
      </div>
    )
  }

  const fullCanvas = hasFullWidth && localW === undefined
  const handleClass = `w-3 h-3 border border-white/60 bg-[#080808] pointer-events-auto absolute`

  return (
    <div
      className={`absolute pointer-events-auto transition-opacity ${hidden ? 'opacity-30' : ''} ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `calc(50% + ${localX}%)`,
        top: `calc(50% + ${localY}%)`,
        transform: 'translate(-50%, -50%)',
        zIndex: dragging ? 50 : (LAYER_Z[placement.depth_layer ?? 'midground'] ?? 2),
        width: localW !== undefined ? `${localW}%` : (hasFullWidth ? '100%' : undefined),
        height: localH !== undefined ? `${localH}%` : (hasFullWidth ? '100%' : undefined),
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Always-visible label strip above card — unobtrusive, not full-canvas */}
      {!fullCanvas && (
        <div className="absolute -top-5 left-0 right-0 flex items-center gap-1.5 pointer-events-none">
          <div className={`w-1 h-1 rounded-full shrink-0 ${depthDot[placement.depth_layer ?? 'midground']}`} />
          <span className="text-[9px] text-white/30 truncate flex-1 min-w-0">
            {mod.name ?? mod.module_type}
          </span>
          <span className="text-[9px] tracking-[0.1em] uppercase text-white/15 border border-white/[0.06] px-1 py-px leading-none">
            {mod.module_type}
          </span>
          <span className="text-[9px] text-white/15 font-mono tabular-nums">
            {localX.toFixed(1)}, {localY.toFixed(1)}
            {localW !== undefined && ` · ${localW.toFixed(0)}×${localH?.toFixed(0)}%`}
          </span>
          {selected && (
            <button
              className={`pointer-events-auto shrink-0 text-[9px] tracking-[0.1em] uppercase px-2 py-px border transition-colors ${
                confirmDelete ? 'border-red-500/60 text-red-400' : 'border-white/20 text-white/30 hover:text-red-400/70 hover:border-red-500/30'
              }`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                if (confirmDelete) { onDelete() }
                else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
              }}
            >
              {confirmDelete ? 'Sure?' : 'Remove'}
            </button>
          )}
        </div>
      )}

      <div
        ref={cardRef}
        className={`relative border transition-all overflow-hidden w-full h-full ${
          selected
            ? 'border-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.7)]'
            : 'border-white/20 hover:border-white/35'
        } ${dragging ? 'shadow-[0_16px_48px_rgba(0,0,0,0.85)]' : ''}`}
        style={{
          minWidth: !hasFullWidth && localW === undefined ? 180 : undefined,
        }}
      >
        <ModulePreview module={mod} fillCard={fillCard} />
        {/* Full-canvas: minimal inside-card label + remove (can't go outside — canvas overflow clips it) */}
        {fullCanvas && (
          <>
            <div className="absolute top-2 left-3 z-20 flex items-center gap-1.5 pointer-events-none">
              <div className={`w-1 h-1 rounded-full shrink-0 ${depthDot[placement.depth_layer ?? 'midground']}`} />
              <span className="text-[9px] text-white/30 truncate max-w-[200px]">
                {mod.name ?? mod.module_type}
              </span>
            </div>
            {selected && (
              <button
                className={`absolute top-2 right-3 z-20 text-[9px] tracking-[0.1em] uppercase px-2 py-px border transition-colors pointer-events-auto ${
                  confirmDelete ? 'border-red-500/60 text-red-400' : 'border-white/20 text-white/40 hover:text-red-400/70 hover:border-red-500/30'
                }`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirmDelete) { onDelete() }
                  else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
                }}
              >
                {confirmDelete ? 'Sure?' : 'Remove'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Resize handles — selected only */}
      {selected && (
        <>
          {fullCanvas ? (
            <>
              <div className={`${handleClass} top-1 left-1 cursor-nw-resize`} onMouseDown={(e) => handleResizeMouseDown('tl', e)} />
              <div className={`${handleClass} top-1 right-1 cursor-ne-resize`} onMouseDown={(e) => handleResizeMouseDown('tr', e)} />
              <div className={`${handleClass} bottom-1 left-1 cursor-sw-resize`} onMouseDown={(e) => handleResizeMouseDown('bl', e)} />
              <div className={`${handleClass} bottom-1 right-1 cursor-se-resize`} onMouseDown={(e) => handleResizeMouseDown('br', e)} />
            </>
          ) : (
            <>
              <div className={`${handleClass} -top-1.5 -left-1.5 cursor-nw-resize`} onMouseDown={(e) => handleResizeMouseDown('tl', e)} />
              <div className={`${handleClass} -top-1.5 -right-1.5 cursor-ne-resize`} onMouseDown={(e) => handleResizeMouseDown('tr', e)} />
              <div className={`${handleClass} -bottom-1.5 -left-1.5 cursor-sw-resize`} onMouseDown={(e) => handleResizeMouseDown('bl', e)} />
              <div className={`${handleClass} -bottom-1.5 -right-1.5 cursor-se-resize`} onMouseDown={(e) => handleResizeMouseDown('br', e)} />
            </>
          )}
        </>
      )}
    </div>
  )
}

function ModulePreview({ module: mod, fillCard }: { module: PlacementWithModule['module']; fillCard?: boolean }) {
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
      if (fillCard) {
        // Fill the card — mirrors runtime rendering
        if (isVideo) {
          return (
            <video
              src={src}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              playsInline
              preload="metadata"
            />
          )
        }
        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )
      }
      // Thumbnail mode — no explicit size set
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
      return <img src={src} alt="" className="w-full block" style={{ objectFit: 'contain', maxHeight: 160 }} />
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
