'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { CanvasWithPlacements, PlacementWithModule, ModuleWithActors } from '@/lib/schema/types'
import { ModuleRenderer } from './ModuleRenderer'
import { SectionRenderer } from './SectionRenderer'
import { useParallax } from './hooks/useParallax'
import { useTilt } from './hooks/useTilt'
import { useNavigation } from './context/NavigationContext'
import { useRightTray } from './context/RightTrayContext'

interface CanvasRendererProps {
  canvas: CanvasWithPlacements
}

export function CanvasRenderer({ canvas }: CanvasRendererProps) {
  const transition = canvas.transition_profile
  const hasSections = (canvas.sections?.length ?? 0) > 0

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={canvas.id}
        className={hasSections ? 'relative w-full' : 'absolute inset-0'}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: transition?.duration ?? 0.8,
          ease: transition?.easing ?? 'easeInOut',
        }}
      >
        {hasSections ? (
          canvas.sections.map(section => (
            <SectionRenderer key={section.id} section={section} />
          ))
        ) : (
        [...canvas.placements]
          .filter(p => ((p.overrides ?? {}) as Record<string, unknown>).context !== 'tray')
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((placement, sortedIndex) => {
          const pos = (placement.position ?? {}) as Record<string, unknown>
          const mx = (pos.x as number) ?? 0
          const my = (pos.y as number) ?? 0
          const mw = pos.width as number | undefined
          const mh = pos.height as number | undefined
          const mr = (pos.rotate as number) ?? 0
          const depthZ = sortedIndex

          // When the placement has explicit dimensions, media fills the container
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
                zIndex: depthZ,
                pointerEvents: 'none',
                overflow: hasExplicitSize ? 'hidden' : undefined,
              }}
            >
              <ModuleWrapper placement={placement}>
                <ModuleRenderer module={displayModule} />
              </ModuleWrapper>
            </div>
          )
        })
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export function ModuleWrapper({ placement, children }: { placement: PlacementWithModule; children: React.ReactNode }) {
  const mod: ModuleWithActors = placement.module
  const ip = (mod.interaction_profile ?? {}) as Record<string, unknown>
  const parallaxEnabled = !!ip.parallax_enabled
  const tiltEnabled = !!ip.tilt_enabled
  const strength = (ip.parallax_strength as number) ?? 1
  const tiltMax = (ip.tilt_max as number) ?? 8
  const tiltPerspective = (ip.tilt_perspective as number) ?? 800

  const clickAction = (ip.click_action as string) ?? 'none'
  const clickTarget = (ip.click_target as string) ?? ''
  const clickNewTab = (ip.click_new_tab as boolean) ?? false
  const clickable = clickAction === 'open_right_tray' || (clickAction !== 'none' && !!clickTarget)

  const { navigateTo } = useNavigation()
  const { openTray } = useRightTray()

  function handleClick() {
    if (clickAction === 'navigate_canvas') navigateTo(clickTarget)
    else if (clickAction === 'external_link') window.open(clickTarget, clickNewTab ? '_blank' : '_self')
    else if (clickAction === 'open_right_tray') openTray()
  }

  // Always called — hooks are stable regardless of enabled flags
  const { px, py } = useParallax(placement.depth_layer ?? 'midground', parallaxEnabled ? strength : 0)
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(tiltEnabled ? tiltMax : 0)

  return (
    <motion.div
      style={{
        width: '100%',
        height: '100%',
        x: parallaxEnabled ? px : 0,
        y: parallaxEnabled ? py : 0,
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
        transformPerspective: tiltEnabled ? tiltPerspective : undefined,
        pointerEvents: clickable ? 'auto' : 'none',
        cursor: clickable ? 'pointer' : undefined,
      }}
      onMouseMove={tiltEnabled ? onMouseMove : undefined}
      onMouseLeave={tiltEnabled ? onMouseLeave : undefined}
      onClick={clickable ? handleClick : undefined}
    >
      {children}
    </motion.div>
  )
}
