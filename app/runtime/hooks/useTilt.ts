import { useMotionValue, useSpring } from 'framer-motion'
import { useCallback } from 'react'

const SPRING = { stiffness: 150, damping: 25 }

export function useTilt(tiltMax: number) {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(rawX, SPRING)
  const rotateY = useSpring(rawY, SPRING)

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width * 2 - 1
    const ny = (e.clientY - rect.top) / rect.height * 2 - 1
    rawY.set(nx * tiltMax)
    rawX.set(-ny * tiltMax)
  }, [tiltMax, rawX, rawY])

  const onMouseLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  return { rotateX, rotateY, onMouseMove, onMouseLeave }
}
