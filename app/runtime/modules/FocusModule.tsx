'use client'

import type { ModuleWithActors } from '@/lib/schema/types'
import { FlexActor } from '@/app/runtime/ActorRenderer'

interface FocusModuleProps {
  module: ModuleWithActors
}

export function FocusModule({ module }: FocusModuleProps) {
  const layout = ((module.props as Record<string, unknown>)?.layout ?? {}) as Record<string, unknown>
  const moduleMotion = (module.motion_profile ?? {}) as Record<string, unknown>

  const direction = (layout.direction as string) ?? 'column'
  const justify = (layout.justify as string) ?? 'center'
  const align = (layout.align as string) ?? 'center'
  const gap = (layout.gap as number) ?? 0
  const pt = (layout.padding_top as number) ?? 0
  const pr = (layout.padding_right as number) ?? 0
  const pb = (layout.padding_bottom as number) ?? 0
  const pl = (layout.padding_left as number) ?? 0

  return (
    <div
      className="absolute inset-0"
      style={{
        display: 'flex',
        flexDirection: direction as 'row' | 'column',
        justifyContent: justify,
        alignItems: align,
        gap,
        paddingTop: pt,
        paddingRight: pr,
        paddingBottom: pb,
        paddingLeft: pl,
        pointerEvents: 'none',
      }}
    >
      {module.actors.map((actor) => (
        <FlexActor key={actor.id} actor={actor} moduleMotion={moduleMotion} />
      ))}
    </div>
  )
}
