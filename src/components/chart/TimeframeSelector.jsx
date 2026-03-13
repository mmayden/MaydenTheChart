/**
 * TimeframeSelector — 1m / 5m / 15m / 1h / 4h / 1D button group.
 * Reads and writes to Zustand store. Invalidates TanStack Query on change.
 */

import { useQueryClient } from '@tanstack/react-query'
import { useChartStore } from '../../store/useChartStore'
import { TIMEFRAME_ORDER, TIMEFRAME_CONFIG } from '../../constants/chart'

export function TimeframeSelector() {
  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const selectedSymbol    = useChartStore((s) => s.selectedSymbol)
  const setTimeframe      = useChartStore((s) => s.setTimeframe)
  const queryClient       = useQueryClient()

  function handleSelect(tf) {
    setTimeframe(tf)
    queryClient.invalidateQueries({ queryKey: ['bars', selectedSymbol, tf] })
  }

  return (
    <div className="flex items-center gap-1">
      {TIMEFRAME_ORDER.map((tf) => {
        const active = tf === selectedTimeframe
        return (
          <button
            key={tf}
            onClick={() => handleSelect(tf)}
            className={[
              'px-2 py-1 text-xs font-mono rounded transition-colors',
              active
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800',
            ].join(' ')}
          >
            {TIMEFRAME_CONFIG[tf].label}
          </button>
        )
      })}
    </div>
  )
}
