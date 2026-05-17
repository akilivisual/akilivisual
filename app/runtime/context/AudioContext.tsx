'use client'

import { createContext, useContext, useState } from 'react'

interface AudioContextValue {
  audioUnlocked: boolean
  unlock: () => void
}

const Ctx = createContext<AudioContextValue>({
  audioUnlocked: false,
  unlock: () => {},
})

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('audio_unlocked') === '1'
  })

  function unlock() {
    sessionStorage.setItem('audio_unlocked', '1')
    setAudioUnlocked(true)
  }

  return <Ctx.Provider value={{ audioUnlocked, unlock }}>{children}</Ctx.Provider>
}

export function useAudio(): AudioContextValue {
  return useContext(Ctx)
}
