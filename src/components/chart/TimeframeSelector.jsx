/**
 * TimeframeSelector — 1m / 5m / 15m / 1h / 4h / 1D button list in sidebar.
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
    <div className="flex flex-col gap-1">
      {TIMEFRAME_ORDER.map((tf) => {
        const active = tf === selectedTimeframe
        return (
          <button
            key={tf}
            onClick={() => handleSelect(tf)}
            className={[
              'px-2 py-1 text-xs font-mono font-semibold rounded border transition-colors text-left',
              active
                ? 'border-blue-500 text-blue-300 bg-blue-950'
                : 'border-gray-700 text-gray-300 bg-transparent hover:border-gray-600 hover:text-gray-300',
            ].join(' ')}
          >
            {active && <span className="mr-1.5">▸</span>}
            {!active && <span className="mr-1.5 opacity-0">▸</span>}
            {TIMEFRAME_CONFIG[tf].label}
          </button>
        )
      })}
    </div>
  )
}
