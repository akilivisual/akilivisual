'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import type { Album, CanvasWithPlacements, MediaAsset, PlacementWithModule } from '@/lib/schema/types'
import { LENS_OPTIONS } from '@/lib/schema/types'
import { updatePlacement, deletePlacement } from '@/app/admin/actions/modules'
import { updateCanvasMetadata } from '@/app/admin/actions/canvas'
import { assignStateToAlbum, updateCanvasLenses } from '@/app/admin/actions/albums'
import { createMediaAsset, listMediaAssets } from '@/app/admin/actions/media'
import { getSupabase } from '@/lib/supabase/client'
import { fetchAllCanvases } from '@/lib/supabase/canvas'
import { PlacementList } from './PlacementList'
import { CanvasEditor } from './CanvasEditor'
import { ModuleEditPanel } from './ModuleEditPanel'
import { DeleteCanvasButton } from './DeleteCanvasButton'

interface CanvasStudioProps {
  canvas: CanvasWithPlacements
  albums?: Album[]
}

type Mode = 'edit' | 'preview'

export function CanvasStudio({ canvas, albums = [] }: CanvasStudioProps) {
  const [placements, setPlacements] = useState(canvas.placements)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<PlacementWithModule | null>(null)
  const [albumId, setAlbumId] = useState<string>(canvas.album_id ?? '')
  const [lenses, setLenses] = useState<string[]>(canvas.lenses ?? [])
  const [thumbnail, setThumbnail] = useState<string>((canvas.metadata?.thumbnail_url as string) ?? '')
  const [showLibrary, setShowLibrary] = useState(false)
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [sectionIds, setSectionIds] = useState<string[]>((canvas.metadata?.sections as string[]) ?? [])
  const [allCanvases, setAllCanvases] = useState<CanvasWithPlacements[]>([])
  const [showSectionPicker, setShowSectionPicker] = useState(false)

  useEffect(() => {
    if (canvas.canvas_type !== 'scrollable') return
    fetchAllCanvases().then(setAllCanvases)
  }, [])

  async function saveThumbnail(url: string) {
    setThumbnail(url)
    await updateCanvasMetadata(canvas.id, { ...canvas.metadata, thumbnail_url: url || undefined })
  }

  async function saveSections(ids: string[]) {
    setSectionIds(ids)
    await updateCanvasMetadata(canvas.id, { ...canvas.metadata, sections: ids })
  }

  async function openLibrary() {
    setShowLibrary(true)
    const assets = await listMediaAssets()
    setLibraryAssets(assets.filter(a => a.asset_type === 'image'))
  }

  async function handleThumbnailUpload(file: File) {
    setUploading(true)
    try {
      const supabase = getSupabase()
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) return
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      await createMediaAsset(publicUrl, 'image', file.name.replace(/\.[^.]+$/, ''), path)
      await saveThumbnail(publicUrl)
    } finally {
      setUploading(false)
    }
  }
  const [mode, setMode] = useState<Mode>('edit')
  const [viewport, setViewport] = useState<'landscape' | 'portrait'>('landscape')

  const totalActors = placements.reduce((n, p) => n + p.module.actors.length, 0)

  function handleSaved(updated?: PlacementWithModule) {
    if (updated) {
      setPlacements(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditing(updated)
    }
    setRefreshKey(k => k + 1)
  }

  async function handleMove(placementId: string, x: number, y: number, width?: number, height?: number, rotate?: number) {
    const existing = (placements.find(p => p.id === placementId)?.position ?? {}) as Record<string, unknown>
    const newPos: Record<string, unknown> = { ...existing, x, y }
    if (width !== undefined) newPos.width = width
    if (height !== undefined) newPos.height = height
    if (rotate !== undefined) newPos.rotate = rotate
    setPlacements(prev => prev.map(p => p.id === placementId ? { ...p, position: newPos } : p))
    if (editing?.id === placementId) {
      setEditing(prev => prev ? { ...prev, position: newPos } : prev)
    }
    await updatePlacement(placementId, { position: newPos })
  }

  async function handleDelete(placementId: string) {
    setPlacements(prev => prev.filter(p => p.id !== placementId))
    if (editing?.id === placementId) setEditing(null)
    await deletePlacement(placementId)
    setRefreshKey(k => k + 1)
  }

  function handleSelect(placement: PlacementWithModule | null) {
    setEditing(placement)
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left panel — controls ───────────────────────────── */}
      <div className="w-[460px] shrink-0 border-r border-white/10 overflow-y-auto flex flex-col min-h-0">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/10 shrink-0">
          <Link
            href="/admin"
            className="text-[10px] tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors mb-5 inline-block"
          >
            ← States
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">{canvas.canvas_type}</p>
              <h1 className="text-xl font-light tracking-wide text-white truncate">{canvas.title}</h1>
              <p className="text-[11px] tracking-[0.1em] text-white/30 mt-1">{canvas.slug}</p>
            </div>
            <div className="shrink-0">
              <DeleteCanvasButton canvasId={canvas.id} canvasTitle={canvas.title} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-8 py-5 border-b border-white/[0.06] shrink-0">
          {[
            { label: 'Type', value: canvas.canvas_type },
            { label: 'Modules', value: placements.length },
            { label: 'Actors', value: totalActors },
          ].map((s) => (
            <div key={s.label} className="border border-white/10 bg-white/[0.02] px-3 py-3">
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-1">{s.label}</p>
              <p className="text-sm font-light text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Album + Lenses */}
        <div className="px-8 py-5 border-b border-white/[0.06] shrink-0 flex flex-col gap-4">
          {albums.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-[9px] tracking-[0.2em] uppercase text-white/25 w-14 shrink-0">Album</span>
              <select
                value={albumId}
                onChange={async e => {
                  const val = e.target.value
                  setAlbumId(val)
                  await assignStateToAlbum(canvas.id, val || null)
                }}
                className="flex-1 bg-transparent border-b border-white/10 text-white/60 text-[11px] py-1 focus:outline-none focus:border-white/30"
              >
                <option value="">Unassigned</option>
                {albums.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-start gap-4">
            <span className="text-[9px] tracking-[0.2em] uppercase text-white/25 w-14 shrink-0 pt-0.5">Lenses</span>
            <div className="flex flex-wrap gap-1.5">
              {LENS_OPTIONS.map(lens => {
                const active = lenses.includes(lens)
                return (
                  <button
                    key={lens}
                    onClick={async () => {
                      const next = active ? lenses.filter(l => l !== lens) : [...lenses, lens]
                      setLenses(next)
                      await updateCanvasLenses(canvas.id, next)
                    }}
                    className={`text-[9px] tracking-[0.15em] uppercase px-2 py-1 border transition-colors ${
                      active
                        ? 'border-white/35 text-white/70 bg-white/[0.05]'
                        : 'border-white/10 text-white/25 hover:border-white/20 hover:text-white/40'
                    }`}
                  >
                    {lens}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="px-8 py-5 border-b border-white/[0.06] shrink-0 flex flex-col gap-3">
          <span className="text-[9px] tracking-[0.2em] uppercase text-white/25">Thumbnail</span>
          {thumbnail ? (
            <div className="relative group w-full" style={{ aspectRatio: '16/9' }}>
              <img src={thumbnail} alt="" className="w-full h-full object-cover border border-white/10" />
              <button
                onClick={() => saveThumbnail('')}
                className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-black/60 text-white/40 hover:text-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-full border border-dashed border-white/10 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
              <span className="text-[9px] text-white/15 italic">no thumbnail</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-[9px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 disabled:text-white/15 transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              onClick={openLibrary}
              className="text-[9px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5"
            >
              Library
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(f) }} />
          </div>
          {showLibrary && (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/20 tracking-[0.1em] uppercase">Choose image</span>
                <button onClick={() => setShowLibrary(false)} className="text-[9px] text-white/20 hover:text-white/50">close</button>
              </div>
              {libraryAssets.length === 0 ? (
                <p className="text-[9px] text-white/15 italic">No images in library</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {libraryAssets.map(a => (
                    <button
                      key={a.id}
                      onClick={() => { saveThumbnail(a.url); setShowLibrary(false) }}
                      className="aspect-video border border-white/10 hover:border-white/30 overflow-hidden transition-colors"
                    >
                      <img src={a.url} alt={a.title ?? ''} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sections panel — scrollable canvases only */}
        {canvas.canvas_type === 'scrollable' && (
          <div className="px-8 py-5 border-b border-white/[0.06] shrink-0 flex flex-col gap-3">
            <span className="text-[9px] tracking-[0.2em] uppercase text-white/25">Sections</span>
            {sectionIds.length === 0 ? (
              <p className="text-[9px] text-white/15 italic">No sections added</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {sectionIds.map((id, i) => {
                  const c = allCanvases.find(x => x.id === id)
                  return (
                    <div key={id} className="flex items-center gap-2 group">
                      <span className="text-[9px] text-white/20 w-4 shrink-0">{i + 1}</span>
                      <span className="text-[11px] text-white/60 flex-1 truncate">{c?.title ?? id}</span>
                      <button
                        onClick={() => saveSections(sectionIds.filter((_, j) => j !== i))}
                        className="text-[9px] text-white/20 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            {showSectionPicker ? (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/20 tracking-[0.1em] uppercase">Choose state</span>
                  <button onClick={() => setShowSectionPicker(false)} className="text-[9px] text-white/20 hover:text-white/50">close</button>
                </div>
                {allCanvases
                  .filter(c => c.id !== canvas.id && c.canvas_type !== 'scrollable' && !sectionIds.includes(c.id))
                  .map(c => (
                    <button
                      key={c.id}
                      onClick={() => { saveSections([...sectionIds, c.id]); setShowSectionPicker(false) }}
                      className="text-left text-[11px] text-white/50 hover:text-white/80 border border-white/10 hover:border-white/25 px-3 py-1.5 transition-colors"
                    >
                      {c.title}
                      <span className="text-[9px] text-white/20 ml-2">{c.canvas_type}</span>
                    </button>
                  ))}
              </div>
            ) : (
              <button
                onClick={() => setShowSectionPicker(true)}
                className="text-[9px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5 self-start"
              >
                + Add Section
              </button>
            )}
          </div>
        )}

        {/* Placement list */}
        <div className="py-5 flex-1">
          <PlacementList
            placements={placements}
            canvasId={canvas.id}
            selectedId={editing?.id ?? null}
            onEdit={setEditing}
            onAdd={(placement) => setPlacements(prev => [...prev, placement])}
            onSaved={() => setRefreshKey(k => k + 1)}
            onReorder={setPlacements}
          />
        </div>

      </div>

      {/* ── Right panel — editor / preview ─────────────────── */}
      <div className="flex-1 bg-[#030303] overflow-hidden flex flex-col min-h-0">

        {/* Top bar */}
        <div className="h-10 shrink-0 flex items-center justify-between px-5 z-10 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${mode === 'preview' ? 'bg-white/40 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">
              {mode === 'edit' ? 'State Editor' : 'Live Preview'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport toggle */}
            <div className="flex items-center gap-1.5 border-r border-white/[0.08] pr-3">
              <button
                onClick={() => setViewport('landscape')}
                title="Landscape (16:9)"
                className={`flex items-center justify-center w-6 h-6 transition-colors ${viewport === 'landscape' ? 'text-white/70' : 'text-white/20 hover:text-white/45'}`}
              >
                <span className={`block w-4 h-2.5 border ${viewport === 'landscape' ? 'border-white/60' : 'border-current'}`} />
              </button>
              <button
                onClick={() => setViewport('portrait')}
                title="Portrait (9:16)"
                className={`flex items-center justify-center w-6 h-6 transition-colors ${viewport === 'portrait' ? 'text-white/70' : 'text-white/20 hover:text-white/45'}`}
              >
                <span className={`block w-2.5 h-4 border ${viewport === 'portrait' ? 'border-white/60' : 'border-current'}`} />
              </button>
            </div>

            {/* Edit / Preview */}
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 border text-[10px] tracking-[0.15em] uppercase transition-colors ${
                mode === 'edit' ? 'border-white/30 text-white/70' : 'border-white/10 text-white/25 hover:text-white/50 hover:border-white/20'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => { setMode('preview'); setRefreshKey(k => k + 1) }}
              className={`px-3 py-1 border text-[10px] tracking-[0.15em] uppercase transition-colors ${
                mode === 'preview' ? 'border-white/30 text-white/70' : 'border-white/10 text-white/25 hover:text-white/50 hover:border-white/20'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Stage — renders at design resolution scaled to fit panel */}
        <ScaledStage viewport={viewport}>
          {mode === 'edit' && (
            <CanvasEditor
              placements={placements}
              selectedId={editing?.id ?? null}
              onSelect={handleSelect}
              onCommit={handleMove}
              onDelete={handleDelete}
            />
          )}
          {mode === 'preview' && (
            <iframe
              key={refreshKey}
              src={`/preview/${canvas.slug}`}
              className="w-full h-full border-none"
              title={canvas.title}
              allow="autoplay"
            />
          )}
        </ScaledStage>

      </div>

      {/* Module edit panel — shared between list and canvas editor */}
      <AnimatePresence>
        {editing && (
          <ModuleEditPanel
            placement={editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
            onDelete={() => handleDelete(editing.id)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}

// Renders children at a fixed design resolution (1920×1080 or 1080×1920) scaled to fit
// the available panel space. This makes the admin preview accurately reflect how content
// will look on a full-screen deployment viewport at that resolution.
function ScaledStage({ viewport, children }: { viewport: 'landscape' | 'portrait'; children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const DESIGN_W = viewport === 'landscape' ? 1920 : 1080
  const DESIGN_H = viewport === 'landscape' ? 1080 : 1920

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setScale(Math.min(width / DESIGN_W, height / DESIGN_H))
    })
    obs.observe(wrapper)
    return () => obs.disconnect()
  }, [DESIGN_W, DESIGN_H])

  return (
    <div ref={wrapperRef} className="flex-1 min-h-0 flex items-center justify-center bg-[#030303] overflow-hidden">
      <div
        className="relative bg-[#050505] shadow-[0_0_0_1px_rgba(255,255,255,0.07)] overflow-hidden shrink-0"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        {children}
      </div>
    </div>
  )
}
