/**
 * PriceDisplay — Shows current price, change, and % change.
 * Derives everything from the bars array (last bar close vs. prev day close).
 */

import { useMemo } from 'react'
import { useChartStore } from '../../store/useChartStore'
import { groupBarsByDay } from '../../utils/levels'

export function PriceDisplay({ bars }) {
  const symbol = useChartStore((s) => s.selectedSymbol)

  const { price, change, changePct } = useMemo(() => {
    if (!bars || bars.length < 2) {
      return { price: null, change: null, changePct: null }
    }

    const byDay   = groupBarsByDay(bars)
    const days    = Array.from(byDay.keys()).sort()

    const todayBars = byDay.get(days[days.length - 1]) ?? []
    const prevBars  = byDay.get(days[days.length - 2]) ?? []

    const lastClose = todayBars.length
      ? todayBars[todayBars.length - 1].close
      : null

    const prevClose = prevBars.length
      ? prevBars[prevBars.length - 1].close
      : null

    if (lastClose == null || prevClose == null) return { price: null, change: null, changePct: null }

    const change    = lastClose - prevClose
    const changePct = (change / prevClose) * 100

    return { price: lastClose, change, changePct }
  }, [bars])

  if (price == null) return null

  const isUp   = change >= 0
  const color  = isUp ? 'text-green-400' : 'text-red-400'
  const sign   = isUp ? '+' : ''

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-white font-mono text-2xl font-bold">
        {price.toFixed(2)}
      </span>
      <span className={`font-mono text-sm ${color}`}>
        {sign}{change.toFixed(2)} ({sign}{changePct.toFixed(2)}%)
      </span>
      <span className="text-blue-400 font-mono text-xs uppercase tracking-wider">
        {symbol}
      </span>
    </div>
  )
}
