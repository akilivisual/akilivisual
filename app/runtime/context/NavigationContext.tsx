'use client'

import { createContext, useContext } from 'react'
import type { CanvasWithPlacements } from '@/lib/schema/types'

interface NavCtx {
  navigateTo: (slug: string) => void
  navigateToIndex: (i: number) => void
  goNext: () => void
  goPrev: () => void
}

const Ctx = createContext<NavCtx>({
  navigateTo: () => {},
  navigateToIndex: () => {},
  goNext: () => {},
  goPrev: () => {},
})

export function NavigationProvider({
  children,
  canvases,
  activeCanvasId,
  onNavigate,
}: {
  children: React.ReactNode
  canvases: CanvasWithPlacements[]
  activeCanvasId?: string
  onNavigate: (index: number) => void
}) {
  function navigateToIndex(i: number) {
    const clamped = Math.max(0, Math.min(i, canvases.length - 1))
    onNavigate(clamped)
  }

  function navigateTo(slug: string) {
    const i = canvases.findIndex(c => c.slug === slug)
    if (i >= 0) navigateToIndex(i)
  }

  function goNext() {
    const current = canvases.findIndex(c => c.id === activeCanvasId)
    if (current < 0) return
    const nextId = canvases[current]?.metadata?.next_state_id as string | undefined
    if (nextId) {
      const target = canvases.findIndex(c => c.id === nextId)
      if (target >= 0) { navigateToIndex(target); return }
    }
    navigateToIndex(current + 1)
  }

  function goPrev() {
    const current = canvases.findIndex(c => c.id === activeCanvasId)
    if (current > 0) navigateToIndex(current - 1)
  }

  return <Ctx.Provider value={{ navigateTo, navigateToIndex, goNext, goPrev }}>{children}</Ctx.Provider>
}

export function useNavigation(): NavCtx {
  return useContext(Ctx)
}
