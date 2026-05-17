'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { fetchAllCanvases, fetchAllAlbums } from '@/lib/supabase/canvas'
import { fetchGateConfig } from '@/lib/supabase/gate'
import type { GateConfig } from '@/lib/supabase/gate'
import { CanvasRenderer } from './CanvasRenderer'
import { PointerProvider } from './context/PointerContext'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { FilterProvider, useFilter } from './context/FilterContext'
import { AudioProvider, useAudio } from './context/AudioContext'
import { LeftTray } from './components/LeftTray'
import { RightTray } from './components/RightTray'
import { RightTrayProvider } from './context/RightTrayContext'
import { SectionScrollProvider } from './context/SectionScrollContext'
import { WelcomeGate } from './WelcomeGate'
import { AmbientAudioEngine } from './AmbientAudioEngine'
import type { Album, CanvasWithPlacements } from '@/lib/schema/types'

export function StageCarousel() {
  return (
    <AudioProvider>
      <FilterProvider>
        <StageCarouselInner />
      </FilterProvider>
    </AudioProvider>
  )
}

type Slide = { canvas: CanvasWithPlacements; parentId?: string }

function StageCarouselInner() {
  const [canvases, setCanvases] = useState<CanvasWithPlacements[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [gateConfig, setGateConfig] = useState<GateConfig | null>(null)
  const stateContainerRef = useRef<HTMLDivElement>(null)
  const { activeAlbumId, activeLens } = useFilter()
  const { audioUnlocked, unlock } = useAudio()

  useEffect(() => {
    Promise.all([fetchAllCanvases(), fetchAllAlbums(), fetchGateConfig()]).then(([cvs, albs, gate]) => {
      setCanvases(cvs)
      setAlbums(albs)
      setGateConfig(gate)
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

  // Top-level canvases: apply album/lens filter
  const visible = useMemo(() => canvases.filter(c => {
    if (allSectionIds.has(c.id)) return false
    if (activeAlbumId && c.album_id !== activeAlbumId) return false
    if (activeLens && !(c.lenses ?? []).includes(activeLens)) return false
    return true
  }), [canvases, allSectionIds, activeAlbumId, activeLens])

  // Flat slide list
  const slides = useMemo<Slide[]>(() => visible.flatMap(canvas => {
    if (canvas.canvas_type !== 'scrollable') return [{ canvas }]
    const sectionIds = (canvas.metadata?.sections as string[]) ?? []
    const sections = sectionIds.map(id => canvases.find(c => c.id === id)).filter(Boolean) as CanvasWithPlacements[]
    return sections.length > 0
      ? sections.map(s => ({ canvas: s, parentId: canvas.id }))
      : [{ canvas }]
  }), [visible, canvases])

  // Clamp activeIndex when slides change (e.g. album filter switch)
  useEffect(() => {
    if (slides.length > 0 && activeIndex >= slides.length) {
      setActiveIndex(0)
    }
  }, [slides, activeIndex])

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
  const hasSections = (activeCanvas?.sections?.length ?? 0) > 0
  const trayPlacements = (activeCanvas?.placements ?? []).filter(
    p => ((p.overrides ?? {}) as Record<string, unknown>).context === 'tray'
  )

  // Map active slide back to visible index for LeftTray highlight
  const activeVisibleIndex = activeSlide
    ? visible.findIndex(c => c.id === (activeSlide.parentId ?? activeSlide.canvas.id))
    : safeIndex

  return (
    <NavigationProvider
      canvases={slides.map(s => s.canvas)}
      activeCanvasId={activeCanvas?.id}
      onNavigate={setActiveIndex}
    >
      <AnimatePresence>
        {loaded && !audioUnlocked && (
          <WelcomeGate
            key="welcome-gate"
            onUnlock={unlock}
            imageUrl={gateConfig?.image_url}
            title={gateConfig?.title}
            subtitle={gateConfig?.subtitle}
          />
        )}
      </AnimatePresence>
      <KeyboardNav />
      <RightTrayProvider>
        <AmbientAudioEngine activeCanvas={activeCanvas} audioUnlocked={audioUnlocked} />
        <LeftTray canvases={visible} albums={albums} activeIndex={Math.max(0, activeVisibleIndex)} />
        <RightTray activeCanvas={activeCanvas} trayPlacements={trayPlacements} albums={albums} canvases={canvases} />

        {/* Single full-screen stage — one state at a time */}
        <div
          ref={stateContainerRef}
          className={`absolute inset-0 bg-black ${hasSections ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
          style={{ scrollbarWidth: 'none' }}
        >
          <SectionScrollProvider containerRef={stateContainerRef} sectionRef={null}>
            <PointerProvider>
              <AnimatePresence mode="wait">
                {activeCanvas && (
                  <CanvasRenderer key={activeCanvas.id} canvas={activeCanvas} />
                )}
              </AnimatePresence>
            </PointerProvider>
          </SectionScrollProvider>
        </div>

        {/* Dot navigator */}
        {slides.length > 1 && (
          <DotNavigator slides={slides} activeIndex={safeIndex} />
        )}
      </RightTrayProvider>
    </NavigationProvider>
  )
}

function DotNavigator({ slides, activeIndex }: { slides: Slide[]; activeIndex: number }) {
  const { navigateToIndex } = useNavigation()
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
      {slides.map((slide, i) => (
        <button
          key={slide.canvas.id}
          onClick={() => navigateToIndex(i)}
          title={slide.canvas.title}
          className={`w-1.5 rounded-full transition-all duration-500 ${
            i === activeIndex
              ? 'h-5 bg-white'
              : slide.parentId
                ? 'h-1.5 bg-white/15 hover:bg-white/35'
                : 'h-1.5 bg-white/25 hover:bg-white/50'
          }`}
        />
      ))}
    </div>
  )
}

function KeyboardNav() {
  const { goNext, goPrev } = useNavigation()
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])
  return null
}
