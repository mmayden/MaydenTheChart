/**
 * useKeyboardShortcuts — Global keyboard shortcuts for the chart terminal.
 *
 * Binds:
 *   1-6  → switch timeframe (1=1m, 2=5m, 3=15m, 4=1h, 5=4h, 6=1D)
 *
 * Shortcuts are disabled when an input/textarea is focused so they
 * don't interfere with typing (e.g. symbol input, alert forms).
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChartStore } from '../store/useChartStore'
import { TIMEFRAME_ORDER } from '../constants/chart'

const TF_KEYS = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 }

export function useKeyboardShortcuts() {
  const queryClient = useQueryClient()

  useEffect(() => {
    function handler(e) {
      // Don't capture when typing in inputs
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

      // Don't capture with modifier keys (Ctrl+1, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const tfIndex = TF_KEYS[e.key]
      if (tfIndex !== undefined) {
        const tf = TIMEFRAME_ORDER[tfIndex]
        const { selectedTimeframe, setTimeframe, selectedSymbol } = useChartStore.getState()
        if (tf && tf !== selectedTimeframe) {
          setTimeframe(tf)
          queryClient.invalidateQueries({ queryKey: ['bars', selectedSymbol, tf] })
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [queryClient])
}
