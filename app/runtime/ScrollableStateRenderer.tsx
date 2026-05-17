'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { fetchCanvasesByIds } from '@/lib/supabase/canvas'
import { CanvasRenderer } from './CanvasRenderer'
import type { CanvasWithPlacements } from '@/lib/schema/types'

export function ScrollableStateRenderer({ canvas }: { canvas: CanvasWithPlacements }) {
  const sectionIds = (canvas.metadata?.sections as string[] | undefined) ?? []
  const [sections, setSections] = useState<CanvasWithPlacements[]>([])
  const [activeSection, setActiveSection] = useState(0)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  const sectionKey = sectionIds.join(',')
  useEffect(() => {
    if (sectionIds.length === 0) return
    fetchCanvasesByIds(sectionIds).then(setSections)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey])

  useEffect(() => {
    if (sections.length === 0) return
    const observers = sections.map((_, i) => {
      const el = sectionRefs.current[i]
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(i) },
        { threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [sections])

  if (sections.length === 0) {
    return <CanvasRenderer canvas={canvas} />
  }

  return (
    <LayoutGroup>
      <div className="h-full overflow-y-scroll" style={{ scrollbarWidth: 'none' }}>
        {sections.map((section, i) => (
          <div
            key={section.id}
            ref={el => { sectionRefs.current[i] = el }}
            className="relative w-full h-screen overflow-hidden"
          >
            <AnimatePresence mode="popLayout">
              {i === activeSection && (
                <CanvasRenderer key={section.id} canvas={section} />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </LayoutGroup>
  )
}
