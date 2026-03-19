/**
 * useEMACrosses — Fetches 4hr bars and detects EMA 9×48 crossovers.
 *
 * Returns an array of { time, direction } cross events that can be
 * mapped to markers on the current chart timeframe.
 *
 * Uses TanStack Query with 2min staleTime (crosses change slowly).
 */

import { useQuery } from '@tanstack/react-query'
import { fetchBars } from '../services/dataProvider'
import { useChartStore } from '../store/useChartStore'
import { ema, detectEMACrosses } from '../utils/indicators'

export function useEMACrosses(enabled = false) {
  const symbol = useChartStore((s) => s.selectedSymbol)
  const todayKey = new Date().toISOString().slice(0, 10)

  return useQuery({
    queryKey: ['ema-crosses-4h', symbol, todayKey],
    queryFn: async () => {
      const now = new Date()
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days
      const bars = await fetchBars(symbol, '4Hour', start.toISOString(), now.toISOString(), 500)
      if (!bars?.length) return []

      const ema9 = ema(bars, 9).series
      const ema48 = ema(bars, 48).series
      return detectEMACrosses(ema9, ema48)
    },
    enabled: enabled && !!symbol,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
