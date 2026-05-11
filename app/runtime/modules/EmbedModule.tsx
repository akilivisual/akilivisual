'use client'

import { motion } from 'framer-motion'
import type { ModuleWithActors } from '@/lib/schema/types'

interface EmbedModuleProps {
  module: ModuleWithActors
}

export function EmbedModule({ module }: EmbedModuleProps) {
  const props = module.props ?? {}
  const embedType = (props.embed_type as string) ?? 'iframe'
  const width = (props.width as number | null) ?? null
  const height = (props.height as number) ?? 500
  const opacity = (props.opacity as number) ?? 1
  const borderRadius = (props.border_radius as number) ?? 0

  const pos = (module.position ?? {}) as { x?: number; y?: number }

  return (
    <motion.div
      className="absolute"
      style={getEmbedPosition(pos.x, pos.y)}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div
        style={{
          width: width ? width : '100vw',
          height,
          borderRadius,
          overflow: 'hidden',
        }}
      >
        {embedType === 'iframe' && <IframeEmbed props={props} />}
        {embedType === 'spline' && <SplineEmbed props={props} />}
        {embedType === 'html' && <HtmlEmbed props={props} />}
        {embedType === 'json' && <JsonEmbed props={props} />}
      </div>
    </motion.div>
  )
}

function getEmbedPosition(x?: number, y?: number): React.CSSProperties {
  if (x !== undefined && y !== undefined) {
    return { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }
  }
  return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
}

function IframeEmbed({ props }: { props: Record<string, unknown> }) {
  const url = (props.url as string) ?? ''
  const allowScripts = (props.allow_scripts as boolean) ?? false
  const sandbox = allowScripts ? 'allow-same-origin allow-scripts' : 'allow-same-origin'

  if (!url) return <EmptyState label="No URL set" />

  return (
    <iframe
      src={url}
      sandbox={sandbox}
      loading="lazy"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  )
}

function SplineEmbed({ props }: { props: Record<string, unknown> }) {
  const url = (props.url as string) ?? ''
  const hideUi = (props.hide_ui as boolean) ?? true

  if (!url) return <EmptyState label="No Spline URL set" />

  const src = hideUi && !url.includes('hide_ui')
    ? `${url}${url.includes('?') ? '&' : '?'}hide_ui=1`
    : url

  return (
    <iframe
      src={src}
      sandbox="allow-scripts allow-same-origin"
      allow="autoplay; fullscreen"
      loading="lazy"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  )
}

function HtmlEmbed({ props }: { props: Record<string, unknown> }) {
  const html = (props.html as string) ?? ''

  if (!html) return <EmptyState label="No HTML set" />

  return (
    <iframe
      srcDoc={html}
      sandbox="allow-scripts allow-forms"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  )
}

function JsonEmbed({ props }: { props: Record<string, unknown> }) {
  const raw = (props.json_data as string) ?? ''
  const maxHeight = (props.max_height as number) ?? 400

  let formatted = raw
  try {
    formatted = JSON.stringify(JSON.parse(raw), null, 2)
  } catch { /* render raw if not valid JSON */ }

  return (
    <div style={{ maxHeight, overflow: 'auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
      <pre style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap' }}>
        {formatted || '{}'}
      </pre>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
      {label}
    </div>
  )
}
