'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createCanvas } from '@/app/admin/actions/canvas'

const CANVAS_TYPES = ['default', 'hero', 'feature', 'gallery', 'narrative', 'ambient', 'scrollable']

function toSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function NewCanvasForm() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [canvasType, setCanvasType] = useState('default')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  function handleSlugChange(v: string) {
    setSlugEdited(true)
    setSlug(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return
    setSaving(true)
    setError('')
    const result = await createCanvas(title, slug, canvasType)
    if (!result?.ok) {
      setError(result?.error ?? 'Failed to create canvas')
      setSaving(false)
    }
    // on success: server action redirects to /admin/canvas/[slug]
  }

  return (
    <div className="px-10 py-10 max-w-lg">
      <Link
        href="/admin"
        className="text-[10px] tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors mb-8 inline-block"
      >
        ← States
      </Link>

      <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">New</p>
      <h1 className="text-2xl font-light tracking-wide text-white mb-10">New State</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2">Title</p>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="State title"
            autoFocus
            className="w-full bg-transparent border-b border-white/15 text-white text-sm py-2 placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {/* Slug */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2">Slug</p>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="canvas_slug"
            className="w-full bg-transparent border-b border-white/15 text-white/70 text-sm font-mono py-2 placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors"
          />
          <p className="text-[10px] text-white/20 mt-1.5">Used in the URL and as the runtime identifier</p>
        </div>

        {/* Canvas Type */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2">Type</p>
          <select
            value={canvasType}
            onChange={(e) => setCanvasType(e.target.value)}
            className="w-full bg-black border-b border-white/15 text-white/70 text-sm py-2 focus:outline-none focus:border-white/40 transition-colors"
          >
            {CANVAS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-[11px] text-red-400/70 tracking-wide">{error}</p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!title.trim() || !slug.trim() || saving}
            className="px-6 py-2.5 border border-white/20 text-[11px] tracking-[0.2em] uppercase text-white/60 hover:text-white hover:border-white/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating…' : 'Create State'}
          </button>
          <Link
            href="/admin"
            className="text-[11px] tracking-[0.15em] uppercase text-white/20 hover:text-white/50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
