/**
 * LevelOverlay — Renders key price levels on the chart.
 *
 * Levels rendered:
 *   - Previous Day High (PDH) — gold dashed price line, labeled "PDH"
 *   - Previous Day Low  (PDL) — gold dashed price line, labeled "PDL"
 *   - Open of Day Candle (ODC) — white LineSeries scoped to today's session only
 *   - ORB zone — two horizontal price lines for high/low (only on intraday TFs)
 *
 * PDH/PDL/ORB use createPriceLine (full-width horizontal).
 * ODC uses a separate LineSeries so it only spans today's bars.
 */

import { useEffect, useRef } from 'react'
import { LineSeries } from 'lightweight-charts'
import { groupBarsByDay, getPreviousLevels, getOpenOfDay, getORBZone } from '../../utils/levels'
import {
  PREV_LEVEL_COLOR,
  ODC_COLOR,
  ORB_COLOR,
} from '../../constants/chart'

export function LevelOverlay({ chart, candleSeries, bars, showORB = true, visible = true }) {
  const linesRef    = useRef([])  // array of { line, series } for cleanup
  const odcSeriesRef = useRef(null)

  useEffect(() => {
    if (!candleSeries || !bars || bars.length === 0) return

    // Clear previous price lines
    for (const { line } of linesRef.current) {
      try { candleSeries.removePriceLine(line) } catch (_) {}
    }
    linesRef.current = []

    // Clear previous ODC line series
    if (odcSeriesRef.current && chart) {
      try { chart.removeSeries(odcSeriesRef.current) } catch (_) {}
      odcSeriesRef.current = null
    }

    const byDay                 = groupBarsByDay(bars)
    const { prevHigh, prevLow } = getPreviousLevels(bars, byDay)
    const odc                   = getOpenOfDay(bars, byDay)
    const orb                   = getORBZone(bars, 15, byDay)

    const addLine = (price, options) => {
      if (price == null || !visible) return
      const line = candleSeries.createPriceLine({
        price,
        ...options,
      })
      linesRef.current.push({ line })
    }

    // Previous Day High — gold dashed
    if (prevHigh) {
      addLine(prevHigh, {
        color:         PREV_LEVEL_COLOR,
        lineWidth:     1,
        lineStyle:     2,   // dashed
        axisLabelVisible: true,
        title:         'PDH',
      })
    }

    // Previous Day Low — gold dashed
    if (prevLow) {
      addLine(prevLow, {
        color:         PREV_LEVEL_COLOR,
        lineWidth:     1,
        lineStyle:     2,
        axisLabelVisible: true,
        title:         'PDL',
      })
    }

    // Open of Day Candle — amber dashed line scoped to today's session only
    if (odc && chart && visible) {
      const odcSeries = chart.addSeries(LineSeries, {
        color:                  ODC_COLOR,
        lineWidth:              1,
        lineStyle:              2,   // dashed
        priceLineVisible:       false,
        lastValueVisible:       true,
        crosshairMarkerVisible: false,
        title:                  'ODC',
      })
      odcSeries.setData([
        { time: odc.startTime, value: odc.price },
        { time: odc.endTime,   value: odc.price },
      ])
      odcSeriesRef.current = odcSeries
    }

    // ORB zone — two lines for high and low (only intraday)
    if (showORB && orb.valid) {
      addLine(orb.orbHigh, {
        color:         ORB_COLOR,
        lineWidth:     1,
        lineStyle:     1,   // dotted
        axisLabelVisible: true,
        title:         'ORB H',
      })
      addLine(orb.orbLow, {
        color:         ORB_COLOR,
        lineWidth:     1,
        lineStyle:     1,
        axisLabelVisible: true,
        title:         'ORB L',
      })
    }

    return () => {
      for (const { line } of linesRef.current) {
        try { candleSeries.removePriceLine(line) } catch (_) {}
      }
      linesRef.current = []
      if (odcSeriesRef.current && chart) {
        try { chart.removeSeries(odcSeriesRef.current) } catch (_) {}
        odcSeriesRef.current = null
      }
    }
  }, [chart, candleSeries, bars, showORB, visible])

  return null
}
