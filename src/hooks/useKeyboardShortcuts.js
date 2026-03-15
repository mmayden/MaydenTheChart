/**
 * useKeyboardShortcuts — Global keyboard shortcuts for the chart terminal.
 *
 * Binds:
 *   1-6  → switch timeframe (1=1m, 2=5m, 3=15m, 4=1h, 5=4h, 6=1D)
 *   [/]  → cycle presets (prev/next)
 *
 * Shortcuts are disabled when an input/textarea is focused so they
 * don't interfere with typing (e.g. symbol input, alert forms).
 *
 * Debounced: rapid keypresses (e.g. holding a key) only apply the last
 * timeframe after a 150ms pause. In-flight queries are cancelled before
 * the new fetch begins to prevent stale data races.
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChartStore } from '../store/useChartStore'
import { usePresetsStore } from '../store/usePresetsStore'
import { TIMEFRAME_ORDER } from '../constants/chart'

const TF_KEYS = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 }
const DEBOUNCE_MS = 150

export function useKeyboardShortcuts() {
  const queryClient = useQueryClient()
  const debounceRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      // Don't capture when typing in inputs
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

      // Don't capture with modifier keys (Ctrl+1, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // ── Timeframe shortcuts (1-6) ───────────────────────────────
      const tfIndex = TF_KEYS[e.key]
      if (tfIndex !== undefined) {
        const tf = TIMEFRAME_ORDER[tfIndex]
        if (!tf) return

        // Debounce: cancel any pending switch and schedule this one
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          const { selectedTimeframe, setTimeframe, selectedSymbol } = useChartStore.getState()
          if (tf === selectedTimeframe) return

          // Cancel in-flight bar queries to prevent stale data from arriving
          queryClient.cancelQueries({ queryKey: ['bars', selectedSymbol] })
          setTimeframe(tf)
          queryClient.invalidateQueries({ queryKey: ['bars', selectedSymbol, tf] })
        }, DEBOUNCE_MS)
        return
      }

      // ── Preset cycling ([ and ]) ────────────────────────────────
      if (e.key === '[' || e.key === ']') {
        const { activePresetId, applyPreset, getOrderedPresets } = usePresetsStore.getState()
        const ordered = getOrderedPresets()
        if (ordered.length < 2) return

        const currentIdx = ordered.findIndex((p) => p.id === activePresetId)
        let nextIdx
        if (e.key === ']') {
          nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % ordered.length
        } else {
          nextIdx = currentIdx < 0 ? ordered.length - 1 : (currentIdx - 1 + ordered.length) % ordered.length
        }

        applyPreset(ordered[nextIdx].id)
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      clearTimeout(debounceRef.current)
    }
  }, [queryClient])
}
