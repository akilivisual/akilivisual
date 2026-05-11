'use client'

import type { ModuleWithActors } from '@/lib/schema/types'
import { PositionedActor } from '@/app/runtime/ActorRenderer'

interface FocusModuleProps {
  module: ModuleWithActors
}

export function FocusModule({ module }: FocusModuleProps) {
  return (
    <div className="absolute inset-0">
      {module.actors.map((actor) => (
        <PositionedActor key={actor.id} actor={actor} />
      ))}
    </div>
  )
}
