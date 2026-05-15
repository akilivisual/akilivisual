'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchAllCanvases, fetchAllAlbums } from '@/lib/supabase/canvas'
import { CanvasRenderer } from './CanvasRenderer'
import { PointerProvider } from './context/PointerContext'
import { NavigationProvider } from './context/NavigationContext'
import { FilterProvider, useFilter } from './context/FilterContext'
import { LeftTray } from './components/LeftTray'
import { RightTray } from './components/RightTray'
import { RightTrayProvider } from './context/RightTrayContext'
import type { Album, CanvasWithPlacements } from '@/lib/schema/types'

export function StageCarousel() {
  return (
    <FilterProvider>
      <StageCarouselInner />
    </FilterProvider>
  )
}

function StageCarouselInner() {
  const [canvases, setCanvases] = useState<CanvasWithPlacements[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const { activeAlbumId, activeLens } = useFilter()

  useEffect(() => {
    Promise.all([fetchAllCanvases(), fetchAllAlbums()]).then(([cvs, albs]) => {
      setCanvases(cvs)
      setAlbums(albs)
      setLoaded(true)
    })

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        Promise.all([fetchAllCanvases(), fetchAllAlbums()]).then(([cvs, albs]) => {
          setCanvases(cvs)
          setAlbums(albs)
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (canvases.length === 0) return
    const observers = canvases.map((_, i) => {
      const el = sectionRefs.current[i]
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIndex(i) },
        { threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [canvases])

  // Filter canvases by active album/lens — resets activeIndex if needed
  const visible = canvases.filter(c => {
    if (activeAlbumId && c.album_id !== activeAlbumId) return false
    if (activeLens && !(c.lenses ?? []).includes(activeLens)) return false
    return true
  })

  if (!loaded) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-white opacity-60 animate-pulse" />
      </div>
    )
  }

  if (canvases.length === 0) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <span className="text-white/20 text-xs tracking-widest uppercase">no canvases</span>
      </div>
    )
  }

  const safeIndex = Math.min(activeIndex, Math.max(0, visible.length - 1))
  const activeCanvas = visible[safeIndex] ?? null
  const trayPlacements = (activeCanvas?.placements ?? []).filter(
    p => ((p.overrides ?? {}) as Record<string, unknown>).context === 'tray'
  )

  return (
    <NavigationProvider canvases={visible} sectionRefs={sectionRefs}>
      <RightTrayProvider>
        <LeftTray canvases={visible} albums={albums} activeIndex={safeIndex} />
        <RightTray activeCanvas={activeCanvas} trayPlacements={trayPlacements} />

        {/* Scroll container */}
        <div className="h-screen overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {visible.length === 0 ? (
            <div className="h-screen flex items-center justify-center">
              <span className="text-white/15 text-xs tracking-widest uppercase">no states match</span>
            </div>
          ) : visible.map((canvas, i) => (
            <div
              key={canvas.id}
              ref={(el) => { sectionRefs.current[i] = el }}
              className="relative w-full h-screen snap-start overflow-hidden bg-black"
            >
              <PointerProvider>
                <CanvasRenderer canvas={canvas} />
              </PointerProvider>
            </div>
          ))}
        </div>

        {/* Dot navigator */}
        {visible.length > 1 && (
          <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
            {visible.map((canvas, i) => (
              <button
                key={canvas.id}
                onClick={() => sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })}
                title={canvas.title}
                className={`w-1.5 rounded-full transition-all duration-500 ${
                  i === safeIndex
                    ? 'h-5 bg-white'
                    : 'h-1.5 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </RightTrayProvider>
    </NavigationProvider>
  )
}
