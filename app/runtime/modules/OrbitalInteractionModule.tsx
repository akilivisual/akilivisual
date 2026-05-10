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
        const delay = (resolved.delay ?? 0) + i * 0.6

        // Actor-level opacity from transform (default visible)
        const baseOpacity = (actor.transform?.opacity as number) ?? 0.6

        // Scale pulse from motion profile
        const scaleMin = resolved.scale_min ?? 0.95
        const scaleMax = resolved.scale_max ?? 1.05

        // Opacity pulse: breathe around the actor's base opacity
        const opacityMin = baseOpacity * 0.6
        const opacityMax = baseOpacity

        return (
          <motion.div
            key={actor.id}
            className="absolute"
            style={getOrbPosition(
              (actor.transform?.x as number | undefined),
              (actor.transform?.y as number | undefined)
            )}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: [opacityMin, opacityMax, opacityMin],
              scale: [scaleMin, scaleMax, scaleMin],
            }}
            transition={{
              duration: (resolved.duration ?? 3.5) / (resolved.pulse_speed ?? 1),
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
