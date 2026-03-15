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
import { useViewportPersistence } from '../../hooks/useViewportPersistence'
import { useChartStore } from '../../store/useChartStore'
import { relativeVolume } from '../../utils/indicators'
import {
  CHART_BG_COLOR,
  GRID_COLOR,
  CROSSHAIR_COLOR,
  VOLUME_UP_COLOR,
  VOLUME_DOWN_COLOR,
} from '../../constants/chart'

// RVOL highlight colors — amber for ≥1.5x, hot red for ≥2x
const RVOL_AMBER = '#f59e0bcc'  // amber semi-transparent
const RVOL_HOT   = '#ef4444cc'  // red semi-transparent

const CANDLE_COLORS = {
  dark:    { up: '#22c55e', down: '#ef4444' },
  lumpia: { up: '#48B068', down: '#D44020' },
}

export const CandlestickChart = forwardRef(function CandlestickChart(
  { bars, children, theme = 'dark', dataUpdatedAt, showRvol = false },
  ref
) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const candleRef    = useRef(null)
  const volumeRef    = useRef(null)
  const themeRef     = useRef(theme)
  useEffect(() => { themeRef.current = theme }, [theme])

  const prevBarsRef = useRef(null)

  const symbol    = useChartStore((s) => s.selectedSymbol)
  const timeframe = useChartStore((s) => s.selectedTimeframe)
  const shouldFit = useViewportPersistence(symbol, timeframe, dataUpdatedAt)

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
        vertLine: { color: CROSSHAIR_COLOR, labelBackgroundColor: GRID_COLOR },
        horzLine: { color: CROSSHAIR_COLOR, labelBackgroundColor: GRID_COLOR },
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
      if (!containerRef.current) return
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

  // Update data when bars change — use update() for single-bar changes (live streaming)
  useEffect(() => {
    if (!bars || !bars.length || !candleRef.current || !volumeRef.current) return

    const prev = prevBarsRef.current
    const last = bars[bars.length - 1]

    // Build RVOL lookup when enabled — maps time → rvol value for highlighting
    let rvolMap = null
    if (showRvol) {
      const { series: rvolSeries } = relativeVolume(bars)
      rvolMap = new Map(rvolSeries.map((r) => [r.time, r.rvol]))
    }

    const makeVolBar = (bar) => {
      const baseColor = bar.close >= bar.open ? VOLUME_UP_COLOR : VOLUME_DOWN_COLOR
      if (!rvolMap) return { time: bar.time, value: bar.volume, color: baseColor }

      const rv = rvolMap.get(bar.time)
      if (rv != null && rv >= 2.0) return { time: bar.time, value: bar.volume, color: RVOL_HOT }
      if (rv != null && rv >= 1.5) return { time: bar.time, value: bar.volume, color: RVOL_AMBER }
      return { time: bar.time, value: bar.volume, color: baseColor }
    }

    // Determine if we can use the lightweight update() path
    let didUpdate = false

    if (prev && prev.length > 0) {
      const prevLast = prev[prev.length - 1]

      // Case 1: same length, last bar changed (live tick updating current candle)
      // Case 2: one new bar appended (new candle formed)
      const sameLength   = bars.length === prev.length
      const oneAppended  = bars.length === prev.length + 1

      if (sameLength && prevLast.time === last.time) {
        // Only the last bar differs — single update
        if (
          prevLast.open  !== last.open  ||
          prevLast.high  !== last.high  ||
          prevLast.low   !== last.low   ||
          prevLast.close !== last.close ||
          prevLast.volume !== last.volume
        ) {
          candleRef.current.update(last)
          volumeRef.current.update(makeVolBar(last))
        }
        didUpdate = true
      } else if (oneAppended && prevLast.time === bars[prev.length - 1].time) {
        // A new bar was appended — update() handles append when time is new
        candleRef.current.update(last)
        volumeRef.current.update(makeVolBar(last))
        didUpdate = true
      }
    }

    // Fall back to full setData() for initial load, symbol change, timeframe change, etc.
    if (!didUpdate) {
      candleRef.current.setData(bars)
      const volumeData = bars.map(makeVolBar)
      volumeRef.current.setData(volumeData)
    }

    prevBarsRef.current = bars
    if (shouldFit) chartRef.current.timeScale().fitContent()
  }, [bars, shouldFit, showRvol])

  // Expose chart instance to parent for overlays
  useImperativeHandle(ref, () => ({
    chart:       () => chartRef.current,
    candleSeries: () => candleRef.current,
  }))

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Volume section label — sits above the volume bars (bottom ~15% of chart) */}
      <div className="absolute left-2 bottom-[17%] text-[10px] text-gray-500 font-mono pointer-events-none select-none">
        VOL
      </div>
      {children}
    </div>
  )
})
