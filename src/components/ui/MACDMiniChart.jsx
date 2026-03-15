/**
 * MACDMiniChart — Standalone MACD(12,26,9) mini chart instance (82px tall).
 * Used inside IndicatorTabView below the main chart.
 */

import { useEffect, useRef } from 'react'
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts'
import { macd as calcMacd } from '../../utils/indicators'
import { MINI_CHART_OPTS } from './miniChartConfig'

export function MACDMiniChart({ bars }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const seriesRef    = useRef({ hist: null, macdLine: null, signalLine: null })

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      ...MINI_CHART_OPTS,
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    const hist       = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const macdLine   = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: true,  crosshairMarkerVisible: true  })
    const signalLine = chart.addSeries(LineSeries, { color: '#f97316', lineWidth: 1,   lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })

    chartRef.current  = chart
    seriesRef.current = { hist, macdLine, signalLine }

    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return
      chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
    })
    ro.observe(containerRef.current)

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null }
  }, [])

  useEffect(() => {
    const { hist, macdLine, signalLine } = seriesRef.current
    if (!bars?.length || !hist) return
    const result = calcMacd(bars)
    if (!result.macd.length) return
    hist.setData(result.histogram.map((p) => ({ time: p.time, value: p.value, color: p.value >= 0 ? '#22c55e' : '#ef4444' })))
    macdLine.setData(result.macd)
    signalLine.setData(result.signalLine)
    chartRef.current?.timeScale().fitContent()
  }, [bars])

  return <div ref={containerRef} className="w-full h-full" />
}
