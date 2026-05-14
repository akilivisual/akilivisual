'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { deleteCanvas } from '@/app/admin/actions/canvas'

interface DeleteCanvasButtonProps {
  canvasId: string
  canvasTitle: string
}

export function DeleteCanvasButton({ canvasId, canvasTitle }: DeleteCanvasButtonProps) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setDeleting(true)
    const result = await deleteCanvas(canvasId)
    if (!result.ok) {
      setDeleting(false)
      setError(result.error ?? 'Failed to delete')
    }
    // on success, server action redirects to /admin
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 border border-red-900/40 text-[11px] tracking-[0.2em] uppercase text-red-400/50 hover:text-red-400 hover:border-red-400/40 transition-colors"
      >
        Delete
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setOpen(false)}
            />

            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-[420px] bg-[#080808] border border-white/10 p-8"
              initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
              transition={{ duration: 0.16 }}
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-red-400/60 mb-4">Destructive Action</p>
              <h2 className="text-base font-light tracking-wide text-white mb-2">Delete State</h2>
              <p className="text-[12px] text-white/40 leading-relaxed mb-1">
                This will permanently delete{' '}
                <span className="text-white/70">{canvasTitle}</span>{' '}
                along with all its modules and actors.
              </p>
              <p className="text-[11px] text-white/25 mb-8">This cannot be undone.</p>

              {error && (
                <p className="text-[11px] text-red-400/70 mb-4">{error}</p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-[11px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={confirm}
                  disabled={deleting}
                  className="px-5 py-2 border border-red-700/50 text-[11px] tracking-[0.2em] uppercase text-red-400/80 hover:text-red-300 hover:border-red-500/60 transition-colors disabled:opacity-40"
                >
                  {deleting ? 'Deleting...' : 'Delete State'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
