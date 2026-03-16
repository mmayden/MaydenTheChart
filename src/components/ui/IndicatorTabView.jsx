/**
 * IndicatorTabView — Mini charts below the main chart.
 *
 * RSI and MACD are toggled from the sidebar IndicatorToggle (same as all
 * other indicators). This component just renders the mini chart areas
 * when enabled, with a subtle overlay label on each for identification.
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
          <span className="absolute top-1 left-12 z-10 text-[9px] font-mono font-semibold opacity-40 pointer-events-none" style={{ color: '#a78bfa' }}>RSI</span>
          <RSIMiniChart bars={bars} />
        </div>
      )}
      {macdEnabled && (
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', height: 82 }}>
          <span className="absolute top-1 left-12 z-10 text-[9px] font-mono font-semibold opacity-40 pointer-events-none" style={{ color: '#3b82f6' }}>MACD</span>
          <MACDMiniChart bars={bars} />
        </div>
      )}
    </div>
  )
}
