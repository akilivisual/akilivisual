import { useTransform, useSpring } from 'framer-motion'
import { usePointer } from '../context/PointerContext'

const LAYER_FACTOR: Record<string, number> = {
  background: 0.08,
  midground: 0.04,
  foreground: -0.02,
}
const SPRING = { stiffness: 80, damping: 20, mass: 0.5 }
const MAX_PX = 60

export function useParallax(depthLayer: string, strength: number) {
  const { mouseX, mouseY } = usePointer()
  const factor = (LAYER_FACTOR[depthLayer] ?? 0.04) * strength
  const range = MAX_PX * factor
  const px = useSpring(useTransform(mouseX, [-1, 1], [-range, range]), SPRING)
  const py = useSpring(useTransform(mouseY, [-1, 1], [-range, range]), SPRING)
  return { px, py }
}
