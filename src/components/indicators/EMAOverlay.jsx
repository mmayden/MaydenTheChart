/**
 * EMAOverlay — Adds EMA 9, 48, 200 line series to the chart.
 * Uses the EMA colors from constants/chart.js.
 *
 * Receives the chart instance via prop (passed down from App/ChartContainer).
 * Adds series on mount, removes on unmount, updates data when bars change.
 */

import { useEffect, useRef } from 'react'
import { LineSeries } from 'lightweight-charts'
import { ema } from '../../utils/indicators'
import { EMA_COLORS, EMA_PERIODS } from '../../constants/chart'

export function EMAOverlay({ chart, bars, visible = true }) {
  const seriesRef = useRef({})  // { 9: series, 48: series, 200: series }

  const disposedRef = useRef(false)

  // Create series on mount (when chart is ready)
  useEffect(() => {
    if (!chart) return
    disposedRef.current = false

    try {
      for (const period of EMA_PERIODS) {
        const series = chart.addSeries(LineSeries, {
          color:       EMA_COLORS[period],
          lineWidth:   2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        seriesRef.current[period] = series
      }
    } catch { /* chart may be mid-teardown */ }

    return () => {
      disposedRef.current = true
      for (const period of EMA_PERIODS) {
        if (seriesRef.current[period]) {
          try { chart.removeSeries(seriesRef.current[period]) } catch (_) {}
        }
      }
      seriesRef.current = {}
    }
  }, [chart])

  // Update data when bars change
  useEffect(() => {
    if (disposedRef.current || !bars || bars.length === 0) return

    try {
      for (const period of EMA_PERIODS) {
        const series = seriesRef.current[period]
        if (!series) continue
        const { series: emaData } = ema(bars, period)
        series.setData(emaData)
      }
    } catch { /* series may have been removed */ }
  }, [bars])

  // Toggle visibility without re-creating series
  useEffect(() => {
    if (disposedRef.current) return
    try {
      for (const period of EMA_PERIODS) {
        const series = seriesRef.current[period]
        if (series) series.applyOptions({ visible })
      }
    } catch { /* series may have been removed */ }
  }, [visible])

  return null  // No DOM — purely adds to the chart instance
}
