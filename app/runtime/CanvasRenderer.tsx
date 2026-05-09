'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { CanvasWithModules } from '@/lib/schema/types'
import { ModuleRenderer } from './ModuleRenderer'

interface CanvasRendererProps {
  canvas: CanvasWithModules
}

export function CanvasRenderer({ canvas }: CanvasRendererProps) {
  const transition = canvas.transition_profile

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={canvas.id}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: transition?.duration ?? 0.8,
          ease: transition?.easing ?? 'easeInOut',
        }}
      >
        {canvas.modules.map((mod) => (
          <ModuleRenderer key={mod.id} module={mod} />
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
