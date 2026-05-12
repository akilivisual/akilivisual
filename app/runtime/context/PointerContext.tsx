'use client'

import { createContext, useContext } from 'react'
import { useMotionValue, MotionValue } from 'framer-motion'

interface PointerContextValue {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}

const Ctx = createContext<PointerContextValue | null>(null)

export function PointerProvider({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  return (
    <Ctx.Provider value={{ mouseX, mouseY }}>
      <div
        className="absolute inset-0"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          mouseX.set((e.clientX - rect.left) / rect.width * 2 - 1)
          mouseY.set((e.clientY - rect.top) / rect.height * 2 - 1)
        }}
        onMouseLeave={() => {
          mouseX.set(0)
          mouseY.set(0)
        }}
      >
        {children}
      </div>
    </Ctx.Provider>
  )
}

export function usePointer(): PointerContextValue {
  const ctx = useContext(Ctx)
  // Fallback zero values (rules of hooks: always called unconditionally)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fallbackX = useMotionValue(0)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fallbackY = useMotionValue(0)
  return ctx ?? { mouseX: fallbackX, mouseY: fallbackY }
}
