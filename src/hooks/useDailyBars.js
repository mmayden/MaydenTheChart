/**
 * useDailyBars — Fetches 200+ days of daily bars for macro MA calculation.
 * Separate from useBars so it doesn't invalidate when timeframe changes.
 * Cached for 5 minutes (staleTime) — daily bars don't change during the session.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchBars } from '../services/dataProvider'
import { useChartStore } from '../store/useChartStore'

export function useDailyBars() {
  const symbol = useChartStore((s) => s.selectedSymbol)

  const end   = new Date()
  const start = new Date(end.getTime() - 250 * 24 * 60 * 60 * 1000)  // 250 trading days

  return useQuery({
    queryKey: ['daily-bars', symbol],
    queryFn: async () => {
      // fetchBars handles provider timeframe translation + normalization
      return fetchBars(symbol, '1Day', start.toISOString(), end.toISOString(), 250)
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes
    enabled:   !!symbol,
  })
}
