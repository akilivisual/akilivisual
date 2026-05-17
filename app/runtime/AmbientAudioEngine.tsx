'use client'

import { useEffect, useRef } from 'react'
import type { CanvasWithPlacements, TransitionProfile } from '@/lib/schema/types'

interface AmbientAudioConfig {
  src?: string
  volume?: number
  loop?: boolean
}

const FADE_MS = 800
const STEP_MS = 16

function fadeVolume(el: HTMLAudioElement, to: number, onDone?: () => void) {
  const from = el.volume
  const steps = Math.round(FADE_MS / STEP_MS)
  const delta = (to - from) / steps
  let tick = 0
  const id = setInterval(() => {
    tick++
    el.volume = Math.max(0, Math.min(1, from + delta * tick))
    if (tick >= steps) {
      clearInterval(id)
      el.volume = to
      onDone?.()
    }
  }, STEP_MS)
  return id
}

interface Props {
  activeCanvas: CanvasWithPlacements | null
  audioUnlocked: boolean
}

export function AmbientAudioEngine({ activeCanvas, audioUnlocked }: Props) {
  const nodeA = useRef<HTMLAudioElement>(null)
  const nodeB = useRef<HTMLAudioElement>(null)
  const activeSlot = useRef<'A' | 'B'>('A')
  const timerIds = useRef<ReturnType<typeof setInterval>[]>([])
  const currentSrc = useRef<string>('')

  function clearTimers() {
    timerIds.current.forEach(clearInterval)
    timerIds.current = []
  }

  useEffect(() => {
    if (!audioUnlocked) return

    const config = (activeCanvas?.metadata?.ambient_audio ?? {}) as AmbientAudioConfig
    const newSrc = config.src ?? ''
    const targetVol = config.volume ?? 0.7
    const loop = config.loop ?? true

    // Fire one-shot SFX
    const tp = (activeCanvas?.transition_profile ?? {}) as TransitionProfile
    const sfxSrc = tp.intro?.sfx
    if (sfxSrc) {
      const sfx = new Audio(sfxSrc)
      sfx.volume = 1
      sfx.play().catch(() => {})
    }

    // Skip crossfade if same src
    if (newSrc === currentSrc.current) return
    currentSrc.current = newSrc

    const outgoingSlot = activeSlot.current
    const incomingSlot = outgoingSlot === 'A' ? 'B' : 'A'
    const outgoing = outgoingSlot === 'A' ? nodeA.current : nodeB.current
    const incoming = incomingSlot === 'A' ? nodeA.current : nodeB.current

    clearTimers()

    // Fade out outgoing
    if (outgoing && !outgoing.paused) {
      const id = fadeVolume(outgoing, 0, () => {
        outgoing.pause()
        outgoing.src = ''
      })
      timerIds.current.push(id)
    }

    // Start incoming
    if (incoming && newSrc) {
      incoming.src = newSrc
      incoming.loop = loop
      incoming.volume = 0
      incoming.play().catch(() => {})
      const id = fadeVolume(incoming, targetVol)
      timerIds.current.push(id)
      activeSlot.current = incomingSlot
    }
  }, [activeCanvas?.id, audioUnlocked]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      clearTimers()
      if (nodeA.current) { nodeA.current.pause(); nodeA.current.src = '' }
      if (nodeB.current) { nodeB.current.pause(); nodeB.current.src = '' }
    }
  }, [])

  return (
    <>
      <audio ref={nodeA} style={{ display: 'none' }} />
      <audio ref={nodeB} style={{ display: 'none' }} />
    </>
  )
}
