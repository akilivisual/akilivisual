'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Album, CanvasWithPlacements, PlacementWithModule } from '@/lib/schema/types'
import { ModuleRenderer } from '../ModuleRenderer'
import { useRightTray } from '../context/RightTrayContext'

interface RightTrayProps {
  activeCanvas: CanvasWithPlacements | null
  trayPlacements: PlacementWithModule[]
  albums: Album[]
  canvases: CanvasWithPlacements[]
}

const TRAY_W = 320

export function RightTray({ activeCanvas, trayPlacements, albums, canvases }: RightTrayProps) {
  const { open, openTray, closeTray } = useRightTray()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeAlbum = albums.find(a => a.id === activeCanvas?.album_id) ?? null
  const albumStates = canvases.filter(c => c.album_id === activeAlbum?.id)
  const hasModules = trayPlacements.length > 0
  const hasAlbum = activeAlbum !== null

  const defaultTab = hasModules ? 'modules' : 'details'
  const [tab, setTab] = useState<'modules' | 'details'>(defaultTab)

  if (!hasModules && !hasAlbum) return null

  function scheduleClose() {
    closeTimer.current = setTimeout(() => closeTray(), 150)
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTray()
  }

  const coverUrl = activeAlbum?.metadata?.cover_url as string | undefined
  const tracks = activeAlbum?.metadata?.tracks as { title: string; url?: string }[] | undefined
  const lenses = activeCanvas?.lenses ?? []

  return (
    <div
      className="fixed right-0 top-0 h-full z-[60]"
      style={{ width: open ? TRAY_W : 20, pointerEvents: 'auto' }}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      {!open && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: 'rgba(255,255,255,0.10)' }}
        />
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            key="right-tray"
            initial={{ x: TRAY_W }}
            animate={{ x: 0 }}
            exit={{ x: TRAY_W }}
            transition={{ duration: 0.22, ease: [0.25, 0, 0, 1] }}
            className="absolute right-0 top-0 h-full flex flex-col"
            style={{
              width: TRAY_W,
              backdropFilter: 'blur(36px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(36px) saturate(1.6)',
              background: 'rgba(10,10,10,0.66)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.04), -4px 0 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="px-7 pt-9 pb-6 shrink-0 border-b border-white/[0.05] flex items-start justify-between gap-3">
              {tab === 'modules' ? (
                <div className="flex flex-col gap-1.5 min-w-0">
                  {activeCanvas && (
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/20">
                      {activeCanvas.canvas_type}
                    </p>
                  )}
                  <p className="text-sm font-light tracking-wide text-white/70 truncate">
                    {activeCanvas?.title ?? ''}
                  </p>
                </div>
              ) : (
                <div />
              )}

              {hasAlbum && (
                <button
                  onClick={() => setTab(t => t === 'details' ? (hasModules ? 'modules' : 'details') : 'details')}
                  className="shrink-0 text-[9px] tracking-[0.2em] uppercase transition-colors mt-px"
                  style={{ color: tab === 'details' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.22)' }}
                >
                  Details
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ minHeight: 0, scrollbarWidth: 'none' }}>
              {tab === 'modules' ? (
                hasModules ? (
                  trayPlacements.map((placement) => (
                    <div
                      key={placement.id}
                      className="border-b border-white/[0.04]"
                      style={{ position: 'relative', minHeight: 60 }}
                    >
                      <ModuleRenderer module={placement.module} context="tray" />
                    </div>
                  ))
                ) : null
              ) : (
                <DetailsPanel
                  album={activeAlbum!}
                  coverUrl={coverUrl}
                  lenses={lenses}
                  albumStates={albumStates}
                  tracks={tracks}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DetailsPanel({
  album,
  coverUrl,
  lenses,
  albumStates,
  tracks,
}: {
  album: Album
  coverUrl: string | undefined
  lenses: string[]
  albumStates: CanvasWithPlacements[]
  tracks: { title: string; url?: string }[] | undefined
}) {
  return (
    <div className="flex flex-col">
      {/* Cover art */}
      {coverUrl ? (
        <img src={coverUrl} alt="" className="w-full object-cover" style={{ aspectRatio: '16/9' }} />
      ) : (
        <div className="w-full bg-white/[0.02]" style={{ aspectRatio: '16/9' }} />
      )}

      {/* Title + description */}
      <div className="px-7 pt-5 pb-5 border-b border-white/[0.05] flex flex-col gap-2">
        {album.theme && (
          <p className="text-[9px] tracking-[0.25em] uppercase text-white/25">{album.theme}</p>
        )}
        <p className="text-[15px] font-light tracking-wide text-white/85">{album.title}</p>
        {album.description && (
          <p className="text-[11px] text-white/40 leading-relaxed tracking-wide">{album.description}</p>
        )}
      </div>

      {/* Lenses */}
      {lenses.length > 0 && (
        <div className="px-7 py-4 border-b border-white/[0.05] flex flex-col gap-2.5">
          <p className="text-[9px] tracking-[0.3em] uppercase text-white/20">Lenses</p>
          <div className="flex flex-wrap gap-1">
            {lenses.map(lens => (
              <span
                key={lens}
                className="text-[8px] tracking-[0.12em] uppercase px-2 py-1 border"
                style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.45)' }}
              >
                {lens}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* States */}
      {albumStates.length > 0 && (
        <div className="px-7 py-4 border-b border-white/[0.05] flex flex-col gap-2.5">
          <p className="text-[9px] tracking-[0.3em] uppercase text-white/20">States — {albumStates.length}</p>
          <div className="flex flex-col gap-1.5">
            {albumStates.map(state => {
              const thumb = state.metadata?.thumbnail_url as string | undefined
              return (
                <div key={state.id} className="flex items-center gap-2.5">
                  <div className="shrink-0 w-16" style={{ aspectRatio: '16/9' }}>
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/[0.04]" />
                    )}
                  </div>
                  <span className="text-[11px] font-light text-white/50 tracking-wide truncate">{state.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tracks */}
      {tracks && tracks.length > 0 && (
        <div className="px-7 py-4 flex flex-col gap-2.5">
          <p className="text-[9px] tracking-[0.3em] uppercase text-white/20">Tracks</p>
          <div className="flex flex-col gap-2">
            {tracks.map((track, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-white/20 text-[10px] shrink-0">♩</span>
                <span className="text-[11px] font-light text-white/50 tracking-wide truncate">{track.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
