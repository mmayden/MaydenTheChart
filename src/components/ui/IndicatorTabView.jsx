/**
 * IndicatorTabView — Toggle strip + mini charts below the main chart.
 *
 * RSI and MACD buttons live here (not in the sidebar IndicatorToggle).
 * Clicking a button toggles `indicators.rsi` / `indicators.macd` in the
 * Zustand store. When enabled, a fixed-height mini chart (82px) renders.
 */

import { useChartStore } from '../../store/useChartStore'
import { RSIMiniChart } from './RSIMiniChart'
import { MACDMiniChart } from './MACDMiniChart'

export function IndicatorTabView({ bars }) {
  const rsiEnabled      = useChartStore((s) => s.indicators.rsi)
  const macdEnabled     = useChartStore((s) => s.indicators.macd)
  const toggleIndicator = useChartStore((s) => s.toggleIndicator)

  if (!bars?.length) return null

  return (
    <div className="shrink-0 border-t border-gray-800">
      {/* Tab buttons — always visible, clicking toggles on/off */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-800" style={{ backgroundColor: 'var(--bg-surface, #0d1117)' }}>
        {['RSI', 'MACD'].map((tab) => {
          const key = tab.toLowerCase()
          const on  = key === 'rsi' ? rsiEnabled : macdEnabled
          return (
            <button
              key={tab}
              onClick={() => toggleIndicator(key)}
              className={[
                'px-2 py-1 text-xs font-mono font-semibold rounded border transition-colors',
                on
                  ? 'border-blue-500 text-blue-300 bg-blue-950'
                  : 'border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-800/50',
              ].join(' ')}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Mini chart areas — each gets its own 82px slot */}
      {rsiEnabled && (
        <div className="w-full bg-[#0a0a0a]" style={{ height: 82 }}>
          <RSIMiniChart bars={bars} />
        </div>
      )}
      {macdEnabled && (
        <div className="w-full bg-[#0a0a0a]" style={{ height: 82 }}>
          <MACDMiniChart bars={bars} />
        </div>
      )}
    </div>
  )
}
