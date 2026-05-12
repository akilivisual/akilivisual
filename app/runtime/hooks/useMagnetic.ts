import { useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef } from 'react'

const SPRING = { stiffness: 200, damping: 30, mass: 0.8 }

export function useMagnetic(radius: number, strength: number, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, SPRING)
  const my = useSpring(rawY, SPRING)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < radius) {
        const pull = (1 - dist / radius) * strength
        rawX.set(dx * pull)
        rawY.set(dy * pull)
      } else {
        rawX.set(0)
        rawY.set(0)
      }
    }

    const reset = () => { rawX.set(0); rawY.set(0) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseleave', reset)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseleave', reset)
    }
  }, [radius, strength, enabled, rawX, rawY])

  return { ref, mx, my }
}
