/**
 * IndicatorToggle — Show/hide toggles for each indicator.
 * Reads and writes to Zustand store.
 */

import { useChartStore } from '../../store/useChartStore'

const TOGGLES = [
  { key: 'ema',    label: 'EMA'    },
  { key: 'vwap',   label: 'VWAP'   },
  { key: 'rvol',   label: 'RVOL'   },
  { key: 'levels', label: 'Levels' },
  { key: 'rsi',    label: 'RSI'    },
  { key: 'macd',   label: 'MACD'   },
]

export function IndicatorToggle() {
  const indicators     = useChartStore((s) => s.indicators)
  const toggleIndicator = useChartStore((s) => s.toggleIndicator)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {TOGGLES.map(({ key, label }) => {
        const on = indicators[key]
        return (
          <button
            key={key}
            onClick={() => toggleIndicator(key)}
            className={[
              'px-2 py-1 text-xs font-mono rounded border transition-colors',
              on
                ? 'border-gray-600 text-gray-200 bg-gray-800'
                : 'border-gray-700 text-gray-600 bg-transparent',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
