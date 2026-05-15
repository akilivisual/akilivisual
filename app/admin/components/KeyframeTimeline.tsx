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

// ── Constants ─────────────────────────────────────────────────────────

const TRACKS_CONFIG: {
  key: keyof KeyframeMap
  label: string
  min: number
  max: number
  step: number
  defaultV: number
  fmt: (v: number) => string
}[] = [
  { key: 'opacity', label: 'opacity', min: 0,    max: 1,    step: 0.01, defaultV: 1,  fmt: v => v.toFixed(2) },
  { key: 'scale',   label: 'scale',   min: 0,    max: 3,    step: 0.01, defaultV: 1,  fmt: v => v.toFixed(2) },
  { key: 'x',       label: 'x',       min: -500, max: 500,  step: 1,    defaultV: 0,  fmt: v => `${Math.round(v)}px` },
  { key: 'y',       label: 'y',       min: -500, max: 500,  step: 1,    defaultV: 0,  fmt: v => `${Math.round(v)}px` },
  { key: 'rotate',  label: 'rotate',  min: -360, max: 360,  step: 1,    defaultV: 0,  fmt: v => `${Math.round(v)}°` },
  { key: 'zIndex',  label: 'z',       min: 0,    max: 100,  step: 1,    defaultV: 0,  fmt: v => `${Math.round(v)}` },
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

const LABEL_W = 52  // px

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
  const timelineRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    key: keyof KeyframeMap
    idx: number
    currentTracks: KeyframeMap
  } | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const visibleTracks = properties
    ? TRACKS_CONFIG.filter(c => properties.includes(c.key))
    : TRACKS_CONFIG

  function getT(clientX: number): number {
    const el = timelineRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const trackW = rect.width - LABEL_W
    return Math.max(0, Math.min(1, (clientX - rect.left - LABEL_W) / trackW))
  }

  function handlePresetChange(p: string) {
    onChangePreset(p)
    onChangeTracks(PRESET_KEYFRAMES[p] ?? {})
    setSelected(null)
  }

  function handleTrackClick(e: React.MouseEvent, key: keyof KeyframeMap, cfg: typeof TRACKS_CONFIG[0]) {
    if (dragRef.current) return
    const t = getT(e.clientX)
    const track = tracks[key] ?? []
    if (track.some(k => Math.abs(k.t - t) < 0.025)) return
    const newKf: KeyframePoint = { t, v: cfg.defaultV }
    const sorted = [...track, newKf].sort((a, b) => a.t - b.t)
    const newIdx = sorted.indexOf(newKf)
    onChangeTracks({ ...tracks, [key]: sorted })
    setSelected({ key, idx: newIdx })
  }

  function handleDiamondMouseDown(e: React.MouseEvent, key: keyof KeyframeMap, idx: number) {
    e.stopPropagation()
    e.preventDefault()
    setSelected({ key, idx })
    dragRef.current = { key, idx, currentTracks: tracks }

    function onMove(ev: MouseEvent) {
      const dr = dragRef.current
      if (!dr || !mountedRef.current) return
      const t = getT(ev.clientX)
      const track = [...(dr.currentTracks[dr.key] ?? [])]
      track[dr.idx] = { ...track[dr.idx], t }
      const updated = { ...dr.currentTracks, [dr.key]: track }
      dr.currentTracks = updated
      onChangeTracks(updated)
    }

    function onUp() {
      const dr = dragRef.current
      if (!dr) return
      const currentT = (dr.currentTracks[dr.key] ?? [])[dr.idx]?.t ?? 0
      const rawTrack = [...(dr.currentTracks[dr.key] ?? [])]
      const sortedTrack = rawTrack.slice().sort((a, b) => a.t - b.t)
      const newIdx = sortedTrack.findIndex(k => k === rawTrack[dr.idx])
      const sorted = { ...dr.currentTracks, [dr.key]: sortedTrack }
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!mountedRef.current) return
      onChangeTracks(sorted)
      setSelected({ key: dr.key, idx: newIdx >= 0 ? newIdx : 0 })
      void currentT
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function handleValueChange(key: keyof KeyframeMap, idx: number, v: number) {
    const track = [...(tracks[key] ?? [])]
    if (!track[idx]) return
    track[idx] = { ...track[idx], v }
    onChangeTracks({ ...tracks, [key]: track })
  }

  function handleDelete(key: keyof KeyframeMap, idx: number) {
    const track = (tracks[key] ?? []).filter((_, i) => i !== idx)
    const updated = { ...tracks }
    if (track.length === 0) delete updated[key]
    else updated[key] = track
    onChangeTracks(updated)
    if (selected?.key === key && selected.idx === idx) setSelected(null)
  }

  const selectedKf = selected ? (tracks[selected.key] ?? [])[selected.idx] : null
  const selectedCfg = selected ? TRACKS_CONFIG.find(c => c.key === selected.key) : null

  return (
    <div className="flex flex-col gap-3">
      {/* Controls row */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Preset
          </span>
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
          <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Duration
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={duration}
              min={0.1} max={30} step={0.1}
              onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) onChangeDuration(v) }}
              className="w-12 bg-transparent border-b border-white/10 text-white/70 text-[11px] py-1 focus:outline-none focus:border-white/35"
            />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>s</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Delay
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={delay}
              min={0} max={10} step={0.1}
              onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChangeDelay(v) }}
              className="w-12 bg-transparent border-b border-white/10 text-white/70 text-[11px] py-1 focus:outline-none focus:border-white/35"
            />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>s</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
            Loop
          </span>
          <button
            onClick={() => onChangeLoop(!loop)}
            style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: loop ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
              paddingBottom: 4, borderBottom: `1px solid ${loop ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {loop ? 'on' : 'off'}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} style={{ userSelect: 'none' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 2 }} />

        {visibleTracks.map(cfg => {
          const track = tracks[cfg.key] ?? []
          const isSel = selected?.key === cfg.key

          return (
            <div
              key={cfg.key}
              style={{ display: 'flex', alignItems: 'center', height: 26, cursor: 'col-resize' }}
              onClick={e => handleTrackClick(e, cfg.key, cfg)}
            >
              {/* Label */}
              <span style={{
                width: LABEL_W, flexShrink: 0,
                fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: isSel ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                userSelect: 'none',
                transition: 'color 0.1s',
              }}>
                {cfg.label}
              </span>

              {/* Track */}
              <div style={{ flex: 1, position: 'relative', height: '100%', overflow: 'visible' }}>
                {/* Center line */}
                <div style={{
                  position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
                  background: isSel ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                  pointerEvents: 'none', transition: 'background 0.1s',
                }} />

                {/* Keyframe diamonds */}
                {track.map((kf, i) => {
                  const isKfSel = isSel && selected?.idx === i
                  return (
                    <div
                      key={i}
                      onMouseDown={e => handleDiamondMouseDown(e, cfg.key, i)}
                      style={{
                        position: 'absolute',
                        left: `${kf.t * 100}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                        width: 7, height: 7,
                        border: `1px solid ${isKfSel ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)'}`,
                        background: isKfSel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
                        cursor: 'grab',
                        zIndex: 2,
                        transition: 'border-color 0.1s, background 0.1s',
                      }}
                    />
                  )
                })}

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
            </div>
          )
        })}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginTop: 2 }} />

        {/* Time axis */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: LABEL_W, paddingTop: 4 }}>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>0s</span>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>{duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Selected keyframe editor */}
      {selected && selectedKf && selectedCfg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: LABEL_W }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            ▸ {selected.key} @ {(selectedKf.t * duration).toFixed(2)}s
          </span>
          <input
            type="number"
            value={selectedKf.v}
            step={selectedCfg.step}
            min={selectedCfg.min}
            max={selectedCfg.max}
            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleValueChange(selected.key, selected.idx, v) }}
            onClick={e => e.stopPropagation()}
            className="w-16 bg-white/[0.05] border border-white/15 text-white/80 text-[11px] px-2 py-0.5 focus:outline-none focus:border-white/35 tabular-nums"
          />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{selectedCfg.fmt(selectedKf.v)}</span>
          <button
            onClick={e => { e.stopPropagation(); handleDelete(selected.key, selected.idx) }}
            className="text-[9px] text-white/20 hover:text-red-400/60 transition-colors tracking-[0.08em]"
          >
            × remove
          </button>
        </div>
      )}
    </div>
  )
}
