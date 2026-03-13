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
    <div className="flex flex-col gap-1">
      {TOGGLES.map(({ key, label }) => {
        const on = indicators[key]
        return (
          <button
            key={key}
            onClick={() => toggleIndicator(key)}
            className={[
              'px-2 py-1 text-xs font-mono font-semibold rounded border transition-colors text-left',
              on
                ? 'border-blue-500 text-blue-300 bg-blue-950'
                : 'border-gray-700 text-gray-300 bg-transparent hover:border-gray-600 hover:text-gray-300',
            ].join(' ')}
          >
            <span className="mr-1.5 opacity-50">{on ? '●' : '○'}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
