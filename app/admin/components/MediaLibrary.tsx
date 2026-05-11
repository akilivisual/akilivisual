'use client'

import { useRef, useState } from 'react'
import type { MediaAsset } from '@/lib/schema/types'
import { getSupabase } from '@/lib/supabase/client'
import { createMediaAsset, deleteMediaAsset } from '@/app/admin/actions/media'

interface MediaLibraryProps {
  assets: MediaAsset[]
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

function detectType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'link'
}

export function MediaLibrary({ assets: initial }: MediaLibraryProps) {
  const [assets, setAssets] = useState(initial)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    const assetType = detectType(file.type)
    const storagePath = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`

    setUploadState('uploading')
    setUploadError('')

    const supabase = getSupabase()
    const { error: storageError } = await supabase.storage
      .from('media')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false })

    if (storageError) {
      setUploadState('error')
      setUploadError(storageError.message)
      return
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath)
    const publicUrl = urlData.publicUrl

    const result = await createMediaAsset(publicUrl, assetType, file.name, storagePath)
    if (!result.ok) {
      setUploadState('error')
      setUploadError(result.error ?? 'Failed to save asset')
      return
    }

    setAssets((prev) => [
      {
        id: crypto.randomUUID(),
        asset_type: assetType,
        title: file.name,
        url: publicUrl,
        metadata: { storage_path: storagePath },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ...prev,
    ])
    setUploadState('done')
    setTimeout(() => setUploadState('idle'), 2500)
  }

  async function handleDelete(asset: MediaAsset) {
    const storagePath = (asset.metadata as Record<string, string>)?.storage_path
    await deleteMediaAsset(asset.id, storagePath)
    setAssets((prev) => prev.filter((a) => a.id !== asset.id))
  }

  return (
    <div className="px-10 py-10 min-h-screen">
      <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-1">Runtime</p>
      <h1 className="text-2xl font-light tracking-wide text-white mb-8">Media</h1>

      {/* Upload zone */}
      <div
        className={`relative border border-dashed mb-8 transition-colors cursor-pointer ${
          dragging ? 'border-white/40 bg-white/[0.04]' : 'border-white/15 hover:border-white/30'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center py-12 gap-3 pointer-events-none">
          {uploadState === 'idle' && (
            <>
              <div className="text-white/20 text-2xl">↑</div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/30">
                Drop file or click to upload
              </p>
              <p className="text-[10px] text-white/15">Images · Videos · Audio</p>
            </>
          )}
          {uploadState === 'uploading' && (
            <p className="text-[11px] tracking-[0.2em] uppercase text-white/50 animate-pulse">Uploading…</p>
          )}
          {uploadState === 'done' && (
            <p className="text-[11px] tracking-[0.2em] uppercase text-white/50">Upload complete</p>
          )}
          {uploadState === 'error' && (
            <p className="text-[11px] tracking-[0.2em] uppercase text-red-400/70">{uploadError}</p>
          )}
        </div>
      </div>

      {/* Grid */}
      {assets.length === 0 ? (
        <div className="border border-white/10 border-dashed flex items-center justify-center py-24">
          <p className="text-[11px] tracking-[0.25em] uppercase text-white/15">No media yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function AssetCard({ asset, onDelete }: { asset: MediaAsset; onDelete: (a: MediaAsset) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function copyUrl() {
    navigator.clipboard.writeText(asset.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function handleMouseEnter() {
    setHovered(true)
    if (asset.asset_type === 'video') videoRef.current?.play()
  }
  function handleMouseLeave() {
    setHovered(false)
    if (asset.asset_type === 'video') { videoRef.current?.pause(); if (videoRef.current) videoRef.current.currentTime = 0 }
  }

  return (
    <div
      className="border border-white/10 bg-white/[0.02] overflow-hidden group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Preview */}
      <div className="relative w-full h-40 bg-black overflow-hidden">
        {asset.asset_type === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt={asset.title ?? ''} className="w-full h-full object-cover" />
        )}
        {asset.asset_type === 'video' && (
          <video
            ref={videoRef}
            src={asset.url}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        {asset.asset_type === 'audio' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6">
            <div className="flex items-end gap-1 h-10">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-white/30 rounded-sm"
                  style={{ height: `${20 + Math.sin(i * 0.8) * 14 + Math.cos(i * 1.3) * 8}px` }}
                />
              ))}
            </div>
            <audio src={asset.url} controls className="w-full opacity-60" style={{ height: 28 }} />
          </div>
        )}
        {(asset.asset_type === 'link' || !['image', 'video', 'audio'].includes(asset.asset_type)) && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-4xl text-white/15">↗</span>
            <p className="text-[10px] text-white/20 px-4 text-center break-all leading-relaxed line-clamp-3">
              {asset.url}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/25 border border-white/[0.08] px-1.5 py-0.5">
              {asset.asset_type}
            </span>
            <p className="text-[11px] text-white/60 mt-1.5 truncate">{asset.title ?? 'Untitled'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyUrl}
            className="flex-1 py-1.5 border border-white/10 text-[10px] tracking-[0.15em] uppercase text-white/30 hover:text-white/70 hover:border-white/30 transition-colors"
          >
            {copied ? 'Copied' : 'Copy URL'}
          </button>
          <button
            onClick={() => {
              if (confirmDelete) { onDelete(asset) } else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
            }}
            className={`py-1.5 px-3 border text-[10px] tracking-[0.15em] uppercase transition-colors ${
              confirmDelete
                ? 'border-red-500/50 text-red-400/80 hover:text-red-300'
                : 'border-white/10 text-white/20 hover:text-white/50 hover:border-white/25'
            }`}
          >
            {confirmDelete ? 'Confirm' : '✕'}
          </button>
        </div>
      </div>
    </div>
  )
}
