/**
 * IndicatorTabView — Mini charts below the main chart.
 *
 * RSI and MACD are toggled from the sidebar IndicatorToggle (same as all
 * other indicators). This component renders the mini chart areas when
 * enabled. Labels are handled by lightweight-charts watermark (auto-aligned
 * inside the chart plotting area).
 */

import { useChartStore } from '../../store/useChartStore'
import { RSIMiniChart } from './RSIMiniChart'
import { MACDMiniChart } from './MACDMiniChart'

export function IndicatorTabView({ bars, mainChart }) {
  const rsiEnabled  = useChartStore((s) => s.indicators.rsi)
  const macdEnabled = useChartStore((s) => s.indicators.macd)

  if (!bars?.length || (!rsiEnabled && !macdEnabled)) return null

  return (
    <div className="shrink-0 border-t border-theme overflow-hidden">
      {rsiEnabled && (
        <div className="w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', height: 82 }}>
          <RSIMiniChart bars={bars} mainChart={mainChart} />
        </div>
      )}
      {macdEnabled && (
        <div className="w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', height: 82 }}>
          <MACDMiniChart bars={bars} mainChart={mainChart} />
        </div>
      )}
    </div>
  )
}
