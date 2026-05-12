'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchAllCanvases } from '@/lib/supabase/canvas'
import { CanvasRenderer } from './CanvasRenderer'
import { PointerProvider } from './context/PointerContext'
import { NavigationProvider } from './context/NavigationContext'
import type { CanvasWithModules } from '@/lib/schema/types'

export function StageCarousel() {
  const [canvases, setCanvases] = useState<CanvasWithModules[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    fetchAllCanvases().then((data) => {
      setCanvases(data)
      setLoaded(true)
    })
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

  return (
    <NavigationProvider canvases={canvases} sectionRefs={sectionRefs}>
      <>
        {/* Scroll container */}
        <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
          {canvases.map((canvas, i) => (
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

        {/* Dot navigator — only shown when there's more than one canvas */}
        {canvases.length > 1 && (
          <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
            {canvases.map((canvas, i) => (
              <button
                key={canvas.id}
                onClick={() => sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })}
                title={canvas.title}
                className={`w-1.5 rounded-full transition-all duration-500 ${
                  i === activeIndex
                    ? 'h-5 bg-white'
                    : 'h-1.5 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </>
    </NavigationProvider>
  )
}
