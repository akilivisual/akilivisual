'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Album, CanvasWithPlacements } from '@/lib/schema/types'
import { LENS_OPTIONS } from '@/lib/schema/types'
import { useNavigation } from '../context/NavigationContext'
import { useFilter } from '../context/FilterContext'

interface LeftTrayProps {
  canvases: CanvasWithPlacements[]
  albums: Album[]
  activeIndex: number
}

const TRAY_W = 280

export function LeftTray({ canvases, albums, activeIndex }: LeftTrayProps) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { navigateTo } = useNavigation()
  const { activeAlbumId, activeLens, setAlbum, setLens } = useFilter()

  function openTray() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  // Lenses that have at least one state tagged — only show populated lenses
  const populatedLenses = LENS_OPTIONS.filter(lens =>
    canvases.some(c => (c.lenses ?? []).includes(lens))
  )

  return (
    <div
      className="fixed left-0 top-0 h-full z-[60]"
      style={{ width: open ? TRAY_W : 20, pointerEvents: 'auto' }}
      onMouseEnter={openTray}
      onMouseLeave={scheduleClose}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="left-tray"
            initial={{ x: -TRAY_W }}
            animate={{ x: 0 }}
            exit={{ x: -TRAY_W }}
            transition={{ duration: 0.22, ease: [0.25, 0, 0, 1] }}
            className="absolute left-0 top-0 h-full flex flex-col"
            style={{
              width: TRAY_W,
              backdropFilter: 'blur(36px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(36px) saturate(1.6)',
              background: 'rgba(10,10,10,0.66)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04), 4px 0 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Wordmark */}
            <div className="px-7 pt-9 pb-6 shrink-0">
              <p className="text-[10px] tracking-[0.45em] uppercase text-white/35 font-light">
                AkiliVisual
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-7 flex flex-col gap-7 pb-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>

              {/* Albums */}
              {albums.length > 0 && (
                <section>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-3">Albums</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[...albums]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map(album => {
                        const isActive = activeAlbumId === album.id
                        const coverUrl = album.metadata?.cover_url as string | undefined
                        return (
                          <button
                            key={album.id}
                            onClick={() => setAlbum(album.id)}
                            className="relative overflow-hidden text-left transition-all duration-200"
                            style={{
                              aspectRatio: '16/9',
                              border: `1px solid ${isActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
                              outline: isActive ? '1px solid rgba(255,255,255,0.12)' : 'none',
                              outlineOffset: '2px',
                            }}
                          >
                            {coverUrl ? (
                              <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 bg-white/[0.03]" />
                            )}
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />
                            <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5">
                              <p className="text-[8px] font-light tracking-wide text-white/80 truncate leading-tight">{album.title}</p>
                              {album.theme && (
                                <p className="text-[7px] tracking-[0.08em] uppercase text-white/30 truncate leading-tight mt-px">{album.theme}</p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </section>
              )}

              {/* Lenses */}
              {populatedLenses.length > 0 && (
                <section>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-2.5">Lenses</p>
                  <div className="flex flex-wrap gap-1">
                    {populatedLenses.map(lens => {
                      const isActive = activeLens === lens
                      return (
                        <button
                          key={lens}
                          onClick={() => setLens(lens)}
                          className="text-[8px] tracking-[0.12em] uppercase px-2 py-1 border transition-all duration-200"
                          style={{
                            borderColor: isActive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)',
                            color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
                            background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                          }}
                        >
                          {lens}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* States — thumbnail cards */}
              <section>
                <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-4">
                  States{(activeAlbumId || activeLens) ? ' — filtered' : ''}
                </p>
                <div className="flex flex-col gap-2">
                  {canvases.map((canvas, i) => {
                    const thumbUrl = (canvas.metadata as Record<string, unknown>)?.thumbnail_url as string | undefined
                    const isActive = i === activeIndex
                    return (
                      <button
                        key={canvas.id}
                        onClick={() => { navigateTo(canvas.slug); setOpen(false) }}
                        className="relative w-full overflow-hidden text-left transition-all duration-200"
                        style={{
                          height: 110,
                          border: `1px solid ${isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          outline: isActive ? '1px solid rgba(255,255,255,0.15)' : 'none',
                          outlineOffset: isActive ? '2px' : '0',
                        }}
                      >
                        {/* Thumbnail image or placeholder */}
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={canvas.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
                            style={{ transform: isActive ? 'scale(1.03)' : 'scale(1)' }}
                          />
                        ) : (
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
                            }}
                          />
                        )}

                        {/* Gradient overlay */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.05) 100%)',
                          }}
                        />

                        {/* Text */}
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6">
                          {canvas.canvas_type && (
                            <p className="text-[8px] tracking-[0.2em] uppercase text-white/35 mb-0.5">
                              {canvas.canvas_type}
                            </p>
                          )}
                          <p
                            className="text-[12px] font-light tracking-wide leading-tight"
                            style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)' }}
                          >
                            {canvas.title}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                  {canvases.length === 0 && (
                    <p className="text-[10px] text-white/15 italic">No states match</p>
                  )}
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="px-7 py-7 shrink-0 border-t border-white/[0.05] flex flex-col gap-4">
              <button className="text-left text-sm font-light text-white/30 hover:text-white/60 transition-colors tracking-wide">
                Contact
              </button>
              <div className="flex items-center gap-5">
                <button className="text-[10px] tracking-[0.2em] uppercase text-white/20 hover:text-white/40 transition-colors">
                  Sign In
                </button>
                <span className="w-px h-3 bg-white/10" />
                <button className="text-[10px] tracking-[0.2em] uppercase text-white/20 hover:text-white/40 transition-colors">
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
