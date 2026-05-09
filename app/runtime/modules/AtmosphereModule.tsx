'use client'

import { motion } from 'framer-motion'
import type { ModuleWithActors } from '@/lib/schema/types'

interface AtmosphereModuleProps {
  module: ModuleWithActors
}

export function AtmosphereModule({ module }: AtmosphereModuleProps) {
  const { props } = module
  const background = props?.background as string | undefined
  const gradientColors = props?.gradient_colors as string[] | undefined

  const backgroundStyle = gradientColors
    ? `radial-gradient(ellipse at center, ${gradientColors.join(', ')})`
    : background ?? '#000000'

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ background: backgroundStyle }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    />
  )
}
