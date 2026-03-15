/**
 * useWatchlistQuotes — Fetches live snapshot prices for watchlist symbols.
 *
 * Uses the /api/snapshot serverless proxy (Alpaca snapshots endpoint).
 * Auto-refreshes every 30 seconds. Enabled only when watchlist panel is open.
 *
 * Returns: { quotes: { [symbol]: { price, change, changePercent } }, isLoading }
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useChartStore } from '../store/useChartStore'

/**
 * @param {string[]} symbols - array of ticker symbols
 * @returns {{ quotes: Object, isLoading: boolean }}
 */
export function useWatchlistQuotes(symbols) {
  const activePanel = useChartStore((s) => s.activePanel)
  const enabled = activePanel === 'watchlist' && symbols.length > 0

  const { data, isLoading } = useQuery({
    queryKey: ['watchlist-quotes', symbols.join(',')],
    queryFn: async () => {
      const { data: resp } = await axios.get('/api/snapshot', {
        params: { symbols: symbols.join(',') },
      })
      return resp.snapshots ?? {}
    },
    enabled,
    refetchInterval: enabled ? 30 * 1000 : false,
    staleTime: 15 * 1000,
  })

  return { quotes: data ?? {}, isLoading: isLoading && enabled }
}
