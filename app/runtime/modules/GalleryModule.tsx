'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ModuleWithActors } from '@/lib/schema/types'

export function GalleryModule({ module }: { module: ModuleWithActors }) {
  const props = module.props as Record<string, unknown>
  const images = (props.images as string[]) ?? []
  const autoAdvance = (props.auto_advance as boolean) ?? false
  const interval = ((props.auto_interval as number) ?? 5) * 1000
  const duration = (props.transition_duration as number) ?? 0.8
  const objectFit = ((props.object_fit as string) ?? 'cover') as React.CSSProperties['objectFit']

  const [current, setCurrent] = useState(0)
  const count = images.length

  const prev = useCallback(() => setCurrent(i => (i - 1 + count) % count), [count])
  const next = useCallback(() => setCurrent(i => (i + 1) % count), [count])

  useEffect(() => {
    if (!autoAdvance || count <= 1) return
    const t = setInterval(next, interval)
    return () => clearInterval(t)
  }, [autoAdvance, interval, next, count])

  if (count === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'auto' }}>
      {/* Images — all mounted, pure opacity crossfade so only pixel-level changes are visible */}
      {images.map((src, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: `opacity ${duration}s ease-in-out`,
            zIndex: i === current ? 1 : 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit, display: 'block' }}
          />
        </div>
      ))}

      {/* Click zones — left third prev, right third next */}
      {count > 1 && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 z-10 cursor-pointer"
            style={{ width: '35%', pointerEvents: 'auto' }}
            onClick={prev}
          />
          <div
            className="absolute right-0 top-0 bottom-0 z-10 cursor-pointer"
            style={{ width: '35%', pointerEvents: 'auto' }}
            onClick={next}
          />
        </>
      )}

      {/* Dot indicators — bottom center, minimal */}
      {count > 1 && (
        <div
          className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2"
          style={{ pointerEvents: 'auto' }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
              style={{
                width: i === current ? 18 : 5,
                height: 2,
                borderRadius: 1,
                backgroundColor: i === current ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width 0.3s ease, background-color 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
