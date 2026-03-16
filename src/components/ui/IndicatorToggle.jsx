/**
 * IndicatorToggle — Show/hide toggles for each indicator.
 * Reads and writes to Zustand store.
 */

import { useChartStore } from '../../store/useChartStore'
import { usePresetsStore } from '../../store/usePresetsStore'
import { TIMEFRAME_CONFIG } from '../../constants/chart'

const TOGGLES = [
  { key: 'ema',       label: 'EMA'        },
  { key: 'vwap',      label: 'VWAP'       },
  { key: 'bollinger', label: 'Bollinger'  },
  { key: 'rvol',      label: 'RVOL'       },
  { key: 'levels',    label: 'Levels'     },
  { key: 'sr',        label: 'S/R'        },
  { key: 'rsi',       label: 'RSI'        },
  { key: 'macd',      label: 'MACD'       },
]

export function IndicatorToggle() {
  const indicators      = useChartStore((s) => s.indicators)
  const toggleIndicator = useChartStore((s) => s.toggleIndicator)
  const markModified    = usePresetsStore((s) => s.markModified)
  const timeframe       = useChartStore((s) => s.selectedTimeframe)

  const tfConfig = TIMEFRAME_CONFIG[timeframe]

  return (
    <div className="flex flex-col gap-1">
      {TOGGLES.map(({ key, label }) => {
        const on = indicators[key]
        // VWAP is only available on intraday timeframes
        const disabled = key === 'vwap' && !tfConfig?.showVWAP
        return (
          <button
            key={key}
            onClick={() => { if (!disabled) { toggleIndicator(key); markModified() } }}
            disabled={disabled}
            className={[
              'px-2 py-1 text-xs font-mono font-semibold rounded border transition-colors text-left touch-target',
              disabled
                ? 'border-theme bg-transparent cursor-not-allowed opacity-40'
                : on
                  ? 'border-accent bg-accent-dim'
                  : 'border-theme-mid bg-transparent hover:border-theme-mid hover:bg-theme-hover',
            ].join(' ')}
            style={{ color: disabled ? 'var(--text-muted, #9ca3af)' : on ? 'var(--text-primary, #e8e0d0)' : 'var(--text-muted, #9ca3af)' }}
            title={disabled ? 'VWAP is only available on intraday timeframes' : undefined}
          >
            <span className="mr-1.5 opacity-50">{on && !disabled ? '●' : '○'}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
