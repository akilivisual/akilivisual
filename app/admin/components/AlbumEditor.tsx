'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Reorder, useDragControls } from 'framer-motion'
import type { AlbumWithStates, Canvas, MediaAsset } from '@/lib/schema/types'
import { updateAlbum, updateAlbumMetadata, assignStateToAlbum, reorderAlbumStates } from '@/app/admin/actions/albums'
import { createMediaAsset, listMediaAssets } from '@/app/admin/actions/media'
import { getSupabase } from '@/lib/supabase/client'

interface AlbumEditorProps {
  album: AlbumWithStates
  unassignedStates: Canvas[]
}

export function AlbumEditor({ album, unassignedStates: initialUnassigned }: AlbumEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(album.title)
  const [slug, setSlug] = useState(album.slug)
  const [theme, setTheme] = useState(album.theme ?? '')
  const [description, setDescription] = useState(album.description ?? '')
  const [status, setStatus] = useState(album.status)
  const [states, setStates] = useState<Canvas[]>(album.states)
  const [unassigned, setUnassigned] = useState<Canvas[]>(initialUnassigned)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [coverUrl, setCoverUrl] = useState<string>((album.metadata?.cover_url as string) ?? '')
  const [showLibrary, setShowLibrary] = useState(false)
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  type Track = { title: string; url: string }
  const [tracks, setTracks] = useState<Track[]>(
    ((album.metadata?.tracks as Track[] | undefined) ?? []).map(t => ({ title: t.title ?? '', url: t.url ?? '' }))
  )
  const [savingTracks, setSavingTracks] = useState(false)

  async function saveTracks(updated: Track[]) {
    setSavingTracks(true)
    await updateAlbumMetadata(album.id, { ...album.metadata, tracks: updated })
    setSavingTracks(false)
  }

  function addTrack() {
    setTracks(prev => [...prev, { title: '', url: '' }])
  }

  function updateTrack(i: number, field: 'title' | 'url', value: string) {
    setTracks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  function removeTrack(i: number) {
    const updated = tracks.filter((_, idx) => idx !== i)
    setTracks(updated)
    saveTracks(updated)
  }

  async function saveCover(url: string) {
    setCoverUrl(url)
    await updateAlbumMetadata(album.id, { ...album.metadata, cover_url: url || undefined })
  }

  async function openLibrary() {
    setShowLibrary(true)
    const assets = await listMediaAssets()
    setLibraryAssets(assets.filter(a => a.asset_type === 'image'))
  }

  async function handleCoverUpload(file: File) {
    setUploading(true)
    try {
      const supabase = getSupabase()
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) return
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      await createMediaAsset(publicUrl, 'image', file.name.replace(/\.[^.]+$/, ''), path)
      await saveCover(publicUrl)
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    const result = await updateAlbum(album.id, { title, slug, theme: theme || null, description: description || null, status })
    if (!result.ok) setSaveError(result.error ?? 'Save failed')
    else router.refresh()
    setSaving(false)
  }

  async function handleReorder(reordered: Canvas[]) {
    setStates(reordered)
    await reorderAlbumStates(album.id, reordered.map(s => s.id))
  }

  async function handleAssign(canvas: Canvas) {
    setUnassigned(prev => prev.filter(s => s.id !== canvas.id))
    setStates(prev => [...prev, canvas])
    await assignStateToAlbum(canvas.id, album.id)
  }

  async function handleRemove(canvas: Canvas) {
    setStates(prev => prev.filter(s => s.id !== canvas.id))
    setUnassigned(prev => [...prev, canvas])
    await assignStateToAlbum(canvas.id, null)
  }

  return (
    <div className="flex flex-col gap-10 max-w-xl">
      {/* Metadata */}
      <section>
        <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-5">Album Details</p>
        <form onSubmit={handleSaveMeta} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] tracking-[0.2em] uppercase text-white/25">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent border-b border-white/15 text-white/80 text-sm py-1.5 focus:outline-none focus:border-white/40 tracking-wide"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] tracking-[0.2em] uppercase text-white/25">Slug</label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="bg-transparent border-b border-white/10 text-white/40 text-[11px] py-1 focus:outline-none font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] tracking-[0.2em] uppercase text-white/25">Theme</label>
            <input
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="e.g. Expectation"
              className="bg-transparent border-b border-white/10 text-white/60 text-sm py-1.5 focus:outline-none focus:border-white/30 placeholder:text-white/15 tracking-wide"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] tracking-[0.2em] uppercase text-white/25">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="bg-transparent border-b border-white/10 text-white/50 text-sm py-1.5 focus:outline-none focus:border-white/25 resize-none tracking-wide"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[9px] tracking-[0.2em] uppercase text-white/25">Status</label>
            <button
              type="button"
              onClick={() => setStatus(s => s === 'live' ? 'draft' : 'live')}
              className={`text-[11px] tracking-[0.15em] uppercase pb-0.5 border-b transition-colors ${
                status === 'live'
                  ? 'text-white/70 border-white/30'
                  : 'text-white/25 border-white/08'
              }`}
            >
              {status}
            </button>
          </div>
          {saveError && <p className="text-[10px] text-red-400/70">{saveError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="self-start text-[11px] tracking-[0.2em] uppercase text-white/50 hover:text-white/80 disabled:text-white/20 transition-colors border border-white/10 hover:border-white/25 px-4 py-2 mt-1"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </section>

      {/* Cover Art */}
      <section>
        <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-5">Cover Art</p>
        <div className="flex flex-col gap-3">
          {coverUrl ? (
            <div className="relative group w-full" style={{ aspectRatio: '16/9' }}>
              <img src={coverUrl} alt="" className="w-full h-full object-cover border border-white/10" />
              <button
                onClick={() => saveCover('')}
                className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-black/60 text-white/40 hover:text-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-full border border-dashed border-white/10 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
              <span className="text-[9px] text-white/15 italic">no cover art</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-[9px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 disabled:text-white/15 transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={openLibrary}
              className="text-[9px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5"
            >
              Library
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }} />
          </div>
          {showLibrary && (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/20 tracking-[0.1em] uppercase">Choose image</span>
                <button type="button" onClick={() => setShowLibrary(false)} className="text-[9px] text-white/20 hover:text-white/50">close</button>
              </div>
              {libraryAssets.length === 0 ? (
                <p className="text-[9px] text-white/15 italic">No images in library</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {libraryAssets.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => { saveCover(a.url); setShowLibrary(false) }}
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
      </section>

      {/* Tracks */}
      <section>
        <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-5">Tracks</p>
        <div className="flex flex-col gap-2 mb-4">
          {tracks.map((track, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <input
                value={track.title}
                onChange={e => updateTrack(i, 'title', e.target.value)}
                placeholder="Title"
                className="flex-1 bg-transparent border-b border-white/10 text-white/70 text-[11px] py-1.5 focus:outline-none focus:border-white/30 placeholder:text-white/15 tracking-wide"
              />
              <input
                value={track.url}
                onChange={e => updateTrack(i, 'url', e.target.value)}
                placeholder="Audio URL"
                className="flex-[2] bg-transparent border-b border-white/10 text-white/40 text-[10px] py-1.5 focus:outline-none focus:border-white/25 placeholder:text-white/15 font-mono"
              />
              <button
                type="button"
                onClick={() => removeTrack(i)}
                className="text-[10px] text-white/15 hover:text-red-400/50 transition-colors shrink-0"
              >
                ×
              </button>
            </div>
          ))}
          {tracks.length === 0 && (
            <p className="text-[11px] text-white/20 italic">No tracks yet</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addTrack}
            className="text-[9px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors"
          >
            + Add Track
          </button>
          {tracks.length > 0 && (
            <button
              type="button"
              disabled={savingTracks}
              onClick={() => saveTracks(tracks)}
              className="text-[9px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 disabled:text-white/15 transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5"
            >
              {savingTracks ? 'Saving…' : 'Save Tracks'}
            </button>
          )}
        </div>
      </section>

      {/* States */}
      <section>
        <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-5">States — {states.length}</p>

        {states.length > 0 ? (
          <Reorder.Group axis="y" values={states} onReorder={handleReorder} className="flex flex-col gap-2 mb-4">
            {states.map(s => (
              <StateRow key={s.id} state={s} onRemove={handleRemove} />
            ))}
          </Reorder.Group>
        ) : (
          <p className="text-[11px] text-white/20 italic mb-4">No states assigned yet</p>
        )}

        {unassigned.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[9px] tracking-[0.2em] uppercase text-white/15 mb-1">Add State</p>
            {unassigned.map(s => {
              const thumb = s.metadata?.thumbnail_url as string | undefined
              return (
                <button
                  key={s.id}
                  onClick={() => handleAssign(s)}
                  className="flex items-center gap-3 text-left border border-dashed border-white/08 hover:border-white/20 transition-colors group overflow-hidden"
                >
                  {/* 16:9 thumbnail */}
                  <div className="shrink-0 w-24" style={{ aspectRatio: '16/9' }}>
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity" />
                    ) : (
                      <div className="w-full h-full bg-white/[0.02]" />
                    )}
                  </div>
                  <span className="text-white/15 group-hover:text-white/40 transition-colors text-xs">+</span>
                  <span className="text-[11px] text-white/35 group-hover:text-white/60 transition-colors tracking-wide">{s.title}</span>
                  {s.canvas_type && (
                    <span className="text-[9px] text-white/15 tracking-[0.1em] uppercase ml-auto pr-4">{s.canvas_type}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StateRow({ state, onRemove }: { state: Canvas; onRemove: (s: Canvas) => void }) {
  const controls = useDragControls()
  const thumbUrl = state.metadata?.thumbnail_url as string | undefined
  return (
    <Reorder.Item
      value={state}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.01, opacity: 0.85 }}
      className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] group overflow-hidden"
    >
      {/* 16:9 thumbnail */}
      <div className="shrink-0 w-24" style={{ aspectRatio: '16/9' }}>
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/[0.03]" />
        )}
      </div>

      <div
        className="flex flex-col gap-[3px] cursor-grab shrink-0 opacity-20 group-hover:opacity-40 transition-opacity"
        onPointerDown={e => controls.start(e)}
      >
        {[0,1,2].map(i => <div key={i} className="w-3 h-px bg-white" />)}
      </div>
      <span className="flex-1 text-[11px] text-white/60 tracking-wide">{state.title}</span>
      {state.canvas_type && (
        <span className="text-[9px] text-white/20 tracking-[0.1em] uppercase">{state.canvas_type}</span>
      )}
      <button
        onClick={() => onRemove(state)}
        className="text-[10px] text-white/15 hover:text-red-400/50 transition-colors ml-1 mr-3"
      >
        ×
      </button>
    </Reorder.Item>
  )
}
