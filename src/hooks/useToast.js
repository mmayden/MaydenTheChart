/**
 * useToast — Zustand-based toast notification store.
 *
 * Usage:
 *   import { useToast } from '../hooks/useToast'
 *   const toast = useToast()
 *   toast.add({ message: 'Symbol changed to AAPL', type: 'info' })
 *
 * Store shape:
 *   toasts   — array of { id, message, type, createdAt }
 *   add()    — push a toast, auto-remove after `duration` ms
 *   remove() — dismiss a specific toast by id
 *
 * Types: 'info' | 'success' | 'warning' | 'error'
 */

import { create } from 'zustand'

const MAX_VISIBLE = 5

export const useToast = create((set, get) => ({
  toasts: [],

  /**
   * Add a toast notification.
   * @param {{ message: string, type?: 'info'|'success'|'warning'|'error', duration?: number }} opts
   */
  add: ({ message, type = 'info', duration = 4000 }) => {
    const id = crypto.randomUUID()
    const toast = { id, message, type, createdAt: Date.now() }

    set((state) => {
      const next = [...state.toasts, toast]
      // enforce max visible — drop oldest if exceeded
      if (next.length > MAX_VISIBLE) {
        return { toasts: next.slice(next.length - MAX_VISIBLE) }
      }
      return { toasts: next }
    })

    // auto-remove after duration
    setTimeout(() => get().remove(id), duration)
  },

  /**
   * Remove a toast by id.
   * @param {number} id
   */
  remove: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
