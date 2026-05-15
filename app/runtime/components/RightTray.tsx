'use client'

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CanvasWithPlacements, PlacementWithModule } from '@/lib/schema/types'
import { ModuleRenderer } from '../ModuleRenderer'
import { useRightTray } from '../context/RightTrayContext'

interface RightTrayProps {
  activeCanvas: CanvasWithPlacements | null
  trayPlacements: PlacementWithModule[]
}

const TRAY_W = 320

export function RightTray({ activeCanvas, trayPlacements }: RightTrayProps) {
  const { open, openTray, closeTray } = useRightTray()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (trayPlacements.length === 0) return null

  function scheduleClose() {
    closeTimer.current = setTimeout(() => closeTray(), 150)
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTray()
  }

  return (
    <div
      className="fixed right-0 top-0 h-full z-[60]"
      style={{ width: open ? TRAY_W : 20, pointerEvents: 'auto' }}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="right-tray"
            initial={{ x: TRAY_W }}
            animate={{ x: 0 }}
            exit={{ x: TRAY_W }}
            transition={{ duration: 0.22, ease: [0.25, 0, 0, 1] }}
            className="absolute right-0 top-0 h-full flex flex-col"
            style={{
              width: TRAY_W,
              backdropFilter: 'blur(36px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(36px) saturate(1.6)',
              background: 'rgba(10,10,10,0.66)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.04), -4px 0 40px rgba(0,0,0,0.4)',
            }}
          >
            {activeCanvas && (
              <div className="px-7 pt-9 pb-7 shrink-0 border-b border-white/[0.05]">
                <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-1.5">
                  {activeCanvas.canvas_type}
                </p>
                <p className="text-sm font-light tracking-wide text-white/70">
                  {activeCanvas.title}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ minHeight: 0, scrollbarWidth: 'none' }}>
              {trayPlacements.map((placement) => (
                <div
                  key={placement.id}
                  className="relative border-b border-white/[0.04] overflow-hidden"
                  style={{ minHeight: 180, position: 'relative' }}
                >
                  <ModuleRenderer module={placement.module} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
