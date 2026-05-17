'use client'

import { createContext, useContext, useRef } from 'react'
import { motionValue, useScroll, MotionValue } from 'framer-motion'

const SectionScrollContext = createContext<MotionValue<number>>(motionValue(1))

export function useSectionScroll() {
  return useContext(SectionScrollContext)
}

export function SectionScrollProvider({
  children,
  containerRef,
  sectionRef,
}: {
  children: React.ReactNode
  containerRef: React.RefObject<HTMLDivElement | null>
  sectionRef: HTMLDivElement | null
}) {
  const internalRef = useRef<HTMLDivElement>(null)
  const target = sectionRef ? { current: sectionRef } : internalRef

  const { scrollYProgress } = useScroll({
    target,
    container: containerRef as unknown as React.RefObject<HTMLElement>,
    offset: ['start end', 'start start'],
  })

  return (
    <SectionScrollContext.Provider value={scrollYProgress}>
      {children}
    </SectionScrollContext.Provider>
  )
}
