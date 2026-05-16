'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Reorder, useDragControls } from 'framer-motion'
import type { Album } from '@/lib/schema/types'
import { deleteAlbum, reorderAlbums, createAlbum } from '@/app/admin/actions/albums'

interface AlbumListProps {
  initialAlbums: Album[]
}

export function AlbumList({ initialAlbums }: AlbumListProps) {
  const [albums, setAlbums] = useState(initialAlbums)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  async function handleReorder(reordered: Album[]) {
    setAlbums(reordered)
    await reorderAlbums(reordered.map(a => a.id))
  }

  async function handleDelete(id: string) {
    setAlbums(prev => prev.filter(a => a.id !== id))
    await deleteAlbum(id)
  }

  return (
    <div className="flex flex-col gap-6">
      {albums.length === 0 && !creating ? (
        <div className="border border-dashed border-white/10 rounded px-8 py-12 flex flex-col items-center gap-4">
          <p className="text-white/25 text-sm tracking-wide">No albums yet</p>
          <button
            onClick={() => setCreating(true)}
            className="text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/25 px-4 py-2"
          >
            + New Album
          </button>
        </div>
      ) : (
        <>
          <Reorder.Group axis="y" values={albums} onReorder={handleReorder} className="flex flex-col gap-2">
            {albums.map(album => (
              <AlbumRow key={album.id} album={album} onDelete={handleDelete} />
            ))}
          </Reorder.Group>
          <button
            onClick={() => setCreating(true)}
            className="self-start text-[11px] tracking-[0.2em] uppercase text-white/30 hover:text-white/60 transition-colors"
          >
            + New Album
          </button>
        </>
      )}

      {creating && (
        <NewAlbumForm onCancel={() => setCreating(false)} onCreated={() => router.refresh()} />
      )}
    </div>
  )
}

function AlbumRow({ album, onDelete }: { album: Album; onDelete: (id: string) => void }) {
  const controls = useDragControls()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [menuOpen])

  return (
    <Reorder.Item
      value={album}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.01, opacity: 0.85 }}
      className="flex items-center gap-3 px-4 py-3 bg-white/[0.025] border border-white/[0.06] hover:border-white/10 transition-colors group"
    >
      {/* Drag handle */}
      <div
        className="flex flex-col gap-[3px] cursor-grab shrink-0 opacity-20 group-hover:opacity-40 transition-opacity"
        onPointerDown={e => controls.start(e)}
      >
        {[0,1,2].map(i => <div key={i} className="w-3 h-px bg-white" />)}
      </div>

      {/* Cover art thumbnail */}
      {(album.metadata?.cover_url as string | undefined) ? (
        <img
          src={album.metadata.cover_url as string}
          alt=""
          className="w-10 h-7 object-cover border border-white/10 shrink-0"
        />
      ) : (
        <div className="w-10 h-7 border border-dashed border-white/08 shrink-0" />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-light text-white/80 tracking-wide truncate">{album.title}</span>
          {album.theme && (
            <span className="text-[9px] tracking-[0.15em] uppercase text-white/25 shrink-0">{album.theme}</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className={`text-[9px] tracking-[0.15em] uppercase shrink-0 ${album.status === 'live' ? 'text-white/50' : 'text-white/20'}`}>
        {album.status}
      </span>

      {/* Actions */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => { setMenuOpen(v => !v); setConfirmDelete(false) }}
          className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors"
        >
          ···
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-[#111] border border-white/10 flex flex-col py-1">
            <Link
              href={`/admin/albums/${album.slug}`}
              className="px-4 py-2 text-[11px] text-white/60 hover:text-white/90 hover:bg-white/[0.04] transition-colors tracking-wide"
              onClick={() => setMenuOpen(false)}
            >
              Edit
            </Link>
            <div className="h-px bg-white/[0.06] my-1" />
            <button
              onClick={() => {
                if (!confirmDelete) { setConfirmDelete(true); return }
                setMenuOpen(false)
                onDelete(album.id)
              }}
              className="px-4 py-2 text-[11px] text-left transition-colors tracking-wide text-red-400/60 hover:text-red-400"
            >
              {confirmDelete ? 'Sure?' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </Reorder.Item>
  )
}

function NewAlbumForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [theme, setTheme] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function deriveSlug(t: string) {
    return t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return
    setSaving(true)
    setError('')
    const result = await createAlbum(title.trim(), slug.trim(), theme.trim() || undefined)
    if (!result?.ok) {
      setError(result?.error ?? 'Failed')
      setSaving(false)
    }
    // redirect happens server-side on success
  }

  return (
    <form onSubmit={handleSubmit} className="border border-white/10 p-6 flex flex-col gap-4">
      <p className="text-[9px] tracking-[0.25em] uppercase text-white/30">New Album</p>
      <div className="flex flex-col gap-3">
        <input
          placeholder="Title"
          value={title}
          onChange={e => { setTitle(e.target.value); setSlug(deriveSlug(e.target.value)) }}
          className="bg-transparent border-b border-white/15 text-white/80 text-sm py-1.5 focus:outline-none focus:border-white/35 placeholder:text-white/20 tracking-wide"
          autoFocus
        />
        <input
          placeholder="slug"
          value={slug}
          onChange={e => setSlug(deriveSlug(e.target.value))}
          className="bg-transparent border-b border-white/10 text-white/40 text-[11px] py-1 focus:outline-none focus:border-white/25 placeholder:text-white/15 font-mono"
        />
        <input
          placeholder="Theme (e.g. Expectation)"
          value={theme}
          onChange={e => setTheme(e.target.value)}
          className="bg-transparent border-b border-white/10 text-white/60 text-[11px] py-1 focus:outline-none focus:border-white/25 placeholder:text-white/15 tracking-wide"
        />
      </div>
      {error && <p className="text-[10px] text-red-400/70">{error}</p>}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!title.trim() || !slug.trim() || saving}
          className="text-[11px] tracking-[0.2em] uppercase text-white/60 hover:text-white/90 disabled:text-white/20 transition-colors border border-white/15 hover:border-white/30 disabled:border-white/05 px-4 py-2"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] tracking-[0.2em] uppercase text-white/25 hover:text-white/50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
