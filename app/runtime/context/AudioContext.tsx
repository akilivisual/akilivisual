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
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  function unlock() { setAudioUnlocked(true) }
  return <Ctx.Provider value={{ audioUnlocked, unlock }}>{children}</Ctx.Provider>
}

export function useAudio(): AudioContextValue {
  return useContext(Ctx)
}
