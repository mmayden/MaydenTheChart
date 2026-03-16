/**
 * MACDMiniChart — Standalone MACD(12,26,9) mini chart instance (82px tall).
 * Used inside IndicatorTabView below the main chart.
 *
 * Crosshair sync: subscribes to the main chart's crosshairMove events
 * and mirrors the cursor position via setCrosshairPosition / clearCrosshairPosition.
 */

import { useEffect, useRef } from 'react'
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts'
import { macd as calcMacd } from '../../utils/indicators'
import { MACD_LINE_COLOR, MACD_SIGNAL_COLOR, MACD_HIST_UP, MACD_HIST_DOWN } from '../../constants/chart'
import { MINI_CHART_OPTS } from './miniChartConfig'

export function MACDMiniChart({ bars, mainChart }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const seriesRef    = useRef({ hist: null, macdLine: null, signalLine: null })

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      ...MINI_CHART_OPTS,
      autoSize: true,
      layout: { ...MINI_CHART_OPTS.layout },
    })

    const hist       = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const macdLine   = chart.addSeries(LineSeries, { color: MACD_LINE_COLOR, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: true,  crosshairMarkerVisible: true  })
    const signalLine = chart.addSeries(LineSeries, { color: MACD_SIGNAL_COLOR, lineWidth: 1,   lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })

    chartRef.current  = chart
    seriesRef.current = { hist, macdLine, signalLine }

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
    const miniLine  = seriesRef.current.macdLine

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
    const { hist, macdLine, signalLine } = seriesRef.current
    if (!bars?.length || !hist) return
    const result = calcMacd(bars)
    if (!result.macd.length) return
    hist.setData(result.histogram.map((p) => ({ time: p.time, value: p.value, color: p.value >= 0 ? MACD_HIST_UP : MACD_HIST_DOWN })))
    macdLine.setData(result.macd)
    signalLine.setData(result.signalLine)
    // If main chart is connected, it drives the time range via sync.
    // Only fitContent when there's no main chart to sync from.
    if (!mainChart) {
      chartRef.current?.timeScale().fitContent()
    }
  }, [bars, mainChart])

  return <div ref={containerRef} className="w-full h-full" />
}
