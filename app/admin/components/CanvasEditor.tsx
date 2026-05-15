'use client'

import { useRef, useState, useEffect } from 'react'
import type { PlacementWithModule } from '@/lib/schema/types'

interface Props {
  placements: PlacementWithModule[]
  selectedId: string | null
  onSelect: (placement: PlacementWithModule) => void
  onCommit: (placementId: string, x: number, y: number, width?: number, height?: number, rotate?: number) => void
  onDelete: (placementId: string) => void
}

export function CanvasEditor({ placements, selectedId, onSelect, onCommit, onDelete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onSelect(null as unknown as PlacementWithModule)
  }

  // Sort by order_index ascending — index 0 is background (lowest z), last is foreground (highest z)
  const sorted = [...placements].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

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

      {sorted.map((placement, sortedIndex) => (
        <ModuleCard
          key={placement.id}
          placement={placement}
          layerIndex={sortedIndex}
          selected={selectedId === placement.id}
          containerRef={containerRef}
          onSelect={() => onSelect(placement)}
          onCommit={(x, y, w, h, r) => onCommit(placement.id, x, y, w, h, r)}
          onDelete={() => onDelete(placement.id)}
        />
      ))}
    </div>
  )
}

function ModuleCard({
  placement,
  layerIndex,
  selected,
  containerRef,
  onSelect,
  onCommit,
  onDelete,
}: {
  placement: PlacementWithModule
  layerIndex: number
  selected: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onCommit: (x: number, y: number, width?: number, height?: number, rotate?: number) => void
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
  const [localRotate, setLocalRotate] = useState(pos.rotate ?? 0)
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
      setLocalRotate(pos.rotate ?? 0)
    }
  }, [pos.x, pos.y, pos.width, pos.height, pos.rotate, dragging])

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
      onCommit(nx, ny, localW, localH, localRotate)
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
      onCommit(nx, ny, nw, nh, localRotate)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function handleRotateMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onSelect()

    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    function onMove(ev: MouseEvent) {
      const angle = Math.atan2(ev.clientX - centerX, -(ev.clientY - centerY)) * (180 / Math.PI)
      setLocalRotate(angle)
    }

    function onUp(ev: MouseEvent) {
      const angle = Math.round(Math.atan2(ev.clientX - centerX, -(ev.clientY - centerY)) * (180 / Math.PI) * 10) / 10
      setLocalRotate(angle)
      onCommit(localX, localY, localW, localH, angle)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const hasFullWidth = mod.actors.some(a => !!((a.visual_schema as Record<string, unknown>)?.full_width))
  // Media fills the card whenever the card has been explicitly sized OR actor has full_width
  const fillCard = hasFullWidth || (localW !== undefined && localH !== undefined)

  // Dot brightness reflects layer depth — dimmer = further back
  const dotOpacity = `rgba(255,255,255,${Math.min(0.2 + layerIndex * 0.15, 0.85).toFixed(2)})`

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
        style={{ zIndex: layerIndex + 1 }}
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
      className={`group absolute pointer-events-auto transition-opacity ${hidden ? 'opacity-30' : ''} ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `calc(50% + ${localX}%)`,
        top: `calc(50% + ${localY}%)`,
        transform: `translate(-50%, -50%) rotate(${localRotate}deg)`,
        zIndex: dragging ? 999 : (layerIndex + 1),
        width: localW !== undefined ? `${localW}%` : (hasFullWidth ? '100%' : undefined),
        height: localH !== undefined ? `${localH}%` : (hasFullWidth ? '100%' : undefined),
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Always-visible label strip above card — unobtrusive, not full-canvas */}
      {!fullCanvas && (
        <div className={`absolute -top-5 left-0 right-0 flex items-center gap-1.5 pointer-events-none transition-opacity duration-150 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: dotOpacity }} />
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
            : 'border-transparent hover:border-white/20'
        } ${dragging ? 'shadow-[0_16px_48px_rgba(0,0,0,0.85)]' : ''}`}
        style={{
          minWidth: !hasFullWidth && localW === undefined ? 180 : undefined,
          minHeight: !hasFullWidth && localW === undefined ? 48 : undefined,
        }}
      >
        <ModulePreview module={mod} fillCard={fillCard} />
        {/* Full-canvas: minimal inside-card label + remove (can't go outside — canvas overflow clips it) */}
        {fullCanvas && (
          <>
            <div className="absolute top-2 left-3 z-20 flex items-center gap-1.5 pointer-events-none">
              <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: dotOpacity }} />
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

      {/* Resize + rotate handles — selected only */}
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
              {/* Rotate handle — centered above card */}
              <div className="absolute pointer-events-none z-30 flex flex-col items-center" style={{ left: '50%', top: -34, transform: 'translateX(-50%)' }}>
                <div
                  className="w-3 h-3 rounded-full border border-white/60 bg-[#080808] cursor-crosshair pointer-events-auto"
                  title="Rotate"
                  onMouseDown={handleRotateMouseDown}
                />
                <div className="w-px h-3 bg-white/20" />
              </div>
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
      const isAudio = (vs.media_type as string) === 'audio' || src.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)
      if (isAudio) {
        return (
          <div className="flex items-center gap-2 px-3 py-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 opacity-40">
              <polygon points="2,1 13,7 2,13" fill="currentColor" className="text-white" />
            </svg>
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-[9px] tracking-[0.1em] uppercase text-white/25">audio</span>
          </div>
        )
      }
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
    const raw = (props.text as string) ?? ''
    const color = (props.color as string) ?? '#ffffff'
    const fontSize = Math.min((props.font_size as number) ?? 14, 28)
    const fontWeight = (props.font_weight as string) ?? '300'
    const hasHtml = /<[a-z][\s\S]*>/i.test(raw)
    if (raw) {
      return (
        <div className="px-3 pt-3 pb-1 min-h-[2.5rem] overflow-hidden">
          {hasHtml
            ? <span className="text-[12px] leading-snug line-clamp-3" style={{ color, fontSize, fontWeight }} dangerouslySetInnerHTML={{ __html: raw }} />
            : <p className="text-[12px] leading-snug line-clamp-3" style={{ color, fontSize, fontWeight }}>{raw}</p>
          }
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
    const fontFamily = vs.font_family as string | undefined
    const fontSize = fillCard
      ? ((vs.font_size as number) ?? 14)
      : Math.min((vs.font_size as number) ?? 14, 28)
    const fontWeight = (vs.font_weight as string) ?? '300'
    const hasHtml = /<[a-z][\s\S]*>/i.test(text)
    if (text) {
      const style: React.CSSProperties = {
        color,
        fontSize,
        fontWeight,
        fontFamily: fontFamily && fontFamily !== 'inherit' ? `'${fontFamily}', sans-serif` : undefined,
        lineHeight: 1.3,
      }
      return (
        <div className={`px-3 pt-3 pb-1 overflow-hidden ${fillCard ? 'absolute inset-0 flex items-center justify-center' : ''}`}>
          {hasHtml
            ? <span style={style} dangerouslySetInnerHTML={{ __html: text }} />
            : <span style={style}>{text}</span>
          }
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

  if (mod.module_type === 'gallery') {
    const images = (props.images as string[]) ?? []
    const first = images[0]
    if (first) {
      return (
        <div className={fillCard ? 'absolute inset-0 overflow-hidden' : 'relative w-full overflow-hidden'} style={fillCard ? undefined : { maxHeight: 120 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={first} alt="" className="w-full h-full object-cover block" />
          {images.length > 1 && (
            <span className="absolute bottom-2 right-2 text-[8px] tracking-[0.1em] text-white/50 bg-black/40 px-1.5 py-0.5">
              {images.length}
            </span>
          )}
        </div>
      )
    }
    return (
      <div className="px-3 pt-3 pb-1">
        <span className="text-[9px] tracking-[0.1em] uppercase text-white/20">Gallery — no images yet</span>
      </div>
    )
  }

  if (mod.module_type === 'form') {
    const fields = (props.fields as { label: string }[]) ?? []
    return (
      <div className="px-3 pt-3 pb-2 flex flex-col gap-1.5">
        {fields.slice(0, 3).map((f, i) => (
          <div key={i} className="h-6 border border-white/10 flex items-center px-2">
            <span className="text-[9px] text-white/25">{f.label}</span>
          </div>
        ))}
        {fields.length === 0 && (
          <span className="text-[9px] tracking-[0.1em] uppercase text-white/20">Form — no fields yet</span>
        )}
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
