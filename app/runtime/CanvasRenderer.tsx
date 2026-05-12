'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { CanvasWithModules, ModuleWithActors } from '@/lib/schema/types'
import { ModuleRenderer } from './ModuleRenderer'
import { useParallax } from './hooks/useParallax'
import { useTilt } from './hooks/useTilt'
import { useNavigation } from './context/NavigationContext'

interface CanvasRendererProps {
  canvas: CanvasWithModules
}

export function CanvasRenderer({ canvas }: CanvasRendererProps) {
  const transition = canvas.transition_profile

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={canvas.id}
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: transition?.duration ?? 0.8,
          ease: transition?.easing ?? 'easeInOut',
        }}
      >
        {canvas.modules.map((mod) => {
          const pos = (mod.position ?? {}) as Record<string, unknown>
          const mx = (pos.x as number) ?? 0
          const my = (pos.y as number) ?? 0
          const mz = (pos.z as number) ?? 0
          const depthZ = { background: 0, midground: 5, foreground: 10 }[mod.depth_layer ?? 'midground'] ?? 5
          return (
            <div
              key={mod.id}
              style={{
                position: 'absolute',
                left: `calc(50% + ${mx}%)`,
                top: `calc(50% + ${my}%)`,
                width: '100%',
                height: '100%',
                transform: 'translate(-50%, -50%)',
                zIndex: depthZ + mz,
                pointerEvents: 'none',
              }}
            >
              <ModuleWrapper mod={mod}>
                <ModuleRenderer module={mod} />
              </ModuleWrapper>
            </div>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
}

// Isolated component so hooks are always called at a stable component boundary.
// Parallax adds x/y translation; tilt adds rotateX/rotateY — both on same motion.div,
// composing cleanly without touching entrance or ambient animations inside.
function ModuleWrapper({ mod, children }: { mod: ModuleWithActors; children: React.ReactNode }) {
  const ip = (mod.interaction_profile ?? {}) as Record<string, unknown>
  const parallaxEnabled = !!ip.parallax_enabled
  const tiltEnabled = !!ip.tilt_enabled
  const strength = (ip.parallax_strength as number) ?? 1
  const tiltMax = (ip.tilt_max as number) ?? 8
  const tiltPerspective = (ip.tilt_perspective as number) ?? 800

  const clickAction = (ip.click_action as string) ?? 'none'
  const clickTarget = (ip.click_target as string) ?? ''
  const clickNewTab = (ip.click_new_tab as boolean) ?? false
  const clickable = clickAction !== 'none' && !!clickTarget

  const { navigateTo } = useNavigation()

  function handleClick() {
    if (clickAction === 'navigate_canvas') navigateTo(clickTarget)
    else if (clickAction === 'external_link') window.open(clickTarget, clickNewTab ? '_blank' : '_self')
  }

  // Always called — hooks are stable regardless of enabled flags
  const { px, py } = useParallax(mod.depth_layer ?? 'midground', parallaxEnabled ? strength : 0)
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
