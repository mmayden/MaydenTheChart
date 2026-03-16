/**
 * RSIMiniChart — Standalone RSI(14) mini chart instance (82px tall).
 * Used inside IndicatorTabView below the main chart.
 *
 * Crosshair sync: subscribes to the main chart's crosshairMove events
 * and mirrors the cursor position via setCrosshairPosition / clearCrosshairPosition.
 */

import { useEffect, useRef } from 'react'
import { createChart, LineSeries } from 'lightweight-charts'
import { rsi as calcRsi } from '../../utils/indicators'
import { MINI_CHART_OPTS } from './miniChartConfig'

export function RSIMiniChart({ bars, mainChart }) {
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

  // Force resize on layout change (sidebar toggle)
  useEffect(() => {
    function handleLayoutResize() {
      const chart = chartRef.current
      const container = containerRef.current
      if (!chart || !container) return
      chart.resize(container.clientWidth, container.clientHeight, true)
    }
    window.addEventListener('cheechart:layout-resize', handleLayoutResize)
    return () => window.removeEventListener('cheechart:layout-resize', handleLayoutResize)
  }, [])

  // Sync crosshair from main chart → this mini chart
  useEffect(() => {
    if (!mainChart || !chartRef.current) return
    const miniChart = chartRef.current
    const miniLine  = seriesRef.current.line

    const handler = (param) => {
      if (!param.time || !miniLine) {
        miniChart.clearCrosshairPosition()
        return
      }
      miniChart.setCrosshairPosition(NaN, param.time, miniLine)
    }

    mainChart.subscribeCrosshairMove(handler)
    return () => { mainChart.unsubscribeCrosshairMove(handler) }
  }, [mainChart])

  // Sync visible time range from main chart → this mini chart
  useEffect(() => {
    if (!mainChart || !chartRef.current) return
    const miniChart = chartRef.current

    const handler = (range) => {
      if (range) {
        miniChart.timeScale().setVisibleLogicalRange(range)
      }
    }

    mainChart.timeScale().subscribeVisibleLogicalRangeChange(handler)

    // Apply current range immediately so mini-chart aligns on mount
    const currentRange = mainChart.timeScale().getVisibleLogicalRange()
    if (currentRange) {
      miniChart.timeScale().setVisibleLogicalRange(currentRange)
    }

    return () => {
      mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(handler)
    }
  }, [mainChart])

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
    // If main chart is connected, it drives the time range via sync.
    // Only fitContent when there's no main chart to sync from.
    if (!mainChart) {
      chartRef.current?.timeScale().fitContent()
    }
  }, [bars, mainChart])

  return <div ref={containerRef} className="w-full h-full" />
}
