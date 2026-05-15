'use client'

import { createContext, useContext, useState } from 'react'

interface FilterState {
  activeAlbumId: string | null
  activeLens: string | null
  setAlbum: (id: string | null) => void
  setLens: (lens: string | null) => void
}

const FilterContext = createContext<FilterState>({
  activeAlbumId: null,
  activeLens: null,
  setAlbum: () => {},
  setLens: () => {},
})

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null)
  const [activeLens, setActiveLens] = useState<string | null>(null)

  function setAlbum(id: string | null) {
    setActiveAlbumId(prev => prev === id ? null : id)
  }

  function setLens(lens: string | null) {
    setActiveLens(prev => prev === lens ? null : lens)
  }

  return (
    <FilterContext.Provider value={{ activeAlbumId, activeLens, setAlbum, setLens }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  return useContext(FilterContext)
}
