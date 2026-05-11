'use client'

import type { ModuleWithActors } from '@/lib/schema/types'
import { FocusModule } from './modules/FocusModule'
import { OrbitalInteractionModule } from './modules/OrbitalInteractionModule'
import { AtmosphereModule } from './modules/AtmosphereModule'
import { EmbedModule } from './modules/EmbedModule'
import { ActorRenderer } from './ActorRenderer'

interface ModuleRendererProps {
  module: ModuleWithActors
}

export function ModuleRenderer({ module }: ModuleRendererProps) {
  switch (module.module_type) {
    case 'focus':
      return <FocusModule module={module} />
    case 'orbital_interaction':
      return <OrbitalInteractionModule module={module} />
    case 'atmosphere':
      return <AtmosphereModule module={module} />
    case 'embed':
      return <EmbedModule module={module} />
    default:
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            {module.actors.map((actor) => (
              <ActorRenderer key={actor.id} actor={actor} />
            ))}
          </div>
        </div>
      )
  }
}
