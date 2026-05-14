'use client'

import { createContext, useContext } from 'react'
import type { CanvasWithModules } from '@/lib/schema/types'

interface NavCtx {
  navigateTo: (slug: string) => void
}

const Ctx = createContext<NavCtx>({ navigateTo: () => {} })

export function NavigationProvider({
  children,
  canvases,
  sectionRefs,
}: {
  children: React.ReactNode
  canvases: CanvasWithModules[]
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
}) {
  function navigateTo(slug: string) {
    const i = canvases.findIndex((c) => c.slug === slug)
    if (i >= 0) sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })
  }
  return <Ctx.Provider value={{ navigateTo }}>{children}</Ctx.Provider>
}

export function useNavigation(): NavCtx {
  return useContext(Ctx)
}
