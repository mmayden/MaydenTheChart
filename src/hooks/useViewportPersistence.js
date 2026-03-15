/**
 * useViewportPersistence — Preserves chart viewport across live data updates.
 *
 * Returns true on initial load or symbol/timeframe change (fit content).
 * Returns false on live data updates (preserve viewport).
 *
 * Usage:
 *   const shouldFit = useViewportPersistence(symbol, timeframe, dataUpdatedAt)
 *   // In your data update effect:
 *   if (shouldFit) chart.timeScale().fitContent()
 */

import { useRef, useMemo } from 'react'

export function useViewportPersistence(symbol, timeframe, _dataUpdatedAt) {
  const prevKeyRef = useRef(null)

  return useMemo(() => {
    const key = `${symbol}|${timeframe}`
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key
      return true
    }
    return false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe, _dataUpdatedAt])
}
