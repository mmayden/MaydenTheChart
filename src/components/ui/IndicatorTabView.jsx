/**
 * IndicatorTabView — Toggle strip + mini charts below the main chart.
 *
 * RSI and MACD buttons live here (not in the sidebar IndicatorToggle).
 * Clicking a button toggles `indicators.rsi` / `indicators.macd` in the
 * Zustand store. When enabled, a fixed-height mini chart (82px) renders.
 */

import { useChartStore } from '../../store/useChartStore'
import { usePresetsStore } from '../../store/usePresetsStore'
import { RSIMiniChart } from './RSIMiniChart'
import { MACDMiniChart } from './MACDMiniChart'

export function IndicatorTabView({ bars }) {
  const rsiEnabled      = useChartStore((s) => s.indicators.rsi)
  const macdEnabled     = useChartStore((s) => s.indicators.macd)
  const toggleIndicator = useChartStore((s) => s.toggleIndicator)
  const markModified    = usePresetsStore((s) => s.markModified)

  if (!bars?.length) return null

  return (
    <div className="shrink-0 border-t border-theme">
      {/* Tab buttons — always visible, clicking toggles on/off */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-theme" style={{ backgroundColor: 'var(--bg-surface, #0d1117)' }}>
        {['RSI', 'MACD'].map((tab) => {
          const key = tab.toLowerCase()
          const on  = key === 'rsi' ? rsiEnabled : macdEnabled
          return (
            <button
              key={tab}
              onClick={() => { toggleIndicator(key); markModified() }}
              className={[
                'px-2 py-1 text-xs font-mono font-semibold rounded border transition-colors',
                on
                  ? 'border-accent text-accent bg-accent-dim'
                  : 'border-theme-mid text-theme-muted hover:text-theme hover:border-theme-mid hover:bg-theme-hover',
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
