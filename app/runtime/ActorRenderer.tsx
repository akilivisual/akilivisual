'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import type { Actor, KeyframePoint } from '@/lib/schema/types'
import { useMagnetic } from './hooks/useMagnetic'

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
  let initial: any, animateTo: any, transition: any = easeOut

  const rest = { opacity: opacityVal, scale: scaleVal, rotate: rotateVal, x: ox, y: oy }

  // ── Keyframe mode — when motion_schema.keyframes has ≥2 points on any track ──
  const kf = (ms.keyframes ?? {}) as Record<string, KeyframePoint[]>
  const hasKF = Object.values(kf).some(track => Array.isArray(track) && track.length >= 2)

  if (hasKF) {
    const vals = (track?: KeyframePoint[]) => track?.map(k => k.v)
    const times = (track?: KeyframePoint[]) => track?.map(k => k.t)
    const looping = !!(ms.loop)

    initial = {
      opacity: kf.opacity?.[0]?.v ?? opacityVal,
      scale:   kf.scale?.[0]?.v   ?? scaleVal,
      x:       kf.x?.[0]?.v       ?? ox,
      y:       kf.y?.[0]?.v       ?? oy,
      rotate:  kf.rotate?.[0]?.v  ?? rotateVal,
    }
    animateTo = {
      ...(kf.opacity ? { opacity: vals(kf.opacity) } : {}),
      ...(kf.scale   ? { scale:   vals(kf.scale)   } : {}),
      ...(kf.x       ? { x:       vals(kf.x)       } : {}),
      ...(kf.y       ? { y:       vals(kf.y)       } : {}),
      ...(kf.rotate  ? { rotate:  vals(kf.rotate)  } : {}),
      ...(kf.zIndex  ? { zIndex:  vals(kf.zIndex)  } : {}),
    }
    transition = {
      duration, delay, ease: 'easeOut' as const,
      ...(looping ? { repeat: Infinity, repeatType: 'loop' as const } : {}),
      ...(kf.opacity ? { opacity: { times: times(kf.opacity) } } : {}),
      ...(kf.scale   ? { scale:   { times: times(kf.scale)   } } : {}),
      ...(kf.x       ? { x:       { times: times(kf.x)       } } : {}),
      ...(kf.y       ? { y:       { times: times(kf.y)       } } : {}),
      ...(kf.rotate  ? { rotate:  { times: times(kf.rotate)  } } : {}),
      ...(kf.zIndex  ? { zIndex:  { times: times(kf.zIndex)  } } : {}),
    }
  } else switch (preset) {
    case 'fade_in':
      initial = { ...rest, opacity: 0 }
      animateTo = rest
      break
    case 'slide_up':
      initial = { ...rest, opacity: 0, y: oy + 60 }
      animateTo = rest
      break
    case 'slide_down':
      initial = { ...rest, opacity: 0, y: oy - 60 }
      animateTo = rest
      break
    case 'slide_left':
      initial = { ...rest, opacity: 0, x: ox + 60 }
      animateTo = rest
      break
    case 'slide_right':
      initial = { ...rest, opacity: 0, x: ox - 60 }
      animateTo = rest
      break
    case 'scale_in':
      initial = { ...rest, opacity: 0, scale: scaleVal * 0.5 }
      animateTo = rest
      break
    case 'pulse':
      initial = rest
      animateTo = { ...rest, opacity: [opacityVal, opacityVal * 0.2, opacityVal] }
      transition = { duration, delay, repeat: Infinity, ease: 'easeInOut' }
      break
    case 'none':
      initial = rest
      animateTo = rest
      transition = { duration: 0, delay: 0 }
      break
    default: // 'phase_in'
      initial = { ...rest, opacity: 0, scale: scaleVal * 0.92 }
      animateTo = rest
      break
  }

  const hidden = !!(actor.metadata as Record<string, unknown>)?.hidden

  // Viewport detection — replay entrance each time the actor scrolls into view
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { amount: 0.1, once: false })
  const controls = useAnimation()

  useEffect(() => {
    if (hidden) return
    if (inView) {
      controls.start({ ...animateTo, transition })
    } else if (hasKF || preset !== 'none') {
      controls.set(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hidden])

  // Magnetic pull — logo/text only, driven by cursor proximity
  const is = (actor.interaction_schema ?? {}) as Record<string, unknown>
  const magEnabled = !hidden && (actor.actor_type === 'logo' || actor.actor_type === 'text') && !!is.magnetic_enabled
  const { ref: magRef, mx: magX, my: magY } = useMagnetic(
    (is.magnetic_radius as number) ?? 150,
    (is.magnetic_strength as number) ?? 0.4,
    magEnabled
  )

  if (hidden) return null

  const fullWidth = !!(actor.visual_schema as Record<string, unknown>)?.full_width
  const outerStyle = {
    alignSelf, marginTop: mt, marginRight: mr, marginBottom: mb, marginLeft: ml,
    ...(fullWidth ? { position: 'relative' as const, width: '100%', height: '100%', flex: '1 1 auto', minWidth: 0, minHeight: 0 } : {}),
  }

  // Entrance motion gated on inView
  const entrance = (
    <motion.div
      initial={initial}
      animate={controls}
      style={fullWidth ? { width: '100%', height: '100%' } : undefined}
    >
      <ActorRenderer actor={actor} />
    </motion.div>
  )

  // Magnetic wrapper — wraps entrance when enabled
  const withMagnetic = magEnabled ? (
    <motion.div ref={magRef} style={{ x: magX, y: magY }}>
      {entrance}
    </motion.div>
  ) : entrance

  // Module ambient loop — runs after entrance settles, skipped if actor already pulses
  const hasAmbient = !!(moduleMotion?.loop) && !hasKF && preset !== 'pulse'
  const ambientEasing = (moduleMotion?.easing_type as string) ?? 'easeInOut'
  const speed = (moduleMotion?.pulse_speed as number) ?? 1

  if (!hasAmbient) {
    return <div ref={containerRef} style={outerStyle}>{withMagnetic}</div>
  }

  const ambientDelay = duration + delay + ((moduleMotion?.delay as number) ?? 0)
  const ambientDur = ((moduleMotion?.duration as number) ?? 3) / Math.max(speed, 0.1)

  // Module keyframes take precedence over min/max sliders when present
  const mkf = (moduleMotion?.keyframes ?? {}) as Record<string, KeyframePoint[]>
  const hasMKF = Object.values(mkf).some(t => Array.isArray(t) && t.length >= 2)

  const ambientAnimate = hasMKF
    ? {
        ...(mkf.opacity ? { opacity: mkf.opacity.map(k => k.v) } : {}),
        ...(mkf.scale   ? { scale:   mkf.scale.map(k => k.v)   } : {}),
      }
    : {
        opacity: [(moduleMotion?.opacity_min as number) ?? 0.7, (moduleMotion?.opacity_max as number) ?? 1, (moduleMotion?.opacity_min as number) ?? 0.7],
        scale:   [(moduleMotion?.scale_min   as number) ?? 1,   (moduleMotion?.scale_max   as number) ?? 1, (moduleMotion?.scale_min   as number) ?? 1],
      }

  const ambientTransition = hasMKF
    ? {
        duration: ambientDur, delay: ambientDelay, repeat: Infinity, ease: ambientEasing, repeatType: 'loop' as const,
        ...(mkf.opacity ? { opacity: { times: mkf.opacity.map(k => k.t) } } : {}),
        ...(mkf.scale   ? { scale:   { times: mkf.scale.map(k => k.t)   } } : {}),
      }
    : { duration: ambientDur, delay: ambientDelay, repeat: Infinity, ease: ambientEasing, repeatType: 'loop' as const }

  return (
    <motion.div
      ref={containerRef}
      style={outerStyle}
      animate={ambientAnimate}
      transition={ambientTransition}
    >
      {withMagnetic}
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
  const fontFamily = vs.font_family as string | undefined
  const style = {
    fontSize: (vs.font_size as number) ?? 16,
    fontWeight: (vs.font_weight as string) ?? '300',
    color: (vs.color as string) ?? '#ffffff',
    letterSpacing: '0.05em',
    fontFamily: fontFamily && fontFamily !== 'inherit' ? `'${fontFamily}', sans-serif` : undefined,
  }
  if (hasHtml) return <span style={style} dangerouslySetInnerHTML={{ __html: text }} />
  return <span style={style}>{text}</span>
}

function buildMask(preset: string, spread: number): React.CSSProperties {
  if (!preset || preset === 'none') return {}
  const stop = `${Math.round(spread)}%`
  let g = ''
  switch (preset) {
    case 'fade_edges':  g = `radial-gradient(ellipse at center, black ${stop}, transparent 100%)`; break
    case 'vignette':    g = `radial-gradient(ellipse at center, transparent 0%, black ${stop}, black 100%)`; break
    case 'fade_bottom': g = `linear-gradient(to bottom, black ${stop}, transparent 100%)`; break
    case 'fade_top':    g = `linear-gradient(to top, black ${stop}, transparent 100%)`; break
    case 'fade_left':   g = `linear-gradient(to left, black ${stop}, transparent 100%)`; break
    case 'fade_right':  g = `linear-gradient(to right, black ${stop}, transparent 100%)`; break
    case 'fade_h':      g = `linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)`; break
    case 'fade_v':      g = `linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)`; break
    default: return {}
  }
  return { WebkitMaskImage: g, maskImage: g }
}

function ImageActor({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}
  const src = vs.src as string
  const size = (vs.size as number) ?? 200
  const fullWidth = (vs.full_width as boolean) ?? false
  const objectFit = ((vs.object_fit as string) ?? 'cover') as React.CSSProperties['objectFit']
  const maskStyle = buildMask((vs.mask_preset as string) ?? 'none', (vs.mask_spread as number) ?? 60)

  if (!src) return null

  if (fullWidth) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={actor.name ?? 'image'}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit, display: 'block', ...maskStyle }}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={actor.name ?? 'image'}
      style={{ width: size, height: 'auto', ...maskStyle }}
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
  const fullWidth = (vs.full_width as boolean) ?? false
  const objectFit = ((vs.object_fit as string) ?? 'cover') as React.CSSProperties['objectFit']
  const maskStyle = buildMask((vs.mask_preset as string) ?? 'none', (vs.mask_spread as number) ?? 60)

  if (!src) return null

  if (mediaType === 'audio') {
    return <CustomAudioPlayer actor={actor} />
  }

  if (mediaType === 'video') {
    const videoStyle = fullWidth
      ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit, ...maskStyle }
      : { width, height, objectFit: 'cover' as const, ...maskStyle }
    return (
      <video src={src} autoPlay={autoplay} loop={loop} muted playsInline style={videoStyle} />
    )
  }

  // gif
  const gifStyle = fullWidth
    ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit, display: 'block', ...maskStyle }
    : { width, height: 'auto' as const, ...maskStyle }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={actor.name ?? 'media'} style={gifStyle} className={fullWidth ? undefined : 'object-contain'} />
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

