'use client'

import { useState, useRef, useEffect } from 'react'
import type { KeyframePoint, KeyframeMap } from '@/lib/schema/types'

// ── Props ─────────────────────────────────────────────────────────────

interface KeyframeTimelineProps {
  tracks: KeyframeMap
  duration: number
  delay: number
  loop: boolean
  preset: string
  properties?: (keyof KeyframeMap)[]
  onChangeTracks: (kf: KeyframeMap) => void
  onChangeDuration: (d: number) => void
  onChangeDelay: (d: number) => void
  onChangeLoop: (l: boolean) => void
  onChangePreset: (p: string) => void
}

// ── Track config ──────────────────────────────────────────────────────

const TRACKS_CONFIG: {
  key: keyof KeyframeMap
  label: string
  min: number
  max: number
  step: number
  defaultV: number
  // sensitivity: value change per pixel of vertical drag
  sensitivity: number
  fmt: (v: number) => string
}[] = [
  { key: 'opacity', label: 'opacity', min: 0,    max: 1,    step: 0.01, defaultV: 1,  sensitivity: 0.005, fmt: v => v.toFixed(2) },
  { key: 'scale',   label: 'scale',   min: 0,    max: 3,    step: 0.01, defaultV: 1,  sensitivity: 0.015, fmt: v => v.toFixed(2) },
  { key: 'x',       label: 'x',       min: -500, max: 500,  step: 1,    defaultV: 0,  sensitivity: 2.5,   fmt: v => `${Math.round(v)}` },
  { key: 'y',       label: 'y',       min: -500, max: 500,  step: 1,    defaultV: 0,  sensitivity: 2.5,   fmt: v => `${Math.round(v)}` },
  { key: 'rotate',  label: 'rotate',  min: -360, max: 360,  step: 1,    defaultV: 0,  sensitivity: 3,     fmt: v => `${Math.round(v)}°` },
  { key: 'zIndex',  label: 'z',       min: 0,    max: 100,  step: 1,    defaultV: 0,  sensitivity: 0.5,   fmt: v => `${Math.round(v)}` },
]

export const PRESET_KEYFRAMES: Record<string, KeyframeMap> = {
  phase_in:    { opacity: [{t:0,v:0},{t:1,v:1}], scale: [{t:0,v:0.92},{t:1,v:1}] },
  fade_in:     { opacity: [{t:0,v:0},{t:1,v:1}] },
  slide_up:    { opacity: [{t:0,v:0},{t:1,v:1}], y: [{t:0,v:60},{t:1,v:0}] },
  slide_down:  { opacity: [{t:0,v:0},{t:1,v:1}], y: [{t:0,v:-60},{t:1,v:0}] },
  slide_left:  { opacity: [{t:0,v:0},{t:1,v:1}], x: [{t:0,v:60},{t:1,v:0}] },
  slide_right: { opacity: [{t:0,v:0},{t:1,v:1}], x: [{t:0,v:-60},{t:1,v:0}] },
  scale_in:    { opacity: [{t:0,v:0},{t:1,v:1}], scale: [{t:0,v:0.5},{t:1,v:1}] },
  pulse:       { opacity: [{t:0,v:1},{t:0.5,v:0.2},{t:1,v:1}] },
  none:        {},
}

const LABEL_W = 48   // px — property label column
const HANDLE_W = 8   // px — duration drag handle
const TRACK_H = 24   // px — height of each track row

// ── Component ─────────────────────────────────────────────────────────

