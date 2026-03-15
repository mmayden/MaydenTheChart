/**
 * useMTFSignals — Fetches bars across multiple timeframes and computes
 * EMA alignment for the MTF status strip.
 *
 * Timeframes: 5m, 15m, 1h, 4h, 1D
 * For each: computes EMA 9/48/200 signals → bull/bear/neutral alignment.
 *
 * Uses TanStack Query with long staleTime (2min) since MTF alignment
 * changes slowly. Only fetches when the user's current symbol changes.
 */

import { useQueries } from '@tanstack/react-query'
import { fetchBars } from '../services/alpaca'
import { useChartStore } from '../store/useChartStore'
import { ema } from '../utils/indicators'
import { normalizeBar } from '../utils/normalizeBar'

const MTF_TIMEFRAMES = [
  { key: '5Min',  label: '5m',  alpaca: '5Min',  lookbackMs: 5 * 24 * 60 * 60 * 1000,  limit: 500 },
  { key: '15Min', label: '15m', alpaca: '15Min', lookbackMs: 10 * 24 * 60 * 60 * 1000, limit: 500 },
  { key: '1Hour', label: '1h',  alpaca: '1Hour', lookbackMs: 30 * 24 * 60 * 60 * 1000, limit: 500 },
  { key: '4Hour', label: '4h',  alpaca: '4Hour', lookbackMs: 90 * 24 * 60 * 60 * 1000, limit: 500 },
  { key: '1Day',  label: '1D',  alpaca: '1Day',  lookbackMs: 365 * 24 * 60 * 60 * 1000, limit: 300 },
]

/**
 * Classify EMA alignment for a set of bars.
 * Returns { bias, aligned, ema9, ema48, ema200 }
 */
function classifyEMAAlignment(bars) {
  if (!bars?.length) return null

  const e9  = ema(bars, 9).signal
  const e48 = ema(bars, 48).signal
  const e200 = ema(bars, 200).signal

  const allBull = e9.bias === 'bull' && e48.bias === 'bull' && e200.bias === 'bull'
  const allBear = e9.bias === 'bear' && e48.bias === 'bear' && e200.bias === 'bear'

  let bias = 'neutral'
  if (allBull) bias = 'bull'
  else if (allBear) bias = 'bear'
  else if (e9.bias === e48.bias) bias = e9.bias  // partial alignment

  return {
    bias,
    aligned: allBull || allBear,
    ema9: e9,
    ema48: e48,
    ema200: e200,
  }
}

export function useMTFSignals() {
  const symbol = useChartStore((s) => s.selectedSymbol)
  const todayKey = new Date().toISOString().slice(0, 10)

  const queries = useQueries({
    queries: MTF_TIMEFRAMES.map((tf) => ({
      queryKey: ['mtf-bars', symbol, tf.key, todayKey],
      queryFn: async () => {
        const now = new Date()
        const start = new Date(now.getTime() - tf.lookbackMs)
        const raw = await fetchBars(symbol, tf.alpaca, start.toISOString(), now.toISOString(), tf.limit)
        return raw
          .sort((a, b) => new Date(a.t) - new Date(b.t))
          .map(normalizeBar)
      },
      staleTime: 2 * 60 * 1000,     // 2 min — MTF alignment changes slowly
      refetchInterval: 2 * 60 * 1000,
      enabled: !!symbol,
    })),
  })

  const signals = MTF_TIMEFRAMES.map((tf, i) => {
    const query = queries[i]
    return {
      key: tf.key,
      label: tf.label,
      isLoading: query.isLoading,
      alignment: query.data ? classifyEMAAlignment(query.data) : null,
    }
  })

  const isLoading = queries.some((q) => q.isLoading)

  return { signals, isLoading }
}

export { MTF_TIMEFRAMES }
