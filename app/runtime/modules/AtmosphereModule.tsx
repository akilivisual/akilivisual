'use client'

import { motion, useTransform, useMotionTemplate } from 'framer-motion'
import type { ModuleWithActors } from '@/lib/schema/types'
import { usePointer } from '@/app/runtime/context/PointerContext'

interface AtmosphereModuleProps {
  module: ModuleWithActors
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function AtmosphereModule({ module }: AtmosphereModuleProps) {
  const { props } = module
  const background = props?.background as string | undefined
  const gradientColors = props?.gradient_colors as string[] | undefined
  const spot = (props?.spotlight ?? {}) as Record<string, unknown>

  const backgroundStyle = gradientColors
    ? `radial-gradient(ellipse at center, ${gradientColors.join(', ')})`
    : background ?? '#000000'

  // Always called — hooks must not be conditional
  const { mouseX, mouseY } = usePointer()
  const spotXpct = useTransform(mouseX, [-1, 1], ['0%', '100%'])
  const spotYpct = useTransform(mouseY, [-1, 1], ['0%', '100%'])

  const spotColor = (spot.color as string) ?? '#ffffff'
  const spotSize = (spot.size as number) ?? 35
  const spotOpacity = (spot.opacity as number) ?? 0.08
  const spotBlend = (spot.blend_mode as string) ?? 'screen'
  const colorWithAlpha = hexToRgba(spotColor, spotOpacity)

  const spotBg = useMotionTemplate`radial-gradient(circle at ${spotXpct} ${spotYpct}, ${colorWithAlpha} 0%, transparent ${spotSize}%)`

  return (
    <>
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: backgroundStyle }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      {!!spot.enabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: spotBg,
            mixBlendMode: spotBlend as React.CSSProperties['mixBlendMode'],
          }}
        />
      )}
    </>
  )
}
