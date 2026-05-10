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
    case 'image':
      return <ImageActor actor={actor} />
    default:
      return null
  }
}

function LogoActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}
  const tr = actor.transform ?? {}

  const opacity = (tr.opacity as number) ?? 1
  const size = (vs.size as number) ?? 120
  const color = (vs.color as string) ?? '#ffffff'
  const fontSize = (vs.font_size as number) ?? 13
  const fontWeight = (vs.font_weight as string) ?? '300'
  const text = (vs.text as string) ?? 'AV'

  return (
    <div style={{ opacity, width: size, height: size }} className="flex items-center justify-center">
      {(vs.src as string) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={vs.src as string}
          alt={actor.name ?? 'logo'}
          className="w-full h-full object-contain"
        />
      ) : (
        <span
          style={{ color, fontSize, fontWeight, letterSpacing: '0.25em' }}
          className="uppercase"
        >
          {text}
        </span>
      )}
    </div>
  )
}

function OrbActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}

  const size = (vs.size as number) ?? 200
  const color = (vs.color as string) ?? '#ffffff'
  const blur = (vs.blur as number) ?? 40

  // Opacity is controlled entirely by the parent OrbitalInteractionModule animation.
  // Do NOT apply additional opacity here — it would multiply and make the orb invisible.
  return (
    <div
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, ${color}88 30%, transparent 70%)`,
        borderRadius: '50%',
        filter: `blur(${blur}px)`,
      }}
    />
  )
}

function TextActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}
  const tr = actor.transform ?? {}

  return (
    <span
      style={{
        fontSize: (vs.font_size as number) ?? 16,
        fontWeight: (vs.font_weight as string) ?? '300',
        color: (vs.color as string) ?? '#ffffff',
        opacity: (tr.opacity as number) ?? 1,
        letterSpacing: '0.05em',
      }}
    >
      {(vs.text as string) ?? ''}
    </span>
  )
}

function ImageActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}
  const tr = actor.transform ?? {}

  const src = vs.src as string
  const size = (vs.size as number) ?? 200
  const opacity = (tr.opacity as number) ?? 1

  if (!src) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={actor.name ?? 'image'}
      style={{ width: size, height: 'auto', opacity }}
      className="object-contain"
    />
  )
}
