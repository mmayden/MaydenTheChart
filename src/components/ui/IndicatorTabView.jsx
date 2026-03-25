/**
 * IndicatorTabView — Mini charts below the main chart.
 *
 * RSI and MACD are toggled from the sidebar IndicatorToggle (same as all
 * other indicators). Labels are HTML overlay spans (.mini-chart-label CSS class)
 * positioned top-left, colored to match each indicator's line color.
 *
 * Design: Mini charts are always mounted (to avoid expensive createChart()
 * mount/unmount cycles on preset switches). When disabled, their container
 * collapses to height 0 with overflow hidden — the chart instance stays
 * alive but invisible, so re-enabling is instant.
 */

import { useChartStore } from '../../store/useChartStore'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { RSIMiniChart } from './RSIMiniChart'
import { MACDMiniChart } from './MACDMiniChart'
import { RSI_LINE_COLOR, MACD_LINE_COLOR } from '../../constants/chart'

export function IndicatorTabView({ bars, mainChart }) {
  const rsiEnabled  = useChartStore((s) => s.indicators.rsi)
  const macdEnabled = useChartStore((s) => s.indicators.macd)
  const isMobile    = useIsMobile()

  // No bars yet — don't mount anything
  if (!bars?.length) return null

  const chartHeight = isMobile ? 70 : 90

  // Both hidden — collapse border too
  const anyVisible = rsiEnabled || macdEnabled

  return (
    <div
      className="shrink-0 overflow-hidden"
      style={anyVisible ? { borderTop: '1px solid var(--border)' } : undefined}
    >
      <div
        className="w-full overflow-hidden relative"
        style={{
          backgroundColor: 'var(--bg-base)',
          height: rsiEnabled ? chartHeight : 0,
          transition: 'height 150ms ease-out',
        }}
      >
        {rsiEnabled && <span className="mini-chart-label" style={{ color: RSI_LINE_COLOR }}>RSI</span>}
        <RSIMiniChart bars={bars} mainChart={mainChart} />
      </div>
      <div
        className="w-full overflow-hidden relative"
        style={{
          backgroundColor: 'var(--bg-base)',
          height: macdEnabled ? chartHeight : 0,
          transition: 'height 150ms ease-out',
        }}
      >
        {macdEnabled && <span className="mini-chart-label" style={{ color: MACD_LINE_COLOR }}>MACD</span>}
        <MACDMiniChart bars={bars} mainChart={mainChart} />
      </div>
    </div>
  )
}
