/**
 * useViewportPersistence — Preserves chart viewport across live data updates.
 *
 * Calls fitContent() only on initial load or symbol/timeframe change.
 * During live streaming updates, maintains the user's current zoom/scroll.
 *
 * Usage:
 *   const shouldFit = useViewportPersistence(symbol, timeframe, dataUpdatedAt)
 *   // In your data update effect:
 *   if (shouldFit) chart.timeScale().fitContent()
 */

import { useRef, useEffect, useState } from 'react'

export function useViewportPersistence(symbol, timeframe, dataUpdatedAt) {
  const prevKeyRef = useRef(null)
  const [shouldFit, setShouldFit] = useState(true)

  useEffect(() => {
    const key = `${symbol}|${timeframe}`

    if (prevKeyRef.current !== key) {
      // Symbol or timeframe changed (or first load) — fit content
      prevKeyRef.current = key
      setShouldFit(true)
    } else {
      // Same symbol+timeframe, just a live data update — preserve viewport
      setShouldFit(false)
    }
  }, [symbol, timeframe, dataUpdatedAt])

  return shouldFit
}
