'use client'

import { motion } from 'framer-motion'
import type { ModuleWithActors } from '@/lib/schema/types'
import { ActorRenderer } from '@/app/runtime/ActorRenderer'
import { resolveMotionProfile } from '@/lib/motion/profiles'

interface OrbitalInteractionModuleProps {
  module: ModuleWithActors
}

export function OrbitalInteractionModule({ module }: OrbitalInteractionModuleProps) {
  const { actors, motion_profile } = module
  const resolved = resolveMotionProfile(motion_profile ?? {})

  return (
    <div className="absolute inset-0 pointer-events-none">
      {actors.map((actor, i) => {
        const delay = (resolved.delay ?? 0) + i * 0.4

        return (
          <motion.div
            key={actor.id}
            className="absolute"
            style={getOrbPosition(actor.transform?.x, actor.transform?.y)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [resolved.opacity_min, resolved.opacity_max, resolved.opacity_min],
              scale: [resolved.scale_min, resolved.scale_max, resolved.scale_min],
            }}
            transition={{
              duration: (resolved.duration ?? 2.5) / (resolved.pulse_speed ?? 1),
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <ActorRenderer actor={actor} />
          </motion.div>
        )
      })}
    </div>
  )
}

function getOrbPosition(x?: number, y?: number): React.CSSProperties {
  if (x !== undefined && y !== undefined) {
    return { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }
  }
  return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
}
