/**
 * useWeeklyBars — Fetches weekly bars for gap detection.
 * Separate query key so it doesn't invalidate on timeframe changes.
 * Cached for 10 minutes — weekly bars rarely change intra-session.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchBars } from '../services/dataProvider'
import { useChartStore } from '../store/useChartStore'

export function useWeeklyBars(enabled = true) {
  const symbol = useChartStore((s) => s.selectedSymbol)

  const end   = new Date()
  const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000)  // 1 year of weekly bars

  return useQuery({
    queryKey: ['weekly-bars', symbol],
    queryFn: async () => {
      return fetchBars(symbol, '1Week', start.toISOString(), end.toISOString(), 52)
    },
    staleTime: 10 * 60 * 1000,  // 10 minutes
    enabled: !!symbol && enabled,
  })
}
