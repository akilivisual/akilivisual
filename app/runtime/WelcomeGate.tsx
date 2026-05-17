'use client'

import { motion } from 'framer-motion'

interface WelcomeGateProps {
  onUnlock: () => void
  imageUrl?: string | null
  title?: string | null
  subtitle?: string | null
}

export function WelcomeGate({ onUnlock, imageUrl, title, subtitle }: WelcomeGateProps) {
  return (
    <motion.div
      key="welcome-gate"
      className="fixed inset-0 z-[200] cursor-pointer overflow-hidden bg-black flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onUnlock}
    >
      {/* Background image */}
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      {/* Overlay — always present, deeper when no image */}
      <div className={`absolute inset-0 ${imageUrl ? 'bg-black/45' : 'bg-black'}`} />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-12">
        {title ? (
          <motion.div
            className="flex flex-col items-center gap-3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <p className="text-white text-sm tracking-[0.35em] uppercase font-light">{title}</p>
            {subtitle && (
              <p className="text-white/45 text-[10px] tracking-[0.25em] uppercase">{subtitle}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col items-center gap-3"
            animate={{ opacity: [0.08, 0.22, 0.08] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <div className="w-12 h-px bg-white/20" />
            <div className="w-12 h-px bg-white/20" />
          </motion.div>
        )}
      </div>

      {/* Wordmark */}
      <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.5em] uppercase text-white/15 font-light select-none z-10">
        AkiliVisual
      </span>
    </motion.div>
  )
}
