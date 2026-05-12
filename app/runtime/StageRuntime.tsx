'use client'

import { useEffect, useState } from 'react'
import type { CanvasWithModules } from '@/lib/schema/types'
import { fetchCanvasBySlug } from '@/lib/supabase/canvas'
import { CanvasRenderer } from './CanvasRenderer'
import { PointerProvider } from './context/PointerContext'

interface StageRuntimeProps {
  canvasSlug: string
}

type RuntimeState = 'loading' | 'ready' | 'error'

export function StageRuntime({ canvasSlug }: StageRuntimeProps) {
  const [canvas, setCanvas] = useState<CanvasWithModules | null>(null)
  const [state, setState] = useState<RuntimeState>('loading')

  useEffect(() => {
    fetchCanvasBySlug(canvasSlug)
      .then((data) => {
        if (data) {
          setCanvas(data)
          setState('ready')
        } else {
          setState('error')
        }
      })
      .catch(() => setState('error'))
  }, [canvasSlug])

  if (state === 'loading') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="w-1 h-1 rounded-full bg-white opacity-60 animate-pulse" />
      </div>
    )
  }

  if (state === 'error' || !canvas) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <span className="text-white/20 text-xs tracking-widest uppercase">no canvas</span>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <PointerProvider>
        <CanvasRenderer canvas={canvas} />
      </PointerProvider>
    </div>
  )
}
