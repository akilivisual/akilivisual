'use client'

import { motion } from 'framer-motion'
import type { ModuleWithActors } from '@/lib/schema/types'
import { ActorRenderer } from '@/app/runtime/ActorRenderer'

interface FocusModuleProps {
  module: ModuleWithActors
}

export function FocusModule({ module }: FocusModuleProps) {
  const { actors, motion_profile } = module
  const duration = motion_profile?.duration ?? 1.2

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center gap-4">
        {actors.map((actor) => (
          <ActorRenderer key={actor.id} actor={actor} />
        ))}
      </div>
    </motion.div>
  )
}
