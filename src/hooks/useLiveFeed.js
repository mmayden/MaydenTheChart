/**
 * React hook — connects the live WebSocket feed to TanStack Query's cache.
 *
 * When the market is open, this hook:
 *   1. Opens a WebSocket via the provider adapter
 *   2. Receives 1-minute bars in real time
 *   3. Aggregates them into the currently selected timeframe
 *   4. Injects them into TanStack Query's cache so the chart auto-updates
 *
 * When the market is closed, the WebSocket is disconnected.
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createSocket } from '../services/websocket'
import { useChartStore } from '../store/useChartStore'

/** Timeframe durations in seconds, for bar aggregation bucketing. */
const TF_SECONDS = {
  '1Min':  60,
  '5Min':  5 * 60,
  '15Min': 15 * 60,
  '1Hour': 60 * 60,
  '4Hour': 4 * 60 * 60,
  '1Day':  24 * 60 * 60,
}

/**
 * Check if US equity markets are currently open (9:30 AM – 4:00 PM ET, weekdays).
 * Does not account for holidays — a future /api/market-status endpoint can handle that.
 */
function checkMarketOpen() {
  const now = new Date()
  const nowET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const minuteOfDay = nowET.getHours() * 60 + nowET.getMinutes()
  const isWeekend = nowET.getDay() === 0 || nowET.getDay() === 6
  return !isWeekend && minuteOfDay >= 570 && minuteOfDay < 960
}

/**
 * Compute the bucket start time for a given unix timestamp and timeframe.
 * For 1Day, uses the date boundary in ET.
 */
function getBucketTime(unixSeconds, timeframeSecs) {
  if (timeframeSecs >= 86400) {
    // Daily: use the date in ET
    const d = new Date(unixSeconds * 1000)
    const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    et.setHours(0, 0, 0, 0)
    return Math.floor(et.getTime() / 1000)
  }
  return Math.floor(unixSeconds / timeframeSecs) * timeframeSecs
}

export function useLiveFeed() {
  const queryClient = useQueryClient()
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)

  useEffect(() => {
    const { setWsStatus, setMarketOpen } = useChartStore.getState()

    // ── Bar handler — aggregates 1-min bars into current timeframe ──────────
    function handleBar(bar) {
      const { selectedTimeframe, selectedSymbol } = useChartStore.getState()
      const tfSecs = TF_SECONDS[selectedTimeframe]
      if (!tfSecs) return

      const bucketTime = getBucketTime(bar.time, tfSecs)
      const todayKey = new Date().toISOString().slice(0, 10)
      const queryKey = ['bars', selectedSymbol, selectedTimeframe, todayKey]

      queryClient.setQueryData(queryKey, (prev) => {
        if (!prev || !prev.length) return prev

        const bars = [...prev]
        const last = bars[bars.length - 1]

        if (last.time === bucketTime) {
          // Update the current candle in place
          bars[bars.length - 1] = {
            time:   bucketTime,
            open:   last.open,
            high:   Math.max(last.high, bar.high),
            low:    Math.min(last.low, bar.low),
            close:  bar.close,
            volume: last.volume + bar.volume,
          }
        } else if (bucketTime > last.time) {
          // New candle
          bars.push({
            time:   bucketTime,
            open:   bar.open,
            high:   bar.high,
            low:    bar.low,
            close:  bar.close,
            volume: bar.volume,
          })
        }
        // If bucketTime < last.time, it's a late/duplicate bar — ignore

        return bars
      })
    }

    // ── Status handler — syncs to Zustand ──────────────────────────────────
    function handleStatus(status) {
      setWsStatus(status)
    }

    // ── Create socket instance ─────────────────────────────────────────────
    const socket = createSocket({
      onBar:    handleBar,
      onStatus: handleStatus,
      getSymbol: () => useChartStore.getState().selectedSymbol,
    })
    // ── Market hours check — connect/disconnect based on market state ──────
    function syncMarketState() {
      const open = checkMarketOpen()
      setMarketOpen(open)

      if (open) {
        socket.connect()
      } else {
        socket.disconnect()
      }
    }

    // Check immediately, then every 30 seconds
    syncMarketState()
    const marketCheckId = setInterval(syncMarketState, 30_000)

    return () => {
      socket.disconnect()
      clearInterval(marketCheckId)
    }
  }, [queryClient, selectedSymbol])

  const wsStatus = useChartStore((s) => s.wsStatus)
  const isMarketOpen = useChartStore((s) => s.isMarketOpen)

  return { wsStatus, isMarketOpen }
}

// Backward compat export during migration
export { useLiveFeed as useAlpacaSocket }
