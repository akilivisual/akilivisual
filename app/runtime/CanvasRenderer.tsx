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
        {canvas.modules.map((mod) => {
          const pos = (mod.position ?? {}) as Record<string, unknown>
          const mx = (pos.x as number) ?? 0
          const my = (pos.y as number) ?? 0
          const mz = (pos.z as number) ?? 0
          const depthZ = { background: 0, midground: 5, foreground: 10 }[mod.depth_layer ?? 'midground'] ?? 5
          return (
            <div
              key={mod.id}
              style={{
                position: 'absolute',
                left: `calc(50% + ${mx}%)`,
                top: `calc(50% + ${my}%)`,
                width: '100%',
                height: '100%',
                transform: 'translate(-50%, -50%)',
                zIndex: depthZ + mz,
              }}
            >
              <ModuleRenderer module={mod} />
            </div>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
}