export function KeyframeTimeline({
  tracks,
  duration,
  delay,
  loop,
  preset,
  properties,
  onChangeTracks,
  onChangeDuration,
  onChangeDelay,
  onChangeLoop,
  onChangePreset,
}: KeyframeTimelineProps) {
  const [selected, setSelected] = useState<{ key: keyof KeyframeMap; idx: number } | null>(null)
  // tooltip while scrubbing: {key, idx, label}
  const [tooltip, setTooltip] = useState<{ key: keyof KeyframeMap; idx: number; x: number; y: number } | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const dragRef = useRef<{
    key: keyof KeyframeMap
    idx: number
    startX: number
    startY: number
    startT: number
    startV: number
    currentTracks: KeyframeMap
  } | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const visibleTracks = properties
    ? TRACKS_CONFIG.filter(c => properties.includes(c.key))
    : TRACKS_CONFIG

  // ── Helpers ────────────────────────────────────────────────────────

  function getTrackRect() {
    const el = timelineRef.current
    if (!el) return null
    return el.getBoundingClientRect()
  }

  function clientXToT(clientX: number): number {
    const rect = getTrackRect()
    if (!rect) return 0
    const trackW = rect.width - LABEL_W - HANDLE_W
    return Math.max(0, Math.min(1, (clientX - rect.left - LABEL_W) / trackW))
  }

  // ── Preset ─────────────────────────────────────────────────────────

  function handlePresetChange(p: string) {
    onChangePreset(p)
    onChangeTracks(PRESET_KEYFRAMES[p] ?? {})
    setSelected(null)
    setTooltip(null)
  }

  // ── Track click — add keyframe ─────────────────────────────────────

  function handleTrackClick(e: React.MouseEvent, key: keyof KeyframeMap, cfg: typeof TRACKS_CONFIG[0]) {
    if (dragRef.current) return
    const t = clientXToT(e.clientX)
    const track = tracks[key] ?? []
    if (track.some(k => Math.abs(k.t - t) < 0.025)) return
    const newKf: KeyframePoint = { t, v: cfg.defaultV }
    const sorted = [...track, newKf].sort((a, b) => a.t - b.t)
    const newIdx = sorted.indexOf(newKf)
    onChangeTracks({ ...tracks, [key]: sorted })
    setSelected({ key, idx: newIdx })
  }

  // ── Diamond drag — horizontal = time, vertical = value scrub ───────

  function handleDiamondMouseDown(e: React.MouseEvent, key: keyof KeyframeMap, idx: number) {
    e.stopPropagation()
    e.preventDefault()
    setSelected({ key, idx })

    const kfTrack = tracks[key] ?? []
    dragRef.current = {
      key, idx,
      startX: e.clientX,
      startY: e.clientY,
      startT: kfTrack[idx]?.t ?? 0,
      startV: kfTrack[idx]?.v ?? 0,
      currentTracks: tracks,
    }

    function onMove(ev: MouseEvent) {
      const dr = dragRef.current
      if (!dr || !mountedRef.current) return
      const cfg = TRACKS_CONFIG.find(c => c.key === dr.key)!

      const dx = ev.clientX - dr.startX
      const dy = dr.startY - ev.clientY  // inverted: drag up = increase value

      // Horizontal → time position
      const rect = getTrackRect()
      const trackW = rect ? rect.width - LABEL_W - HANDLE_W : 1
      const newT = Math.max(0, Math.min(1, dr.startT + dx / trackW))

      // Vertical → value scrub
      const newV = Math.max(cfg.min, Math.min(cfg.max, dr.startV + dy * cfg.sensitivity))

      const track = [...(dr.currentTracks[dr.key] ?? [])]
      track[dr.idx] = { t: newT, v: newV }
      const updated = { ...dr.currentTracks, [dr.key]: track }
      dr.currentTracks = updated
      onChangeTracks(updated)

      // tooltip position — follow cursor
      if (mountedRef.current) {
        setTooltip({ key: dr.key, idx: dr.idx, x: ev.clientX, y: ev.clientY - 28 })
      }
    }

    function onUp() {
      const dr = dragRef.current
      if (!dr) return

      // Sort track by time after drag ends
      const rawTrack = [...(dr.currentTracks[dr.key] ?? [])]
      const dragged = rawTrack[dr.idx]
      const sortedTrack = rawTrack.slice().sort((a, b) => a.t - b.t)
      const newIdx = sortedTrack.indexOf(dragged)
      const sorted = { ...dr.currentTracks, [dr.key]: sortedTrack }

      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)

      if (!mountedRef.current) return
      onChangeTracks(sorted)
      setSelected({ key: dr.key, idx: newIdx >= 0 ? newIdx : 0 })
      setTooltip(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Duration handle drag ───────────────────────────────────────────

  function handleDurationMouseDown(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const startX = e.clientX
    const startDur = duration
    const rect = getTrackRect()
    const trackW = rect ? rect.width - LABEL_W - HANDLE_W : 200

    function onMove(ev: MouseEvent) {
      if (!mountedRef.current) return
      const dx = ev.clientX - startX
      const newDur = Math.max(0.1, Math.min(30, startDur + (dx / trackW) * startDur))
      onChangeDuration(Math.round(newDur * 10) / 10)
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Delete selected keyframe ───────────────────────────────────────

  function handleDelete(key: keyof KeyframeMap, idx: number) {
    const track = (tracks[key] ?? []).filter((_, i) => i !== idx)
    const updated = { ...tracks }
    if (track.length === 0) delete updated[key]
    else updated[key] = track
    onChangeTracks(updated)
    if (selected?.key === key && selected.idx === idx) setSelected(null)
  }

  // ── Tooltip content ────────────────────────────────────────────────

  const tooltipKf = tooltip ? (tracks[tooltip.key] ?? [])[tooltip.idx] : null
  const tooltipCfg = tooltip ? TRACKS_CONFIG.find(c => c.key === tooltip.key) : null

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 relative">
      {/* Controls row */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] tracking-[0.15em] uppercase text-white/25">Preset</span>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value)}
            className="bg-black border-b border-white/10 text-white/70 text-[11px] py-1 pr-2 focus:outline-none focus:border-white/35"
          >
            {Object.keys(PRESET_KEYFRAMES).map(p => (
              <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] tracking-[0.15em] uppercase text-white/25">Delay</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={delay}
              min={0} max={10} step={0.1}
              onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChangeDelay(v) }}
              className="w-12 bg-transparent border-b border-white/10 text-white/70 text-[11px] py-1 focus:outline-none focus:border-white/35"
            />
            <span className="text-[9px] text-white/20">s</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] tracking-[0.15em] uppercase text-white/25">Loop</span>
          <button
            onClick={() => onChangeLoop(!loop)}
            style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: loop ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
              paddingBottom: 4,
              borderBottom: `1px solid ${loop ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {loop ? 'on' : 'off'}
          </button>
        </div>

        {/* Delete selected */}
        {selected && (
          <button
            onClick={() => handleDelete(selected.key, selected.idx)}
            className="text-[9px] text-white/20 hover:text-red-400/60 transition-colors tracking-[0.08em] pb-1 border-b border-transparent hover:border-red-400/30 ml-auto"
          >
            × remove
          </button>
        )}
      </div>

      {/* Timeline */}
      <div ref={timelineRef} style={{ userSelect: 'none' }}>
        {/* Header: 0s label + duration handle */}
        <div style={{ display: 'flex', paddingLeft: LABEL_W, paddingBottom: 3 }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: HANDLE_W }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>0s</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>{duration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Top border */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

        {/* Track rows */}
        {visibleTracks.map(cfg => {
          const track = tracks[cfg.key] ?? []
          const isSel = selected?.key === cfg.key

          return (
            <div
              key={cfg.key}
              style={{ display: 'flex', alignItems: 'center', height: TRACK_H, cursor: 'crosshair' }}
              onClick={e => handleTrackClick(e, cfg.key, cfg)}
            >
              {/* Property label */}
              <span style={{
                width: LABEL_W, flexShrink: 0,
                fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: isSel ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)',
                userSelect: 'none',
                transition: 'color 0.1s',
              }}>
                {cfg.label}
              </span>

              {/* Track bar */}
              <div style={{ flex: 1, position: 'relative', height: '100%', overflow: 'visible' }}>
                {/* Track background fill */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: isSel ? 'rgba(255,255,255,0.025)' : 'transparent',
                  transition: 'background 0.1s',
                  pointerEvents: 'none',
                }} />

                {/* Center line */}
                <div style={{
                  position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
                  background: isSel ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  pointerEvents: 'none', transition: 'background 0.1s',
                }} />

                {/* Keyframe diamonds */}
                {track.map((kf, i) => {
                  const isKfSel = isSel && selected?.idx === i
                  return (
                    <div
                      key={i}
                      onMouseDown={e => handleDiamondMouseDown(e, cfg.key, i)}
                      title={`${cfg.label}: ${cfg.fmt(kf.v)} @ ${(kf.t * duration).toFixed(2)}s\nDrag ↔ to move · Drag ↕ to scrub value`}
                      style={{
                        position: 'absolute',
                        left: `${kf.t * 100}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                        width: 7, height: 7,
                        border: `1px solid ${isKfSel ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)'}`,
                        background: isKfSel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)',
                        cursor: 'grab',
                        zIndex: 2,
                        transition: 'border-color 0.1s, background 0.1s',
                      }}
                    />
                  )
                })}

                {/* Value labels on all keyframes for selected track */}
                {isSel && track.map((kf, i) => (
                  <span
                    key={`label-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${kf.t * 100}%`,
                      top: '50%',
                      transform: 'translateX(-50%) translateY(-16px)',
                      fontSize: 8,
                      color: selected?.idx === i ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {cfg.fmt(kf.v)}
                  </span>
                ))}

                {/* Empty hint */}
                {track.length === 0 && (
                  <span style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: 'rgba(255,255,255,0.1)', fontStyle: 'italic',
                    pointerEvents: 'none', letterSpacing: '0.04em',
                  }}>
                    click to add
                  </span>
                )}
              </div>

              {/* Duration handle — only show on first track */}
              {cfg === visibleTracks[0] ? (
                <div
                  onMouseDown={handleDurationMouseDown}
                  title="Drag to set duration"
                  style={{
                    width: HANDLE_W, height: '100%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'ew-resize',
                  }}
                >
                  <div style={{
                    width: 2, height: 14,
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 1,
                  }} />
                </div>
              ) : (
                <div style={{ width: HANDLE_W, flexShrink: 0 }} />
              )}
            </div>
          )
        })}

        {/* Bottom border */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

        {/* Hint */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 5 }}>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.04em', fontStyle: 'italic' }}>
            ↔ time · ↕ value · click track to add
          </span>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.04em' }}>
            ⊣ drag to set duration
          </span>
        </div>
      </div>

      {/* Floating tooltip during scrub */}
      {tooltip && tooltipKf && tooltipCfg && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '3px 8px',
            fontSize: 10,
            color: 'rgba(255,255,255,0.8)',
            letterSpacing: '0.06em',
            pointerEvents: 'none',
            zIndex: 9999,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltipCfg.label} {tooltipCfg.fmt(tooltipKf.v)} @ {(tooltipKf.t * duration).toFixed(2)}s
        </div>
      )}
    </div>
  )
}
