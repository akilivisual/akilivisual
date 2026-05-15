'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CanvasWithPlacements, PlacementWithModule } from '@/lib/schema/types'
import { ModuleRenderer } from '../ModuleRenderer'

interface RightTrayProps {
  activeCanvas: CanvasWithPlacements | null
  trayPlacements: PlacementWithModule[]
}

const TRAY_W = 320

export function RightTray({ activeCanvas, trayPlacements }: RightTrayProps) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // No trigger strip if there's nothing to show
  if (trayPlacements.length === 0) return null

  function openTray() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <div
      className="fixed right-0 top-0 h-full z-[60]"
      style={{ width: open ? TRAY_W : 20, pointerEvents: 'auto' }}
      onMouseEnter={openTray}
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
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              background: 'rgba(4,4,4,0.72)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Canvas header */}
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

            {/* Tray modules */}
            <div className="flex-1 overflow-y-auto">
              {trayPlacements.map((placement) => (
                <div
                  key={placement.id}
                  className="relative border-b border-white/[0.04]"
                  style={{ minHeight: 180 }}
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
