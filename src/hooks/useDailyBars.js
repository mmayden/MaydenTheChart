/**
 * useDailyBars — Fetches 200+ days of daily bars for macro MA calculation.
 * Separate from useAlpacaBars so it doesn't invalidate when timeframe changes.
 * Cached for 5 minutes (staleTime) — daily bars don't change during the session.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchBars } from '../services/alpaca'
import { useChartStore } from '../store/useChartStore'

function normalizeDailyBar(bar) {
  return {
    time:   Math.floor(new Date(bar.t).getTime() / 1000),
    open:   bar.o,
    high:   bar.h,
    low:    bar.l,
    close:  bar.c,
    volume: bar.v,
  }
}

export function useDailyBars() {
  const symbol = useChartStore((s) => s.selectedSymbol)

  const end   = new Date()
  const start = new Date(end.getTime() - 250 * 24 * 60 * 60 * 1000)  // 250 trading days

  return useQuery({
    queryKey: ['daily-bars', symbol],
    queryFn: async () => {
      const raw = await fetchBars(symbol, '1Day', start.toISOString(), end.toISOString(), 250)
      return raw
        .sort((a, b) => new Date(a.t) - new Date(b.t))
        .map(normalizeDailyBar)
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes
    enabled:   !!symbol,
  })
}
