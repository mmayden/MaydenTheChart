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
  VOLUME_UP_COLOR,
  VOLUME_DOWN_COLOR,
} from '../../constants/chart'

const CANDLE_COLORS = {
  dark:    { up: '#22c55e', down: '#ef4444' },
  lumpia: { up: '#48B068', down: '#D44020' },
}

export const CandlestickChart = forwardRef(function CandlestickChart(
  { bars, children, theme = 'dark' },
  ref
) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const candleRef    = useRef(null)
  const volumeRef    = useRef(null)
  const themeRef     = useRef(theme)
  themeRef.current   = theme  // always current, readable inside effects

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
        borderColor:    GRID_COLOR,
        timeVisible:    true,
        secondsVisible: false,
        // Axis tick marks in ET — TickMarkType: 0=Year 1=Month 2=Day 3=Time
        tickMarkFormatter: (unixSecs, tickMarkType) => {
          const d  = new Date(unixSecs * 1000)
          const et = { timeZone: 'America/New_York' }
          if (tickMarkType === 0) return d.toLocaleString('en-US', { ...et, year: 'numeric' })
          if (tickMarkType === 1) return d.toLocaleString('en-US', { ...et, month: 'short' })
          if (tickMarkType === 2) return d.toLocaleString('en-US', { ...et, month: 'short', day: 'numeric' })
          return d.toLocaleString('en-US', { ...et, hour: '2-digit', minute: '2-digit', hour12: false })
        },
      },
      // Crosshair tooltip also in ET
      localization: {
        timeFormatter: (unixSecs) =>
          new Date(unixSecs * 1000).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            month:    'short',
            day:      'numeric',
            hour:     '2-digit',
            minute:   '2-digit',
            hour12:   false,
          }),
      },
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    // Candlestick series — use theme-appropriate colors at init time
    const { up, down } = CANDLE_COLORS[themeRef.current] ?? CANDLE_COLORS.dark
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:          up,
      downColor:        down,
      borderUpColor:    up,
      borderDownColor:  down,
      wickUpColor:      up,
      wickDownColor:    down,
    })

    // Volume bars — as a histogram in the main pane, scaled down
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color:    VOLUME_UP_COLOR,
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

  // Re-apply candle colors when theme changes
  useEffect(() => {
    if (!candleRef.current) return
    const { up, down } = CANDLE_COLORS[theme] ?? CANDLE_COLORS.dark
    candleRef.current.applyOptions({
      upColor: up, downColor: down,
      borderUpColor: up, borderDownColor: down,
      wickUpColor: up, wickDownColor: down,
    })
  }, [theme])

  // Update data when bars change
  useEffect(() => {
    if (!bars || !candleRef.current || !volumeRef.current) return

    candleRef.current.setData(bars)

    const volumeData = bars.map((bar) => ({
      time:  bar.time,
      value: bar.volume,
      color: bar.close >= bar.open ? VOLUME_UP_COLOR : VOLUME_DOWN_COLOR,
    }))

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
      {/* Volume section label — sits above the volume bars (bottom ~15% of chart) */}
      <div className="absolute left-2 bottom-[17%] text-[9px] text-gray-600 font-mono pointer-events-none select-none">
        VOL
      </div>
      {children}
    </div>
  )
})
