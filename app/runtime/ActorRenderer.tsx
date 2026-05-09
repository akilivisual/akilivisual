'use client'

import type { Actor } from '@/lib/schema/types'

interface ActorRendererProps {
  actor: Actor
}

export function ActorRenderer({ actor }: ActorRendererProps) {
  switch (actor.actor_type) {
    case 'logo':
      return <LogoActor actor={actor} />
    case 'orb':
      return <OrbActor actor={actor} />
    case 'text':
      return <TextActor actor={actor} />
    default:
      return null
  }
}

function LogoActor({ actor }: { actor: Actor }) {
  const { visual_schema, transform } = actor
  const size = visual_schema?.size ?? 120
  const opacity = transform?.opacity ?? 1

  return (
    <div
      style={{ opacity, width: size, height: size }}
      className="flex items-center justify-center"
    >
      {visual_schema?.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={visual_schema.src} alt={actor.name ?? 'logo'} className="w-full h-full object-contain" />
      ) : (
        <span className="text-white font-bold tracking-widest uppercase text-sm">
          {visual_schema?.text ?? 'AV'}
        </span>
      )}
    </div>
  )
}

function OrbActor({ actor }: { actor: Actor }) {
  const { visual_schema, transform } = actor
  const size = visual_schema?.size ?? 200
  const color = visual_schema?.color ?? '#ffffff'
  const blur = visual_schema?.blur ?? 40
  const opacity = transform?.opacity ?? 0.6

  return (
    <div
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: `blur(${blur}px)`,
        opacity,
      }}
    />
  )
}

function TextActor({ actor }: { actor: Actor }) {
  const { visual_schema, transform } = actor
  return (
    <span
      style={{
        fontSize: visual_schema?.font_size ?? 16,
        fontWeight: visual_schema?.font_weight ?? 'normal',
        color: visual_schema?.color ?? '#ffffff',
        opacity: transform?.opacity ?? 1,
      }}
    >
      {visual_schema?.text ?? ''}
    </span>
  )
}
