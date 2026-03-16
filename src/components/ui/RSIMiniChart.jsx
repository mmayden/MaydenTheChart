/**
 * RSIMiniChart — Standalone RSI(14) mini chart instance (82px tall).
 * Used inside IndicatorTabView below the main chart.
 */

import { useEffect, useRef } from 'react'
import { createChart, LineSeries } from 'lightweight-charts'
import { rsi as calcRsi } from '../../utils/indicators'
import { MINI_CHART_OPTS } from './miniChartConfig'

export function RSIMiniChart({ bars }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const seriesRef    = useRef({ line: null, r70: null, r50: null, r30: null })

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      ...MINI_CHART_OPTS,
      autoSize: true,
      layout: {
        ...MINI_CHART_OPTS.layout,
        watermark: { text: 'RSI', color: 'rgba(167, 139, 250, 0.5)', visible: true, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontStyle: 'bold', horzAlign: 'left', vertAlign: 'top' },
      },
    })

    const line = chart.addSeries(LineSeries, {
      color: '#a78bfa', lineWidth: 1.5,
      priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: true,
      autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 }, margins: { above: 5, below: 5 } }),
    })
    const r70 = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const r50 = chart.addSeries(LineSeries, { color: '#374151', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const r30 = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })

    chartRef.current  = chart
    seriesRef.current = { line, r70, r50, r30 }

    return () => { chart.remove(); chartRef.current = null }
  }, [])

  useEffect(() => {
    const { line, r70, r50, r30 } = seriesRef.current
    if (!bars?.length || !line) return
    const { series } = calcRsi(bars, 14)
    if (!series.length) return
    const first = series[0].time, last = series[series.length - 1].time
    line.setData(series)
    r70.setData([{ time: first, value: 70 }, { time: last, value: 70 }])
    r50.setData([{ time: first, value: 50 }, { time: last, value: 50 }])
    r30.setData([{ time: first, value: 30 }, { time: last, value: 30 }])
    chartRef.current?.timeScale().fitContent()
  }, [bars])

  return <div ref={containerRef} className="w-full h-full" />
}
