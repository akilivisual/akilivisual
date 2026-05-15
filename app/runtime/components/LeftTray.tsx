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
                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-4">Albums</p>
                  <div className="flex flex-col gap-1">
                    {albums.map(album => {
                      const isActive = activeAlbumId === album.id
                      return (
                        <button
                          key={album.id}
                          onClick={() => setAlbum(album.id)}
                          className="flex items-center gap-3 py-2 text-left group"
                        >
                          <span
                            className="w-1 h-1 rotate-45 shrink-0 border transition-all duration-200"
                            style={{
                              borderColor: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                              background: isActive ? 'rgba(255,255,255,0.6)' : 'transparent',
                            }}
                          />
                          <span
                            className="flex-1 text-sm font-light tracking-wide transition-colors duration-200 truncate"
                            style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }}
                          >
                            {album.title}
                          </span>
                          {album.theme && (
                            <span className="text-[8px] tracking-[0.1em] uppercase text-white/15 shrink-0">
                              {album.status === 'live' ? '●' : '○'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Lenses */}
              {populatedLenses.length > 0 && (
                <section>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-4">Lenses</p>
                  <div className="flex flex-wrap gap-1.5">
                    {populatedLenses.map(lens => {
                      const isActive = activeLens === lens
                      return (
                        <button
                          key={lens}
                          onClick={() => setLens(lens)}
                          className="text-[9px] tracking-[0.15em] uppercase px-2.5 py-1.5 border transition-all duration-200"
                          style={{
                            borderColor: isActive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)',
                            color: isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)',
                            background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                          }}
                        >
                          {lens}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* States */}
              <section>
                <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-4">
                  States{(activeAlbumId || activeLens) ? ' — filtered' : ''}
                </p>
                <div className="flex flex-col">
                  {canvases.map((canvas, i) => (
                    <button
                      key={canvas.id}
                      onClick={() => { navigateTo(canvas.slug); setOpen(false) }}
                      className="flex items-center gap-3 py-2.5 text-left group"
                    >
                      <span
                        className="w-1 h-1 rounded-full shrink-0 transition-all duration-300"
                        style={{
                          backgroundColor: i === activeIndex
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(255,255,255,0.15)',
                          transform: i === activeIndex ? 'scale(1.5)' : 'scale(1)',
                        }}
                      />
                      <span
                        className="text-sm font-light tracking-wide transition-colors duration-200"
                        style={{ color: i === activeIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}
                      >
                        {canvas.title}
                      </span>
                    </button>
                  ))}
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
