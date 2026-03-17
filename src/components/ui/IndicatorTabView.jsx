/**
 * IndicatorTabView — Mini charts below the main chart.
 *
 * RSI and MACD are toggled from the sidebar IndicatorToggle (same as all
 * other indicators). This component renders the mini chart areas when
 * enabled. Labels are HTML overlay spans (.mini-chart-label CSS class)
 * positioned top-left, colored to match each indicator's line color.
 */

import { useChartStore } from '../../store/useChartStore'
import { RSIMiniChart } from './RSIMiniChart'
import { MACDMiniChart } from './MACDMiniChart'
import { RSI_LINE_COLOR, MACD_LINE_COLOR } from '../../constants/chart'

export function IndicatorTabView({ bars, mainChart }) {
  const rsiEnabled  = useChartStore((s) => s.indicators.rsi)
  const macdEnabled = useChartStore((s) => s.indicators.macd)

  if (!bars?.length || (!rsiEnabled && !macdEnabled)) return null

  return (
    <div className="shrink-0 overflow-hidden" style={{ borderTop: '1px solid var(--border)' }}>
      {rsiEnabled && (
        <div className="w-full overflow-hidden relative" style={{ backgroundColor: 'var(--bg-base)', height: 90 }}>
          <span className="mini-chart-label" style={{ color: RSI_LINE_COLOR }}>RSI</span>
          <RSIMiniChart bars={bars} mainChart={mainChart} />
        </div>
      )}
      {macdEnabled && (
        <div className="w-full overflow-hidden relative" style={{ backgroundColor: 'var(--bg-base)', height: 90 }}>
          <span className="mini-chart-label" style={{ color: MACD_LINE_COLOR }}>MACD</span>
          <MACDMiniChart bars={bars} mainChart={mainChart} />
        </div>
      )}
    </div>
  )
}