function CustomAudioPlayer({ actor }: { actor: Actor }) {
  const vs = actor.visual_schema ?? {}
  const src = vs.src as string
  const loop = (vs.loop as boolean) ?? true
  const autoplay = (vs.autoplay as boolean) ?? true
  const width = (vs.width as number) ?? 320
  const bg = (vs.player_bg as string) ?? '#000000'
  const bgOpacity = (vs.player_bg_opacity as number) ?? 0.6
  const bgImage = vs.player_bg_image as string | undefined
  const accent = (vs.player_accent as string) ?? '#ffffff'
  const textColor = (vs.player_text as string) ?? '#ffffff'
  const radius = (vs.player_radius as number) ?? 0

  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(true)
  const [hovered, setHovered] = useState(false)
  // Flipped to true the moment the user explicitly presses play or the speaker button.
  // While false, hover controls the mute state; once true, hover no longer affects it.
  const userChoseSound = useRef(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.addEventListener('play', () => setPlaying(true))
    audio.addEventListener('pause', () => setPlaying(false))
    audio.addEventListener('ended', () => setPlaying(false))
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))

    if (autoplay) {
      audio.muted = true
      // Try immediately; if not ready yet, try again on canplay
      const tryPlay = () => { audio.muted = true; audio.play().catch(() => {}) }
      if (audio.readyState >= 2) {
        tryPlay()
      } else {
        audio.addEventListener('canplay', tryPlay, { once: true })
      }
    }
  }, [])

  function doUnmute() {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = false
    setMuted(false)
  }

  function doMute() {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = true
    setMuted(true)
  }

  function handlePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      // Pressing play always commits to sound — no more hover-controlled muting
      userChoseSound.current = true
      doUnmute()
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }

  function handleSpeaker() {
    if (muted) {
      userChoseSound.current = true
      doUnmute()
    } else {
      userChoseSound.current = false
      doMute()
    }
  }

  function handleMouseEnter() {
    setHovered(true)
    if (userChoseSound.current) return
    const audio = audioRef.current
    if (!audio) return
    doUnmute()
    // Fallback: start playing if autoplay was blocked
    if (audio.paused) audio.play().catch(() => {})
  }

  function handleMouseLeave() {
    setHovered(false)
    if (userChoseSound.current) return
    doMute()
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration
  }

  function fmt(s: number) {
    if (!isFinite(s) || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  if (!src) return null

  const progress = duration ? currentTime / duration : 0

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        scale: hovered ? 1.02 : 1,
        boxShadow: hovered ? `0 0 20px ${accent}22` : '0 0 0px transparent',
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ pointerEvents: 'auto', borderRadius: radius, display: 'inline-block' }}
    >
      <div style={{ width, position: 'relative', borderRadius: radius, overflow: 'hidden' }}>
        {/* Skinnable background layer — separate from content so opacity doesn't bleed */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: bg,
          opacity: bgOpacity,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        {/* Controls */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <audio ref={audioRef} src={src} loop={loop} preload="auto" />
          <button
            onClick={handlePlay}
            style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            {playing
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill={accent}><rect x="2" y="1" width="4" height="12" rx="1"/><rect x="8" y="1" width="4" height="12" rx="1"/></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill={accent}><polygon points="2,1 13,7 2,13"/></svg>
            }
          </button>
          <button
            onClick={handleSpeaker}
            style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            {muted
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <polygon points="1,4 5,4 9,1 9,13 5,10 1,10" fill={accent}/>
                  <line x1="11" y1="4" x2="13" y2="10" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="13" y1="4" x2="11" y2="10" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <polygon points="1,4 5,4 9,1 9,13 5,10 1,10" fill={accent}/>
                  <path d="M11,3.5 Q14,7 11,10.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
            }
          </button>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div
              onClick={seek}
              style={{ height: 2, backgroundColor: `${accent}33`, borderRadius: 1, cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: accent, borderRadius: 1, transition: 'width 0.1s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: textColor, opacity: 0.5, letterSpacing: '0.06em' }}>
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
