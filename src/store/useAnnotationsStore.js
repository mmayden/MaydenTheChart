/**
 * Zustand store for chart annotations — persisted per-symbol in localStorage.
 *
 * Annotation types:
 *   - 'text'  — text note at a specific time + price (rendered as marker)
 *   - 'arrow' — directional arrow at a time + price (rendered as marker)
 *   - 'hline' — horizontal line at a price (rendered as price line)
 */

import { create } from 'zustand'
import { log } from '../utils/logger'
import { migrateStore } from '../utils/migrate'

const STORAGE_KEY = 'cheechart-annotations'

/** Schema migrations for annotations. */
const ANNOTATIONS_MIGRATIONS = [
  { version: 1, up: (data) => data }, // stamp version on existing data
]

function loadAnnotations() {
  migrateStore(STORAGE_KEY, ANNOTATIONS_MIGRATIONS)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAnnotations(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* storage unavailable */ }
}

export const useAnnotationsStore = create((set, get) => ({
  // { [symbol]: [annotation, ...] }
  annotations: loadAnnotations(),

  /**
   * Get annotations for a specific symbol.
   * @param {string} symbol
   * @returns {Object[]}
   */
  getAnnotations: (symbol) => get().annotations[symbol] ?? [],

  /**
   * Add a new annotation for a symbol.
   * @param {string} symbol
   * @param {Object} annotation - { type, time?, price, text?, color?, direction? }
   */
  addAnnotation: (symbol, annotation) => {
    const id = crypto.randomUUID()
    const entry = { id, createdAt: Date.now(), ...annotation }
    set((state) => {
      const updated = {
        ...state.annotations,
        [symbol]: [...(state.annotations[symbol] ?? []), entry],
      }
      saveAnnotations(updated)
      log.debug('Annotations', `Added ${annotation.type} on ${symbol}`, { id })
      return { annotations: updated }
    })
    return id
  },

  /**
   * Update an existing annotation.
   * @param {string} symbol
   * @param {string} id
   * @param {Object} updates - partial fields to merge
   */
  updateAnnotation: (symbol, id, updates) => {
    set((state) => {
      const list = state.annotations[symbol]
      if (!list) return state
      const updated = {
        ...state.annotations,
        [symbol]: list.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }
      saveAnnotations(updated)
      return { annotations: updated }
    })
  },

  /**
   * Remove an annotation.
   * @param {string} symbol
   * @param {string} id
   */
  removeAnnotation: (symbol, id) => {
    set((state) => {
      const list = state.annotations[symbol]
      if (!list) return state
      const updated = {
        ...state.annotations,
        [symbol]: list.filter((a) => a.id !== id),
      }
      saveAnnotations(updated)
      log.debug('Annotations', `Removed annotation on ${symbol}`, { id })
      return { annotations: updated }
    })
  },

  /**
   * Clear all annotations for a symbol.
   * @param {string} symbol
   */
  clearAnnotations: (symbol) => {
    set((state) => {
      const updated = { ...state.annotations }
      delete updated[symbol]
      saveAnnotations(updated)
      return { annotations: updated }
    })
  },
}))
