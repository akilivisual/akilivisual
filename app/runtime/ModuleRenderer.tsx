'use client'

import type { ModuleWithActors } from '@/lib/schema/types'
import { FocusModule } from './modules/FocusModule'
import { OrbitalInteractionModule } from './modules/OrbitalInteractionModule'
import { AtmosphereModule } from './modules/AtmosphereModule'

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
    default:
      return null
  }
}
