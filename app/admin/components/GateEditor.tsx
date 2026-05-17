'use client'

import { useRef, useState } from 'react'
import { updateGateConfig } from '@/app/admin/actions/gate'
import { createMediaAsset, listMediaAssets } from '@/app/admin/actions/media'
import { getSupabase } from '@/lib/supabase/client'
import type { GateConfig } from '@/lib/supabase/gate'
import type { MediaAsset } from '@/lib/schema/types'

interface GateEditorProps {
  initial: GateConfig | null
}

export function GateEditor({ initial }: GateEditorProps) {
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '')
  const [uploading, setUploading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  async function save(patch: Partial<GateConfig>) {
    await updateGateConfig(patch)
  }

  async function openLibrary() {
    setShowLibrary(true)
    const assets = await listMediaAssets()
    setLibraryAssets(assets.filter(a => a.asset_type === 'image'))
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const supabase = getSupabase()
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) return
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      await createMediaAsset(publicUrl, 'image', file.name.replace(/\.[^.]+$/, ''), path)
      setImageUrl(publicUrl)
      await save({ image_url: publicUrl })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Image */}
      <div className="flex flex-col gap-3">
        <p className="text-[9px] tracking-[0.2em] uppercase text-white/25">Background Image</p>
        {imageUrl ? (
          <div className="relative group w-full" style={{ aspectRatio: '16/9' }}>
            <img src={imageUrl} alt="" className="w-full h-full object-cover border border-white/10" />
            <button
              onClick={() => { setImageUrl(''); save({ image_url: null }) }}
              className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-black/60 text-white/40 hover:text-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="w-full border border-dashed border-white/10 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
            <span className="text-[9px] text-white/15 italic">no image</span>
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
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
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
                    onClick={() => { setImageUrl(a.url); save({ image_url: a.url }); setShowLibrary(false) }}
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

      {/* Title */}
      <div className="flex flex-col gap-3">
        <p className="text-[9px] tracking-[0.2em] uppercase text-white/25">Title</p>
        <input
          type="text"
          value={title}
          placeholder="Enter the experience…"
          onChange={e => setTitle(e.target.value)}
          onBlur={e => save({ title: e.target.value || null })}
          className="w-full bg-transparent border-b border-white/10 text-white/70 text-sm font-light py-1.5 focus:outline-none focus:border-white/30 placeholder:text-white/15 tracking-wide"
        />
        <p className="text-[9px] text-white/20">Displayed centered on the gate. Leave blank for the default glyph animation.</p>
      </div>

      {/* Subtitle */}
      <div className="flex flex-col gap-3">
        <p className="text-[9px] tracking-[0.2em] uppercase text-white/25">Subtitle</p>
        <input
          type="text"
          value={subtitle}
          placeholder="Optional secondary line…"
          onChange={e => setSubtitle(e.target.value)}
          onBlur={e => save({ subtitle: e.target.value || null })}
          className="w-full bg-transparent border-b border-white/10 text-white/50 text-xs font-light py-1.5 focus:outline-none focus:border-white/30 placeholder:text-white/15 tracking-wider"
        />
      </div>

      {/* Live preview hint */}
      <div className="border border-white/[0.06] px-4 py-3">
        <p className="text-[9px] text-white/20 leading-relaxed">
          The gate appears once per browser tab session. Clicking anywhere on it unlocks audio for the full session and fades the gate away over 1.4 seconds.
        </p>
      </div>

    </div>
  )
}
