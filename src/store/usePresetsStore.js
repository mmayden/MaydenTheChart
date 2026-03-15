/**
 * usePresetsStore — Zustand store for saved chart presets.
 *
 * Manages named presets that serialize indicator toggles + timeframe.
 * Symbol floats freely (not part of any preset).
 *
 * Persists to localStorage on every mutation — no manual save button.
 * Default presets (isDefault: true) cannot be deleted or renamed.
 */

import { create } from 'zustand'
import { DEFAULT_PRESETS, DEFAULT_PRESET_ID } from '../constants/presets'
import { useChartStore } from './useChartStore'

const STORAGE_KEY = 'cheechart-presets'
const ACTIVE_KEY  = 'cheechart-active-preset'

/** Load user presets from localStorage, merged with defaults. */
function loadPresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (stored && typeof stored === 'object') {
      // Always layer defaults underneath so they can't be deleted from storage
      return { ...DEFAULT_PRESETS, ...stored }
    }
  } catch { /* corrupt or missing — use defaults */ }
  return { ...DEFAULT_PRESETS }
}

/** Load active preset ID from localStorage. */
function loadActiveId() {
  try {
    const id = localStorage.getItem(ACTIVE_KEY)
    if (id) return id
  } catch { /* storage unavailable */ }
  return DEFAULT_PRESET_ID
}

/** Persist presets to localStorage (only user-created ones). */
function savePresets(presets) {
  try {
    // Only persist non-default presets (defaults are always available from code)
    const userPresets = {}
    for (const [id, preset] of Object.entries(presets)) {
      if (!preset.isDefault) {
        userPresets[id] = preset
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets))
  } catch { /* storage unavailable */ }
}

/** Persist active preset ID. */
function saveActiveId(id) {
  try { localStorage.setItem(ACTIVE_KEY, id) } catch { /* storage unavailable */ }
}

export const usePresetsStore = create((set, get) => ({
  presets: loadPresets(),
  activePresetId: loadActiveId(),

  /**
   * Apply a preset — updates indicators + timeframe in useChartStore.
   * Does NOT change symbol (symbol floats freely).
   */
  applyPreset: (id) => {
    const preset = get().presets[id]
    if (!preset) return

    const chartStore = useChartStore.getState()
    chartStore.setIndicators({ ...preset.indicators })
    chartStore.setTimeframe(preset.timeframe)

    set({ activePresetId: id })
    saveActiveId(id)
  },

  /**
   * Save current chart state as a new named preset.
   * Returns the new preset's id.
   */
  saveCurrentAsPreset: (name) => {
    const { indicators, selectedTimeframe } = useChartStore.getState()
    const id = `custom-${crypto.randomUUID()}`
    const preset = {
      id,
      name,
      icon: '◉',
      isDefault: false,
      indicators: { ...indicators },
      timeframe: selectedTimeframe,
    }

    set((state) => {
      const next = { ...state.presets, [id]: preset }
      savePresets(next)
      saveActiveId(id)
      return { presets: next, activePresetId: id }
    })

    return id
  },

  /**
   * Update an existing custom preset with current chart state.
   */
  updatePreset: (id) => {
    const preset = get().presets[id]
    if (!preset || preset.isDefault) return

    const { indicators, selectedTimeframe } = useChartStore.getState()

    set((state) => {
      const next = {
        ...state.presets,
        [id]: {
          ...preset,
          indicators: { ...indicators },
          timeframe: selectedTimeframe,
        },
      }
      savePresets(next)
      return { presets: next }
    })
  },

  /**
   * Rename a custom preset.
   */
  renamePreset: (id, newName) => {
    const preset = get().presets[id]
    if (!preset || preset.isDefault) return

    set((state) => {
      const next = {
        ...state.presets,
        [id]: { ...preset, name: newName },
      }
      savePresets(next)
      return { presets: next }
    })
  },

  /**
   * Delete a custom preset. Default presets cannot be deleted.
   * If the deleted preset was active, falls back to full.
   */
  deletePreset: (id) => {
    const preset = get().presets[id]
    if (!preset || preset.isDefault) return

    set((state) => {
      const next = { ...state.presets }
      delete next[id]
      savePresets(next)

      const newActive = state.activePresetId === id ? DEFAULT_PRESET_ID : state.activePresetId
      if (newActive !== state.activePresetId) saveActiveId(newActive)
      return { presets: next, activePresetId: newActive }
    })
  },

  /**
   * Mark active preset as "modified" (user toggled an indicator manually).
   * Sets activePresetId to null so the UI shows "Custom" state.
   */
  markModified: () => {
    set({ activePresetId: null })
    saveActiveId('')
  },

  /** Get ordered list of presets (defaults first, then custom by name). */
  getOrderedPresets: () => {
    const presets = Object.values(get().presets)
    const defaults = presets.filter((p) => p.isDefault)
    const custom = presets.filter((p) => !p.isDefault).sort((a, b) => a.name.localeCompare(b.name))
    return [...defaults, ...custom]
  },
}))
