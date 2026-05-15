'use client'

import { createContext, useContext, useState } from 'react'

interface RightTrayContextValue {
  open: boolean
  openTray: () => void
  closeTray: () => void
}

const RightTrayContext = createContext<RightTrayContextValue>({
  open: false,
  openTray: () => {},
  closeTray: () => {},
})

export function RightTrayProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <RightTrayContext.Provider value={{ open, openTray: () => setOpen(true), closeTray: () => setOpen(false) }}>
      {children}
    </RightTrayContext.Provider>
  )
}

export function useRightTray() {
  return useContext(RightTrayContext)
}
