'use client'

import { useState, useTransition } from 'react'
import type { ModuleWithActors } from '@/lib/schema/types'
import { submitFormAction } from '@/app/admin/actions/forms'

interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea'
  placeholder?: string
  required?: boolean
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#ffffff',
  fontSize: 12,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  borderRadius: 0,
  appearance: 'none',
  WebkitAppearance: 'none',
}

export function FormModule({ module, context = 'canvas' }: { module: ModuleWithActors; context?: 'canvas' | 'tray' }) {
  const props = module.props as Record<string, unknown>
  const fields = (props.fields as FormField[]) ?? []
  const submitLabel = (props.submit_label as string) ?? 'Send'
  const successMessage = (props.success_message as string) ?? 'Thank you.'

  const [values, setValues] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  if (fields.length === 0) return null

  function handleChange(id: string, value: string) {
    setValues(v => ({ ...v, [id]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await submitFormAction(module.id, values)
      if (result.ok) {
        setSubmitted(true)
      } else {
        setError(result.error ?? 'Something went wrong')
      }
    })
  }

  const isTray = context === 'tray'

  if (submitted) {
    return (
      <div
        className={isTray ? 'flex items-center justify-center py-10' : 'absolute inset-0 flex items-center justify-center'}
        style={{ pointerEvents: 'none' }}
      >
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '300', letterSpacing: '0.1em' }}>
          {successMessage}
        </p>
      </div>
    )
  }

  return (
    <form
      className={isTray ? 'flex flex-col gap-4' : 'absolute inset-0 flex flex-col justify-center gap-4'}
      style={{ padding: isTray ? '24px' : '24px 32px', pointerEvents: 'auto' }}
      onSubmit={handleSubmit}
    >
      {fields.map(field => (
        <div key={field.id} className="flex flex-col gap-1">
          {field.label && (
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {field.label}{field.required && ' *'}
            </label>
          )}
          {field.type === 'textarea' ? (
            <textarea
              required={field.required}
              placeholder={field.placeholder ?? ''}
              value={values[field.id] ?? ''}
              onChange={e => handleChange(field.id, e.target.value)}
              style={{ ...inputStyle, resize: 'none', height: 96 }}
            />
          ) : (
            <input
              type={field.type ?? 'text'}
              required={field.required}
              placeholder={field.placeholder ?? ''}
              value={values[field.id] ?? ''}
              onChange={e => handleChange(field.id, e.target.value)}
              style={inputStyle}
            />
          )}
        </div>
      ))}

      {error && (
        <p style={{ color: '#ef4444', fontSize: 11, letterSpacing: '0.05em' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          marginTop: 4,
          padding: '10px 24px',
          alignSelf: 'flex-start',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.25)',
          color: 'rgba(255,255,255,0.8)',
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.5 : 1,
          transition: 'opacity 0.2s, border-color 0.2s',
        }}
      >
        {isPending ? '...' : submitLabel}
      </button>
    </form>
  )
}
