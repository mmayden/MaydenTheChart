/**
 * TanStack Query hook for fetching historical OHLCV bars from Alpaca.
 *
 * Returns bars in the shape lightweight-charts v5 expects:
 *   { time, open, high, low, close, volume }
 *
 * The `time` field is a Unix timestamp (seconds) — lightweight-charts v5 default.
 *
 * Usage:
 *   const { data: bars, isLoading, isError, error } = useAlpacaBars()
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchBars } from '../services/alpaca'
import { useChartStore } from '../store/useChartStore'
import { TIMEFRAME_CONFIG } from '../constants/chart'
import { normalizeBar } from '../utils/normalizeBar'

export function useAlpacaBars() {
  const symbol    = useChartStore((s) => s.selectedSymbol)
  const timeframe = useChartStore((s) => s.selectedTimeframe)
  const wsStatus  = useChartStore((s) => s.wsStatus)

  const config = TIMEFRAME_CONFIG[timeframe]

  // Include today's date so the cache invalidates at day boundaries.
  // Without this, the queryKey never changes and start/end inside queryFn
  // would be stale forever even as real time advances.
  const todayKey = new Date().toISOString().slice(0, 10)

  return useQuery({
    queryKey: ['bars', symbol, timeframe, todayKey],
    queryFn:  async () => {
      const now   = new Date()
      const start = new Date(now.getTime() - config.lookbackMs)
      const raw = await fetchBars(
        symbol,
        config.alpacaTimeframe,
        start.toISOString(),
        now.toISOString(),
        config.limit,
      )
      // Sort oldest → newest, normalize to lw-charts shape
      return raw
        .sort((a, b) => new Date(a.t) - new Date(b.t))
        .map(normalizeBar)
    },
    enabled:         !!symbol && !!timeframe,
    // Keep stale data visible while the new timeframe loads — prevents
    // the chart from flashing black during rapid timeframe switches.
    placeholderData: keepPreviousData,
    // When WebSocket is streaming live bars, skip REST polling entirely.
    // Otherwise: intraday refetch every 60s, daily/swing every 5 min.
    refetchInterval: wsStatus === 'subscribed'
      ? false
      : (config.intraday ? 60 * 1000 : 5 * 60 * 1000),
  })
}
