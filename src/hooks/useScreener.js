/**
 * useScreener — Scans a list of symbols for active confluence setups.
 *
 * For each symbol: fetches 5m bars + daily bars, computes all indicator
 * signals, runs confluenceScore(), and returns ranked results.
 *
 * Uses TanStack Query with 2min staleTime. Only runs when screener panel is open.
 */

import { useQueries } from '@tanstack/react-query'
import { fetchBars } from '../services/dataProvider'
import { useChartStore } from '../store/useChartStore'
import { ema, vwapWithBands, rsi, macd, atr, getDailyRangeStatus } from '../utils/indicators'
import { getPreviousLevels, classifyDayType, groupBarsByDay } from '../utils/levels'
import { confluenceScore } from '../utils/confluence'

/**
 * Compute full confluence score for a symbol's bars + daily bars.
 */
function computeSetup(bars, dailyBars) {
  if (!bars?.length) return null

  const byDay = groupBarsByDay(bars)

  // Day type
  const { prevHigh, prevLow } = getPreviousLevels(bars, byDay)
  const dayType = (prevHigh && prevLow) ? classifyDayType(bars, prevHigh, prevLow, byDay) : null

  // ATR gauge from daily bars
  let atrGauge = null
  if (dailyBars?.length) {
    const { series: atrSeries } = atr(dailyBars, 14)
    if (atrSeries.length) {
      const atr14 = atrSeries[atrSeries.length - 1].value
      const days = Array.from(byDay.keys()).sort()
      atrGauge = getDailyRangeStatus(byDay.get(days[days.length - 1]) ?? [], atr14)
    }
  }

  // Indicator signals
  const ema9Signal = ema(bars, 9).signal
  const ema48Signal = ema(bars, 48).signal
  const ema200Signal = ema(bars, 200).signal
  const vwapSignal = vwapWithBands(bars).signal
  const rsiSignal = rsi(bars).signal
  const macdSignal = macd(bars).signal

  const result = confluenceScore({
    dayType, ema9Signal, ema48Signal, ema200Signal,
    vwapSignal, atrGauge, rsiSignal, macdSignal,
  })

  const lastBar = bars[bars.length - 1]

  return {
    price: lastBar.close,
    confluence: result,
    dayType,
    rsiValue: rsiSignal.value,
    atrPct: atrGauge?.percentConsumed ?? null,
  }
}

/**
 * @param {string[]} symbols - Symbols to scan
 * @returns {{ results: Array<{ symbol, setup }>, isLoading: boolean }}
 */
export function useScreener(symbols) {
  const activePanel = useChartStore((s) => s.activePanel)
  const enabled = activePanel === 'screener' && symbols.length > 0

  // Fetch 5m bars for each symbol (intraday confluence)
  const barQueries = useQueries({
    queries: symbols.map((sym) => ({
      queryKey: ['screener-bars', sym],
      queryFn: async () => {
        const now = new Date()
        const start = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
        return fetchBars(sym, '5Min', start.toISOString(), now.toISOString(), 1000)
      },
      enabled,
      staleTime: 2 * 60 * 1000,
      refetchInterval: enabled ? 2 * 60 * 1000 : false,
    })),
  })

  // Fetch daily bars for each symbol (ATR computation)
  const dailyQueries = useQueries({
    queries: symbols.map((sym) => ({
      queryKey: ['screener-daily', sym],
      queryFn: async () => {
        const now = new Date()
        const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        return fetchBars(sym, '1Day', start.toISOString(), now.toISOString(), 60)
      },
      enabled,
      staleTime: 5 * 60 * 1000,
      refetchInterval: enabled ? 5 * 60 * 1000 : false,
    })),
  })

  const results = symbols.map((sym, i) => {
    const bars = barQueries[i].data
    const dailyBars = dailyQueries[i].data
    const isLoading = barQueries[i].isLoading || dailyQueries[i].isLoading

    return {
      symbol: sym,
      isLoading,
      setup: (bars && !isLoading) ? computeSetup(bars, dailyBars) : null,
    }
  })

  // Sort by confluence score (highest first), then by symbol name
  const sorted = [...results].sort((a, b) => {
    const scoreA = a.setup?.confluence?.score ?? -1
    const scoreB = b.setup?.confluence?.score ?? -1
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.symbol.localeCompare(b.symbol)
  })

  const isLoading = barQueries.some((q) => q.isLoading)

  return { results: sorted, isLoading }
}
