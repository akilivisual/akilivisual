'use client'

import type { SectionWithPlacements, PlacementWithModule, ModuleWithActors } from '@/lib/schema/types'
import { ModuleRenderer } from './ModuleRenderer'
import { ModuleWrapper } from './CanvasRenderer'

interface SectionRendererProps {
  section: SectionWithPlacements
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const vp = (section.visual_props ?? {}) as Record<string, unknown>
  const lp = (section.layout_props ?? {}) as Record<string, unknown>
  const isFlex = section.layout_type === 'flex'

  const height = section.height === 'viewport' ? '100vh'
    : section.height === 'auto' ? 'auto'
    : section.height

  const paddingTop    = (lp.padding_top    as number | undefined) ?? 0
  const paddingRight  = (lp.padding_right  as number | undefined) ?? 0
  const paddingBottom = (lp.padding_bottom as number | undefined) ?? 0
  const paddingLeft   = (lp.padding_left   as number | undefined) ?? 0

  const bgColor   = vp.background_color as string | undefined
  const bgImage   = vp.background_image as string | undefined
  const bgOpacity = (vp.background_opacity as number | undefined) ?? 1

  const placements = [...section.placements]
    .filter(p => ((p.overrides ?? {}) as Record<string, unknown>).context !== 'tray')
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
      {/* Background layer */}
      {(bgColor || bgImage) && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: bgColor || undefined,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: bgOpacity,
          zIndex: 0,
        }} />
      )}

      {/* Content layer */}
      {isFlex ? (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: ((lp.direction as string) ?? 'column') as React.CSSProperties['flexDirection'],
          alignItems: (lp.align as string) ?? 'center',
          justifyContent: (lp.justify as string) ?? 'flex-start',
          gap: (lp.gap as number) ?? 0,
          flexWrap: lp.wrap ? 'wrap' : 'nowrap',
          paddingTop, paddingRight, paddingBottom, paddingLeft,
          zIndex: 1,
        }}>
          {placements.map(placement => (
            <FlexModule key={placement.id} placement={placement} />
          ))}
        </div>
      ) : (
        // Free layout — absolute positioning within section
        <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
          {placements.map((placement, sortedIndex) => {
            const pos = (placement.position ?? {}) as Record<string, unknown>
            const mx = (pos.x as number) ?? 0
            const my = (pos.y as number) ?? 0
            const mw = pos.width as number | undefined
            const mh = pos.height as number | undefined
            const mr = (pos.rotate as number) ?? 0
            const hasExplicitSize = mw !== undefined && mh !== undefined
            const displayModule = hasExplicitSize
              ? {
                  ...placement.module,
                  actors: placement.module.actors.map(a =>
                    (a.actor_type === 'image' || a.actor_type === 'media')
                      ? { ...a, visual_schema: { ...(a.visual_schema as Record<string, unknown>), full_width: true } }
                      : a
                  ),
                }
              : placement.module

            return (
              <div
                key={placement.id}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${mx}%)`,
                  top: `calc(50% + ${my}%)`,
                  width: mw !== undefined ? `${mw}%` : '100%',
                  height: mh !== undefined ? `${mh}%` : '100%',
                  transform: `translate(-50%, -50%) rotate(${mr}deg)`,
                  zIndex: sortedIndex,
                  pointerEvents: 'none',
                  overflow: hasExplicitSize ? 'hidden' : undefined,
                }}
              >
                <ModuleWrapper placement={placement}>
                  <ModuleRenderer module={displayModule as ModuleWithActors} />
                </ModuleWrapper>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FlexModule({ placement }: { placement: PlacementWithModule }) {
  const pos = (placement.position ?? {}) as Record<string, unknown>
  const mw = pos.width as number | undefined
  const mh = pos.height as number | undefined
  const hasExplicitSize = mw !== undefined && mh !== undefined
  const displayModule = hasExplicitSize
    ? {
        ...placement.module,
        actors: placement.module.actors.map(a =>
          (a.actor_type === 'image' || a.actor_type === 'media')
            ? { ...a, visual_schema: { ...(a.visual_schema as Record<string, unknown>), full_width: true } }
            : a
        ),
      }
    : placement.module

  return (
    <div style={{
      position: 'relative',
      width: mw !== undefined ? `${mw}%` : undefined,
      height: mh !== undefined ? `${mh}%` : undefined,
      pointerEvents: 'none',
    }}>
      <ModuleWrapper placement={placement}>
        <ModuleRenderer module={displayModule as ModuleWithActors} />
      </ModuleWrapper>
    </div>
  )
}
