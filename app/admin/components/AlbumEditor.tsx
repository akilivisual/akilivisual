'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Reorder, useDragControls } from 'framer-motion'
import type { AlbumWithStates, Canvas } from '@/lib/schema/types'
import { updateAlbum, assignStateToAlbum, reorderAlbumStates } from '@/app/admin/actions/albums'

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
            {unassigned.map(s => (
              <button
                key={s.id}
                onClick={() => handleAssign(s)}
                className="flex items-center gap-3 px-4 py-2.5 text-left border border-dashed border-white/08 hover:border-white/20 transition-colors group"
              >
                <span className="text-white/15 group-hover:text-white/40 transition-colors text-xs">+</span>
                <span className="text-[11px] text-white/35 group-hover:text-white/60 transition-colors tracking-wide">{s.title}</span>
                {s.canvas_type && (
                  <span className="text-[9px] text-white/15 tracking-[0.1em] uppercase ml-auto">{s.canvas_type}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StateRow({ state, onRemove }: { state: Canvas; onRemove: (s: Canvas) => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={state}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.01, opacity: 0.85 }}
      className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] group"
    >
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
        className="text-[10px] text-white/15 hover:text-red-400/50 transition-colors ml-1"
      >
        ×
      </button>
    </Reorder.Item>
  )
}
