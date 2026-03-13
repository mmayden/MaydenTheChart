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

import { useQuery } from '@tanstack/react-query'
import { fetchBars } from '../services/alpaca'
import { useChartStore } from '../store/useChartStore'
import { TIMEFRAME_CONFIG } from '../constants/chart'

/**
 * Convert an Alpaca bar to the shape lightweight-charts expects.
 * Alpaca bar timestamp is ISO 8601; lw-charts v5 needs Unix seconds.
 */
function normalizebar(bar) {
  return {
    time:   Math.floor(new Date(bar.t).getTime() / 1000),
    open:   bar.o,
    high:   bar.h,
    low:    bar.l,
    close:  bar.c,
    volume: bar.v,
  }
}

export function useAlpacaBars() {
  const symbol    = useChartStore((s) => s.selectedSymbol)
  const timeframe = useChartStore((s) => s.selectedTimeframe)

  const config = TIMEFRAME_CONFIG[timeframe]

  // Compute start/end window based on timeframe config
  const now   = new Date()
  const start = new Date(now.getTime() - config.lookbackMs)
  const end   = now

  return useQuery({
    queryKey: ['bars', symbol, timeframe],
    queryFn:  async () => {
      const raw = await fetchBars(
        symbol,
        config.alpacaTimeframe,
        start.toISOString(),
        end.toISOString(),
        config.limit,
      )
      // Sort oldest → newest, normalize to lw-charts shape
      return raw
        .sort((a, b) => new Date(a.t) - new Date(b.t))
        .map(normalizebar)
    },
    enabled: !!symbol && !!timeframe,
  })
}
