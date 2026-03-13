/**
 * RSIChart — RSI(14) rendered in a lightweight-charts v5 sub-pane.
 *
 * v5 API: chart.addSeries(SeriesType, options, paneIndex)
 * Pane 0 = main candles. Pane 1 = RSI. Pane 2 = MACD.
 *
 * Reference lines at 70, 50, 30 are added as separate LineSeries
 * using flat constant data across the full time range.
 */

import { useEffect, useRef } from 'react'
import { LineSeries } from 'lightweight-charts'
import { rsi } from '../../utils/indicators'

const RSI_PANE = 1

const COLORS = {
  line:       '#a78bfa',   // purple
  overbought: '#ef444466', // red translucent
  midline:    '#6b728066', // gray translucent
  oversold:   '#22c55e66', // green translucent
}

export function RSIChart({ chart, bars, visible = true }) {
  const seriesRef = useRef({ rsi: null, r70: null, r50: null, r30: null })

  useEffect(() => {
    if (!chart) return

    // Create pane 1 for RSI (addPane() adds the next available pane)
    // Series added with paneIndex=1 auto-create the pane if needed
    const rsiSeries = chart.addSeries(LineSeries, {
      color:                  COLORS.line,
      lineWidth:              2,
      priceLineVisible:       false,
      lastValueVisible:       true,
      crosshairMarkerVisible: true,
      autoscaleInfoProvider:  () => ({
        priceRange: { minValue: 0, maxValue: 100 },
        margins:    { above: 10, below: 10 },
      }),
    }, RSI_PANE)

    // Reference lines — rendered as flat line series in the same pane
    const r70 = chart.addSeries(LineSeries, {
      color: '#ef4444', lineWidth: 1, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
    }, RSI_PANE)

    const r50 = chart.addSeries(LineSeries, {
      color: '#6b7280', lineWidth: 1, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
    }, RSI_PANE)

    const r30 = chart.addSeries(LineSeries, {
      color: '#22c55e', lineWidth: 1, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
    }, RSI_PANE)

    seriesRef.current = { rsi: rsiSeries, r70, r50, r30 }

    return () => {
      for (const s of Object.values(seriesRef.current)) {
        if (s) try { chart.removeSeries(s) } catch (_) {}
      }
      seriesRef.current = { rsi: null, r70: null, r50: null, r30: null }
    }
  }, [chart])

  useEffect(() => {
    const { rsi: rsiSeries, r70, r50, r30 } = seriesRef.current
    if (!bars || bars.length === 0 || !rsiSeries) return

    const { series } = rsi(bars, 14)
    rsiSeries.setData(series)
    rsiSeries.applyOptions({ visible })

    // Reference lines span the full time range of the RSI series
    if (series.length < 2) return
    const first = series[0].time
    const last  = series[series.length - 1].time

    r70.setData([{ time: first, value: 70 }, { time: last, value: 70 }])
    r50.setData([{ time: first, value: 50 }, { time: last, value: 50 }])
    r30.setData([{ time: first, value: 30 }, { time: last, value: 30 }])

    r70.applyOptions({ visible })
    r50.applyOptions({ visible })
    r30.applyOptions({ visible })
  }, [bars, visible])

  useEffect(() => {
    for (const s of Object.values(seriesRef.current)) {
      if (s) s.applyOptions({ visible })
    }
  }, [visible])

  return null
}
