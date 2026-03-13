/**
 * CandlestickChart — Main chart component using lightweight-charts v5.
 *
 * Responsibilities:
 *   - Init and destroy the chart on mount/unmount
 *   - Render candlestick series + volume bars
 *   - Accept children (overlays) via ref-passing pattern
 *   - Expose chart instance to parent via ref
 *
 * Indicator overlays (EMA, VWAP, levels) are handled by sibling components
 * that receive the chart instance and add their own series.
 *
 * lightweight-charts v5 notes:
 *   - createChart() from 'lightweight-charts'
 *   - chart.addSeries(CandlestickSeries) — new v5 API (not addCandlestickSeries)
 *   - Panes: chart.addPane() for RSI/MACD subcharts
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import {
  CHART_BG_COLOR,
  GRID_COLOR,
  VOLUME_NORMAL_COLOR,
  VOLUME_RVOL_COLOR,
  VOLUME_HIGH_COLOR,
} from '../../constants/chart'
import { relativeVolume } from '../../utils/indicators'

export const CandlestickChart = forwardRef(function CandlestickChart(
  { bars, children },
  ref
) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const candleRef    = useRef(null)
  const volumeRef    = useRef(null)

  // Init chart on mount
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: CHART_BG_COLOR },
        textColor:  '#d1d5db',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      },
      grid: {
        vertLines:   { color: GRID_COLOR },
        horzLines:   { color: GRID_COLOR },
      },
      crosshair: {
        vertLine: { color: '#6b7280', labelBackgroundColor: '#374151' },
        horzLine: { color: '#6b7280', labelBackgroundColor: '#374151' },
      },
      rightPriceScale: {
        borderColor: GRID_COLOR,
      },
      timeScale: {
        borderColor:       GRID_COLOR,
        timeVisible:       true,
        secondsVisible:    false,
      },
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:          '#22c55e',
      downColor:        '#ef4444',
      borderUpColor:    '#22c55e',
      borderDownColor:  '#ef4444',
      wickUpColor:      '#22c55e',
      wickDownColor:    '#ef4444',
    })

    // Volume bars — as a histogram in the main pane, scaled down
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color:    VOLUME_NORMAL_COLOR,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    })

    chartRef.current  = chart
    candleRef.current = candleSeries
    volumeRef.current = volumeSeries

    // Responsive resize
    const ro = new ResizeObserver(() => {
      chart.applyOptions({
        width:  containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      })
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current  = null
      candleRef.current = null
      volumeRef.current = null
    }
  }, [])

  // Update data when bars change
  useEffect(() => {
    if (!bars || !candleRef.current || !volumeRef.current) return

    candleRef.current.setData(bars)

    // Compute RVOL for volume color coding
    const rvolData   = relativeVolume(bars).series
    const rvolMap    = new Map(rvolData.map((r) => [r.time, r]))

    const volumeData = bars.map((bar) => {
      const rvol = rvolMap.get(bar.time)
      let color  = VOLUME_NORMAL_COLOR
      if (rvol?.rvol >= 2.0) color = VOLUME_HIGH_COLOR
      else if (rvol?.highlight)   color = VOLUME_RVOL_COLOR

      return { time: bar.time, value: bar.volume, color }
    })

    volumeRef.current.setData(volumeData)
    chartRef.current.timeScale().fitContent()
  }, [bars])

  // Expose chart instance to parent for overlays
  useImperativeHandle(ref, () => ({
    chart:       () => chartRef.current,
    candleSeries: () => candleRef.current,
  }))

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {children}
    </div>
  )
})
