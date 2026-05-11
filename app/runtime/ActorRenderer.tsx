'use client'

import { motion } from 'framer-motion'
import type { Actor } from '@/lib/schema/types'

interface ActorRendererProps {
  actor: Actor
}

// Renders an actor as a flex item with auto-layout + fine pixel control.
// Module containers provide the flex context; this handles per-actor overrides.
// moduleMotion is module.motion_profile — when loop=true an ambient outer layer runs after entrance.
export function FlexActor({ actor, moduleMotion }: { actor: Actor; moduleMotion?: Record<string, unknown> }) {
  const tr = (actor.transform ?? {}) as Record<string, unknown>
  const ms = (actor.motion_schema ?? {}) as Record<string, unknown>

  const alignSelf = (tr.align_self as string) ?? 'auto'
  const mt = (tr.margin_top as number) ?? 0
  const mr = (tr.margin_right as number) ?? 0
  const mb = (tr.margin_bottom as number) ?? 0
  const ml = (tr.margin_left as number) ?? 0
  // Fine pixel nudge on top of flow — does NOT affect neighbouring actors
  const ox = (tr.offset_x as number) ?? 0
  const oy = (tr.offset_y as number) ?? 0

  const scaleVal = (tr.scale as number) ?? 1
  const rotateVal = (tr.rotate as number) ?? 0
  const opacityVal = (tr.opacity as number) ?? 1
  const duration = (ms.duration as number) ?? 1.2
  const delay = (ms.delay as number) ?? 0
  const preset = (ms.preset as string) ?? 'phase_in'

  const easeOut = { duration, delay, ease: 'easeOut' as const }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initial: any, animate: any, transition: any = easeOut

  // Final resting state always includes the fine offset and visual props
  const rest = { opacity: opacityVal, scale: scaleVal, rotate: rotateVal, x: ox, y: oy }

  switch (preset) {
    case 'fade_in':
      initial = { ...rest, opacity: 0 }
      animate = rest
      break
    case 'slide_up':
      initial = { ...rest, opacity: 0, y: oy + 60 }
      animate = rest
      break
    case 'slide_down':
      initial = { ...rest, opacity: 0, y: oy - 60 }
      animate = rest
      break
    case 'slide_left':
      initial = { ...rest, opacity: 0, x: ox + 60 }
      animate = rest
      break
    case 'slide_right':
      initial = { ...rest, opacity: 0, x: ox - 60 }
      animate = rest
      break
    case 'scale_in':
      initial = { ...rest, opacity: 0, scale: scaleVal * 0.5 }
      animate = rest
      break
    case 'pulse':
      initial = rest
      animate = { ...rest, opacity: [opacityVal, opacityVal * 0.2, opacityVal] }
      transition = { duration, delay, repeat: Infinity, ease: 'easeInOut' }
      break
    case 'none':
      initial = rest
      animate = rest
      transition = { duration: 0, delay: 0 }
      break
    default: // 'phase_in'
      initial = { ...rest, opacity: 0, scale: scaleVal * 0.92 }
      animate = rest
      break
  }

  const hidden = !!(actor.metadata as Record<string, unknown>)?.hidden
  if (hidden) return null

  const outerStyle = { alignSelf, marginTop: mt, marginRight: mr, marginBottom: mb, marginLeft: ml }

  // Entrance motion — always present
  const entrance = (
    <motion.div initial={initial} animate={animate} transition={transition}>
      <ActorRenderer actor={actor} />
    </motion.div>
  )

  // Module ambient loop — runs after entrance settles, skipped if actor already pulses
  const hasAmbient = !!(moduleMotion?.loop) && preset !== 'pulse'
  if (!hasAmbient) {
    return <div style={outerStyle}>{entrance}</div>
  }

  const ambientDelay = duration + delay + ((moduleMotion?.delay as number) ?? 0)
  const opMin = (moduleMotion?.opacity_min as number) ?? 0.7
  const opMax = (moduleMotion?.opacity_max as number) ?? 1
  const scMin = (moduleMotion?.scale_min as number) ?? 1
  const scMax = (moduleMotion?.scale_max as number) ?? 1
  const ambientDur = (moduleMotion?.duration as number) ?? 3

  return (
    <motion.div
      style={outerStyle}
      animate={{ opacity: [opMin, opMax, opMin], scale: [scMin, scMax, scMin] }}
      transition={{ duration: ambientDur, delay: ambientDelay, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }}
    >
      {entrance}
    </motion.div>
  )
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
    case 'media':
      return <MediaActor actor={actor} />
    case 'embed':
      return <EmbedActor actor={actor} />
    case 'custom':
      return null
    default:
      return null
  }
}

function LogoActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}

  const size = (vs.size as number) ?? 120
  const color = (vs.color as string) ?? '#ffffff'
  const fontSize = (vs.font_size as number) ?? 13
  const fontWeight = (vs.font_weight as string) ?? '300'
  const text = (vs.text as string) ?? 'AV'

  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center">
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
  const text = (vs.text as string) ?? ''
  const hasHtml = /<[a-z][\s\S]*>/i.test(text)
  const style = {
    fontSize: (vs.font_size as number) ?? 16,
    fontWeight: (vs.font_weight as string) ?? '300',
    color: (vs.color as string) ?? '#ffffff',
    letterSpacing: '0.05em',
  }
  if (hasHtml) return <span style={style} dangerouslySetInnerHTML={{ __html: text }} />
  return <span style={style}>{text}</span>
}

function ImageActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}
  const src = vs.src as string
  const size = (vs.size as number) ?? 200

  if (!src) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={actor.name ?? 'image'}
      style={{ width: size, height: 'auto' }}
      className="object-contain"
    />
  )
}

function MediaActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}
  const src = vs.src as string
  const mediaType = (vs.media_type as string) ?? 'video'
  const width = (vs.width as number) ?? 400
  const height = (vs.height as number) ?? 300
  const autoplay = (vs.autoplay as boolean) ?? true
  const loop = (vs.loop as boolean) ?? true

  if (!src) return null

  if (mediaType === 'audio') {
    return <audio src={src} autoPlay={autoplay} loop={loop} controls />
  }

  if (mediaType === 'video') {
    return (
      <video
        src={src}
        autoPlay={autoplay}
        loop={loop}
        muted
        playsInline
        style={{ width, height, objectFit: 'cover' }}
      />
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={actor.name ?? 'media'} style={{ width, height: 'auto' }} className="object-contain" />
}

function EmbedActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}
  const tr = actor.transform ?? {}

  const embedType = (vs.embed_type as string) ?? 'iframe'
  const url = (vs.url as string) ?? ''
  const html = (vs.html as string) ?? ''
  const width = (vs.width as number) ?? 400
  const height = (vs.height as number) ?? 300
  const opacity = (tr.opacity as number) ?? 1

  const containerStyle: React.CSSProperties = { width, height, overflow: 'hidden', border: 'none' }

  if (embedType === 'spline') {
    if (!url) return null
    const src = !url.includes('hide_ui') ? `${url}${url.includes('?') ? '&' : '?'}hide_ui=1` : url
    return (
      <div style={containerStyle}>
        <iframe src={src} sandbox="allow-scripts allow-same-origin" allow="autoplay; fullscreen" style={{ width: '100%', height: '100%', border: 'none' }} />
      </div>
    )
  }

  if (embedType === 'html') {
    if (!html) return null
    return (
      <div style={containerStyle}>
        <iframe srcDoc={html} sandbox="allow-scripts allow-forms" style={{ width: '100%', height: '100%', border: 'none' }} />
      </div>
    )
  }

  // iframe (default)
  if (!url) return null
  return (
    <div style={containerStyle}>
      <iframe src={url} sandbox="allow-same-origin" loading="lazy" style={{ width: '100%', height: '100%', border: 'none' }} />
    </div>
  )
}
