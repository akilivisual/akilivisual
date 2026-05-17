'use client'

import { createContext, useContext } from 'react'
import type { CanvasWithPlacements } from '@/lib/schema/types'

interface NavCtx {
  navigateTo: (slug: string) => void
  goNext: () => void
  goPrev: () => void
}

const Ctx = createContext<NavCtx>({ navigateTo: () => {}, goNext: () => {}, goPrev: () => {} })

export function NavigationProvider({
  children,
  canvases,
  sectionRefs,
  activeCanvasId,
}: {
  children: React.ReactNode
  canvases: CanvasWithPlacements[]
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  activeCanvasId?: string
}) {
  function scrollTo(i: number) {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })
  }

  function navigateTo(slug: string) {
    const i = canvases.findIndex(c => c.slug === slug)
    if (i >= 0) scrollTo(i)
  }

  function goNext() {
    const current = canvases.findIndex(c => c.id === activeCanvasId)
    if (current < 0) return
    const nextId = canvases[current]?.metadata?.next_state_id as string | undefined
    if (nextId) {
      const target = canvases.findIndex(c => c.id === nextId)
      if (target >= 0) { scrollTo(target); return }
    }
    if (current < canvases.length - 1) scrollTo(current + 1)
  }

  function goPrev() {
    const current = canvases.findIndex(c => c.id === activeCanvasId)
    if (current > 0) scrollTo(current - 1)
  }

  return <Ctx.Provider value={{ navigateTo, goNext, goPrev }}>{children}</Ctx.Provider>
}

export function useNavigation(): NavCtx {
  return useContext(Ctx)
}
