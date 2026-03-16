/**
 * IndicatorTabView — Mini charts below the main chart.
 *
 * RSI and MACD are toggled from the sidebar IndicatorToggle (same as all
 * other indicators). This component just renders the mini chart areas
 * when enabled, with a corner label on each so you know which is which.
 */

import { useChartStore } from '../../store/useChartStore'
import { RSIMiniChart } from './RSIMiniChart'
import { MACDMiniChart } from './MACDMiniChart'

export function IndicatorTabView({ bars }) {
  const rsiEnabled  = useChartStore((s) => s.indicators.rsi)
  const macdEnabled = useChartStore((s) => s.indicators.macd)

  if (!bars?.length || (!rsiEnabled && !macdEnabled)) return null

  return (
    <div className="shrink-0 border-t border-theme overflow-hidden">
      {rsiEnabled && (
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', height: 82 }}>
          <span className="absolute top-1 left-2 z-10 text-[10px] font-mono font-bold tracking-wide" style={{ color: '#a78bfa' }}>RSI</span>
          <RSIMiniChart bars={bars} />
        </div>
      )}
      {macdEnabled && (
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', height: 82 }}>
          <span className="absolute top-1 left-2 z-10 text-[10px] font-mono font-bold tracking-wide" style={{ color: '#3b82f6' }}>MACD</span>
          <MACDMiniChart bars={bars} />
        </div>
      )}
    </div>
  )
}
