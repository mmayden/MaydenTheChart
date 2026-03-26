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
import { RSI_LINE_COLOR, RSI_OB_COLOR, RSI_MID_COLOR, RSI_OS_COLOR } from '../../constants/chart'
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
      layout: { ...MINI_CHART_OPTS.layout },
    })

    const line = chart.addSeries(LineSeries, {
      color: RSI_LINE_COLOR, lineWidth: 1.5,
      priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: true,
      autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 }, margins: { above: 5, below: 5 } }),
    })
    const r70 = chart.addSeries(LineSeries, { color: RSI_OB_COLOR, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const r50 = chart.addSeries(LineSeries, { color: RSI_MID_COLOR, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const r30 = chart.addSeries(LineSeries, { color: RSI_OS_COLOR, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })

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
    window.addEventListener('lumpio:layout-resize', handleLayoutResize)
    return () => window.removeEventListener('lumpio:layout-resize', handleLayoutResize)
  }, [])

  // Sync crosshair from main chart → this mini chart
  useEffect(() => {
    if (!mainChart || !chartRef.current) return

    const handler = (param) => {
      if (!chartRef.current) return // mini chart was removed
      try {
        if (!param.time || !seriesRef.current.line) {
          chartRef.current.clearCrosshairPosition()
          return
        }
        chartRef.current.setCrosshairPosition(NaN, param.time, seriesRef.current.line)
      } catch { /* chart may be mid-teardown */ }
    }

    mainChart.subscribeCrosshairMove(handler)
    return () => { try { mainChart.unsubscribeCrosshairMove(handler) } catch {} }
  }, [mainChart])

  // Sync visible time range from main chart → this mini chart
  useEffect(() => {
    if (!mainChart || !chartRef.current) return

    const handler = (range) => {
      if (!chartRef.current || !range) return // mini chart was removed
      try {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      } catch { /* chart may be mid-teardown */ }
    }

    mainChart.timeScale().subscribeVisibleLogicalRangeChange(handler)

    // Apply current range immediately so mini-chart aligns on mount
    try {
      const currentRange = mainChart.timeScale().getVisibleLogicalRange()
      if (currentRange && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(currentRange)
      }
    } catch { /* chart may not be ready yet */ }

    return () => {
      try { mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(handler) } catch {}
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
