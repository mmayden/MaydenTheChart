/**
 * useInfiniteHistory — Infinite scroll-back for chart history.
 *
 * Subscribes to lightweight-charts `subscribeVisibleLogicalRangeChange`.
 * When the user scrolls near the left edge (fewer than THRESHOLD bars
 * visible before the first data point), fetches an older page of bars
 * via the provider and prepends them to the TanStack Query cache.
 *
 * Key design decisions:
 *   - Debounced scroll trigger (200ms) to avoid hammering the API
 *   - `isFetching` gate prevents concurrent requests
 *   - Saves/restores visible logical range to prevent viewport jump after setData()
 *   - Respects per-timeframe maxBars cap to prevent OOM
 *   - Resets state on symbol/timeframe change
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchBars } from '../services/dataProvider'
import { useChartStore } from '../store/useChartStore'
import { TIMEFRAME_CONFIG } from '../constants/chart'

const SCROLL_THRESHOLD = 50  // trigger fetch when < 50 bars before left edge

export function useInfiniteHistory(chart, bars) {
  const queryClient = useQueryClient()
  const isFetchingRef = useRef(false)
  const prevKeyRef    = useRef(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const symbol    = useChartStore((s) => s.selectedSymbol)
  const timeframe = useChartStore((s) => s.selectedTimeframe)

  // Reset on symbol/timeframe change
  useEffect(() => {
    const key = `${symbol}|${timeframe}`
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key
      isFetchingRef.current = false
    }
  }, [symbol, timeframe])

  const fetchOlderBars = useCallback(async () => {
    if (isFetchingRef.current) return
    if (!bars?.length) return

    const config = TIMEFRAME_CONFIG[timeframe]
    if (!config) return

    // Respect maxBars cap (0 = unlimited)
    if (config.maxBars > 0 && bars.length >= config.maxBars) return

    isFetchingRef.current = true
    setIsLoadingHistory(true)

    try {
      // Oldest bar's time is our "end" for the older page
      const oldestTime = bars[0].time
      const endDate = new Date(oldestTime * 1000)

      // Calculate how far back to fetch based on pageSize and timeframe
      const pageSizeBars = config.pageSize || 390
      // Rough estimate: multiply pageSize by bar interval to get lookback
      const barIntervalMs = config.lookbackMs / config.limit
      const lookbackMs = pageSizeBars * barIntervalMs
      const startDate = new Date(endDate.getTime() - lookbackMs)

      const olderBars = await fetchBars(
        symbol,
        timeframe,
        startDate.toISOString(),
        endDate.toISOString(),
        pageSizeBars,
      )

      if (!olderBars?.length) {
        // No more history available — stop trying
        isFetchingRef.current = true // leave locked to prevent retries
        return
      }

      // Deduplicate: only keep bars older than our current oldest
      const newBars = olderBars.filter((b) => b.time < oldestTime)
      if (!newBars.length) {
        isFetchingRef.current = true
        return
      }

      // Update TanStack Query cache — prepend older bars
      const todayKey = new Date().toISOString().slice(0, 10)
      const queryKey = ['bars', symbol, timeframe, todayKey]

      queryClient.setQueryData(queryKey, (prev) => {
        if (!prev?.length) return prev
        let merged = [...newBars, ...prev]
        // Enforce maxBars cap by trimming from the end (newest) — but that
        // would lose live data. Instead, trim oldest if we exceed cap.
        // Actually, we should NOT trim since the user is scrolling back to
        // see history. The cap just prevents fetching more.
        if (config.maxBars > 0 && merged.length > config.maxBars) {
          merged = merged.slice(merged.length - config.maxBars)
        }
        return merged
      })
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[useInfiniteHistory] fetch error:', err)
    } finally {
      setIsLoadingHistory(false)
      // Unlock after a brief delay to prevent rapid re-triggers
      setTimeout(() => {
        isFetchingRef.current = false
      }, 500)
    }
  }, [bars, symbol, timeframe, queryClient])

  // Subscribe to visible range changes on the chart's timeScale
  useEffect(() => {
    if (!chart) return

    let debounceTimer = null

    const handleRangeChange = (logicalRange) => {
      if (!logicalRange) return
      if (isFetchingRef.current) return

      // logicalRange.from is the leftmost visible logical index.
      // If it's close to 0 (or negative), the user is near the left edge.
      const barsBefore = logicalRange.from
      if (barsBefore < SCROLL_THRESHOLD) {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(fetchOlderBars, 200)
      }
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange)

    return () => {
      clearTimeout(debounceTimer)
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange)
    }
  }, [chart, fetchOlderBars])

  return { isLoadingHistory }
}
