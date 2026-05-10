'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { seedCanvas0001 } from '@/app/admin/actions/seed'

type State = 'idle' | 'loading' | 'success' | 'error'

export function SeedButton() {
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSeed() {
    setState('loading')
    try {
      const result = await seedCanvas0001()
      if (result.ok) {
        setState('success')
        setMessage(result.message)
        setTimeout(() => router.refresh(), 800)
      } else {
        setState('error')
        setMessage(result.error)
      }
    } catch (e) {
      setState('error')
      setMessage(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleSeed}
        disabled={state === 'loading' || state === 'success'}
        className="
          px-6 py-2.5 border text-[11px] tracking-[0.25em] uppercase transition-all
          disabled:opacity-40 disabled:cursor-not-allowed
          border-white/30 text-white/70
          hover:border-white/70 hover:text-white
          active:scale-[0.98]
        "
      >
        {state === 'loading' && (
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-white/60 animate-pulse" />
            Seeding...
          </span>
        )}
        {state === 'idle' && 'Seed Canvas_0001'}
        {state === 'success' && '✓ Seeded'}
        {state === 'error' && 'Retry Seed'}
      </button>

      {message && (
        <p className={`text-[10px] tracking-[0.1em] ${state === 'error' ? 'text-red-400/60' : 'text-white/30'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
