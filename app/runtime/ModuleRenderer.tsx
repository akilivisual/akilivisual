'use client'

import type { ModuleWithActors } from '@/lib/schema/types'
import { FocusModule } from './modules/FocusModule'
import { OrbitalInteractionModule } from './modules/OrbitalInteractionModule'
import { AtmosphereModule } from './modules/AtmosphereModule'
import { EmbedModule } from './modules/EmbedModule'
import { FlexActor } from './ActorRenderer'

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
    default: {
      const layout = ((module.props as Record<string, unknown>)?.layout ?? {}) as Record<string, unknown>
      return (
        <div
          className="absolute inset-0"
          style={{
            display: 'flex',
            flexDirection: ((layout.direction as string) ?? 'column') as 'row' | 'column',
            justifyContent: (layout.justify as string) ?? 'center',
            alignItems: (layout.align as string) ?? 'center',
            gap: (layout.gap as number) ?? 0,
            paddingTop: (layout.padding_top as number) ?? 0,
            paddingRight: (layout.padding_right as number) ?? 0,
            paddingBottom: (layout.padding_bottom as number) ?? 0,
            paddingLeft: (layout.padding_left as number) ?? 0,
          }}
        >
          {module.actors.map((actor) => (
            <FlexActor key={actor.id} actor={actor} />
          ))}
        </div>
      )
    }
  }
}
