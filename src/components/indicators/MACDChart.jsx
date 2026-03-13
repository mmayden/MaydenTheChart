/**
 * MACDChart — MACD line, signal line, and histogram in pane 2.
 *
 * v5 API: chart.addSeries(SeriesType, options, paneIndex=2)
 *
 * Three series:
 *   - Histogram: HistogramSeries, green above zero / red below zero
 *   - MACD line: blue
 *   - Signal line: orange
 */

import { useEffect, useRef } from 'react'
import { LineSeries, HistogramSeries } from 'lightweight-charts'
import { macd } from '../../utils/indicators'

const MACD_PANE = 2

export function MACDChart({ chart, bars, visible = true }) {
  const seriesRef = useRef({ hist: null, macdLine: null, signalLine: null })

  useEffect(() => {
    if (!chart) return

    const hist = chart.addSeries(HistogramSeries, {
      priceLineVisible:     false,
      lastValueVisible:     false,
      crosshairMarkerVisible: false,
    }, MACD_PANE)

    const macdLine = chart.addSeries(LineSeries, {
      color:                  '#3b82f6',  // blue
      lineWidth:              2,
      priceLineVisible:       false,
      lastValueVisible:       true,
      crosshairMarkerVisible: true,
    }, MACD_PANE)

    const signalLine = chart.addSeries(LineSeries, {
      color:                  '#f97316',  // orange
      lineWidth:              1,
      lineStyle:              2,          // dashed
      priceLineVisible:       false,
      lastValueVisible:       true,
      crosshairMarkerVisible: false,
    }, MACD_PANE)

    seriesRef.current = { hist, macdLine, signalLine }

    return () => {
      for (const s of Object.values(seriesRef.current)) {
        if (s) try { chart.removeSeries(s) } catch (_) {}
      }
      seriesRef.current = { hist: null, macdLine: null, signalLine: null }
    }
  }, [chart])

  useEffect(() => {
    const { hist, macdLine, signalLine } = seriesRef.current
    if (!bars || bars.length === 0 || !hist) return

    const result = macd(bars)

    // Color each histogram bar: green if positive, red if negative
    const histData = result.histogram.map((p) => ({
      time:  p.time,
      value: p.value,
      color: p.value >= 0 ? '#22c55e' : '#ef4444',
    }))

    hist.setData(histData)
    macdLine.setData(result.macd)
    signalLine.setData(result.signal)

    hist.applyOptions({ visible })
    macdLine.applyOptions({ visible })
    signalLine.applyOptions({ visible })
  }, [bars, visible])

  useEffect(() => {
    for (const s of Object.values(seriesRef.current)) {
      if (s) s.applyOptions({ visible })
    }
  }, [visible])

  return null
}
