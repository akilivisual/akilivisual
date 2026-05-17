'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { fetchAllCanvases, fetchAllAlbums } from '@/lib/supabase/canvas'
import { CanvasRenderer } from './CanvasRenderer'
import { PointerProvider } from './context/PointerContext'
import { NavigationProvider } from './context/NavigationContext'
import { FilterProvider, useFilter } from './context/FilterContext'
import { LeftTray } from './components/LeftTray'
import { RightTray } from './components/RightTray'
import { RightTrayProvider } from './context/RightTrayContext'
import { SectionScrollProvider } from './context/SectionScrollContext'
import type { Album, CanvasWithPlacements } from '@/lib/schema/types'

export function StageCarousel() {
  return (
    <FilterProvider>
      <StageCarouselInner />
    </FilterProvider>
  )
}

type Slide = { canvas: CanvasWithPlacements; parentId?: string }

function StageCarouselInner() {
  const [canvases, setCanvases] = useState<CanvasWithPlacements[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
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

  // Canvas IDs that are sections of a scrollable state — excluded from top-level
  const allSectionIds = useMemo(() => new Set(
    canvases
      .filter(c => c.canvas_type === 'scrollable')
      .flatMap(c => (c.metadata?.sections as string[]) ?? [])
  ), [canvases])

  // Top-level canvases: exclude raw section canvases + apply album/lens filter
  const visible = useMemo(() => canvases.filter(c => {
    if (allSectionIds.has(c.id)) return false
    if (activeAlbumId && c.album_id !== activeAlbumId) return false
    if (activeLens && !(c.lenses ?? []).includes(activeLens)) return false
    return true
  }), [canvases, allSectionIds, activeAlbumId, activeLens])

  // Flat slide list: scrollable canvases expand into their sections
  const slides = useMemo<Slide[]>(() => visible.flatMap(canvas => {
    if (canvas.canvas_type !== 'scrollable') return [{ canvas }]
    const sectionIds = (canvas.metadata?.sections as string[]) ?? []
    const sections = sectionIds.map(id => canvases.find(c => c.id === id)).filter(Boolean) as CanvasWithPlacements[]
    return sections.length > 0
      ? sections.map(s => ({ canvas: s, parentId: canvas.id }))
      : [{ canvas }]
  }), [visible, canvases])

  useEffect(() => {
    if (slides.length === 0) return
    const observers = slides.map((_, i) => {
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
  }, [slides])

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

  const safeIndex = Math.min(activeIndex, Math.max(0, slides.length - 1))
  const activeSlide = slides[safeIndex] ?? null
  const activeCanvas = activeSlide?.canvas ?? null
  const trayPlacements = (activeCanvas?.placements ?? []).filter(
    p => ((p.overrides ?? {}) as Record<string, unknown>).context === 'tray'
  )

  // Map active slide back to visible index for LeftTray highlight
  const activeVisibleIndex = activeSlide
    ? visible.findIndex(c => c.id === (activeSlide.parentId ?? activeSlide.canvas.id))
    : safeIndex

  return (
    <NavigationProvider canvases={slides.map(s => s.canvas)} sectionRefs={sectionRefs}>
      <RightTrayProvider>
        <LeftTray canvases={visible} albums={albums} activeIndex={Math.max(0, activeVisibleIndex)} />
        <RightTray activeCanvas={activeCanvas} trayPlacements={trayPlacements} albums={albums} canvases={canvases} />

        {/* Scroll container */}
        <div ref={scrollContainerRef} className="h-screen overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {slides.length === 0 ? (
            <div className="h-screen flex items-center justify-center">
              <span className="text-white/15 text-xs tracking-widest uppercase">no states match</span>
            </div>
          ) : slides.map((slide, i) => (
            <div
              key={slide.canvas.id}
              ref={(el) => { sectionRefs.current[i] = el }}
              className="relative w-full h-screen snap-start overflow-hidden bg-black"
            >
              <SectionScrollProvider containerRef={scrollContainerRef} sectionRef={sectionRefs.current[i]}>
                <PointerProvider>
                  <CanvasRenderer canvas={slide.canvas} />
                </PointerProvider>
              </SectionScrollProvider>
            </div>
          ))}
        </div>

        {/* Dot navigator */}
        {slides.length > 1 && (
          <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
            {slides.map((slide, i) => (
              <button
                key={slide.canvas.id}
                onClick={() => sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })}
                title={slide.canvas.title}
                className={`w-1.5 rounded-full transition-all duration-500 ${
                  i === safeIndex
                    ? 'h-5 bg-white'
                    : slide.parentId
                      ? 'h-1.5 bg-white/15 hover:bg-white/35'
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
