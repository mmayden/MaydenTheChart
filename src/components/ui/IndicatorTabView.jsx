/**
 * IndicatorTabView — Compact tabbed strip below the main chart.
 *
 * Shows RSI or MACD in a fixed-height mini chart (82px tall).
 * Each is its own lightweight-charts instance — the main chart
 * stays full-height with no sub-panes consuming space.
 */

import { useEffect, useRef, useState } from 'react'
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts'
import { rsi as calcRsi, macd as calcMacd } from '../../utils/indicators'

const MINI_CHART_OPTS = {
  layout: {
    background: { color: '#0a0a0a' },
    textColor:  '#6b7280',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  grid: {
    vertLines: { color: '#111827' },
    horzLines: { color: '#111827' },
  },
  crosshair: {
    vertLine: { color: '#374151', labelBackgroundColor: '#1f2937' },
    horzLine: { color: '#374151', labelBackgroundColor: '#1f2937' },
  },
  rightPriceScale: { borderColor: '#1f2937' },
  timeScale:       { borderColor: '#1f2937', timeVisible: true, secondsVisible: false, visible: false },
  handleScroll:    false,
  handleScale:     false,
}

// ── RSI mini chart ─────────────────────────────────────────────────────────────
function RSIMiniChart({ bars }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const seriesRef    = useRef({ line: null, r70: null, r50: null, r30: null })

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      ...MINI_CHART_OPTS,
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
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

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
    })
    ro.observe(containerRef.current)

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null }
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

// ── MACD mini chart ────────────────────────────────────────────────────────────
function MACDMiniChart({ bars }) {
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

// ── Tab strip ──────────────────────────────────────────────────────────────────
export function IndicatorTabView({ bars, rsiEnabled, macdEnabled }) {
  const tabs = [rsiEnabled && 'RSI', macdEnabled && 'MACD'].filter(Boolean)
  const [activeTab, setActiveTab] = useState('RSI')

  useEffect(() => {
    if (tabs.length && !tabs.includes(activeTab)) setActiveTab(tabs[0])
  }, [tabs.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!tabs.length || !bars?.length) return null

  return (
    <div className="shrink-0 border-t border-gray-800" style={{ height: 116 }}>
      {/* Tab buttons */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-800" style={{ backgroundColor: 'var(--bg-surface, #0d1117)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-2.5 py-0.5 text-[10px] font-mono rounded border transition-colors tracking-widest',
              activeTab === tab
                ? 'border-blue-500 text-blue-300 bg-blue-950'
                : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mini chart area */}
      <div className="w-full bg-[#0a0a0a]" style={{ height: 82 }}>
        {activeTab === 'RSI'  && <RSIMiniChart  bars={bars} />}
        {activeTab === 'MACD' && <MACDMiniChart bars={bars} />}
      </div>
    </div>
  )
}
