'use client'

import { motion } from 'framer-motion'

interface WelcomeGateProps {
  onUnlock: () => void
}

export function WelcomeGate({ onUnlock }: WelcomeGateProps) {
  return (
    <motion.div
      key="welcome-gate"
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center cursor-pointer"
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onUnlock}
    >
      {/* Center glyph — two thin lines with glacial pulse */}
      <motion.div
        className="flex flex-col items-center gap-3"
        animate={{ opacity: [0.08, 0.22, 0.08] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <div className="w-12 h-px bg-white/20" />
        <div className="w-12 h-px bg-white/20" />
      </motion.div>

      {/* Wordmark */}
      <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.5em] uppercase text-white/15 font-light select-none">
        AkiliVisual
      </span>
    </motion.div>
  )
}
