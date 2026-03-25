/**
 * LevelOverlay — Renders key price levels on the chart.
 *
 * Levels rendered:
 *   - Previous Day High (PDH) — gold dashed price line, labeled "PDH"
 *   - Previous Day Low  (PDL) — gold dashed price line, labeled "PDL"
 *   - Open of Day Candle (ODC) — slate LineSeries scoped to today's session only
 *   - ORB zone — two horizontal price lines for high/low (only on intraday TFs)
 *
 * PDH/PDL/ORB use createPriceLine (full-width horizontal).
 * ODC uses a separate LineSeries so it only spans today's bars.
 *
 * Design: ODC series is created once when chart mounts and updated
 * imperatively when bars change. Price lines are lightweight and
 * recreated on data change (no series lifecycle overhead).
 */

import { useEffect, useRef } from 'react'
import { LineSeries } from 'lightweight-charts'
import { groupBarsByDay, getPreviousLevels, getOpenOfDay, getORBZone } from '../../utils/levels'
import {
  PREV_LEVEL_COLOR,
  ODC_COLOR,
  ORB_COLOR,
} from '../../constants/chart'

export function LevelOverlay({ chart, candleSeries, bars, byDay: byDayProp = null, showORB = true, visible = true }) {
  const linesRef     = useRef([])   // price lines on candleSeries
  const odcSeriesRef = useRef(null) // persistent ODC LineSeries
  const disposedRef  = useRef(false)

  // Create ODC series once when chart is available
  useEffect(() => {
    if (!chart) return
    disposedRef.current = false

    try {
      const odcSeries = chart.addSeries(LineSeries, {
        color:                  ODC_COLOR,
        lineWidth:              1,
        lineStyle:              2,   // dashed
        priceLineVisible:       false,
        lastValueVisible:       true,
        crosshairMarkerVisible: false,
        title:                  'ODC',
        visible,
      })
      odcSeriesRef.current = odcSeries
    } catch { /* chart may be mid-teardown */ }

    return () => {
      disposedRef.current = true
      if (odcSeriesRef.current) {
        try { chart.removeSeries(odcSeriesRef.current) } catch { /* chart may be destroyed */ }
        odcSeriesRef.current = null
      }
    }
  }, [chart]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update level data when bars change
  useEffect(() => {
    if (disposedRef.current || !candleSeries || !bars || bars.length === 0) return

    // Clean up previous price lines (lightweight — no series lifecycle)
    for (const line of linesRef.current) {
      try { candleSeries.removePriceLine(line) } catch { /* already removed */ }
    }
    linesRef.current = []

    // Clear ODC data when not visible
    if (!visible) {
      try { odcSeriesRef.current?.setData([]) } catch { /* series removed */ }
      return
    }

    try {
      const byDay                 = byDayProp ?? groupBarsByDay(bars)
      const { prevHigh, prevLow } = getPreviousLevels(bars, byDay)
      const odc                   = getOpenOfDay(bars, byDay)
      const orb                   = getORBZone(bars, 15, byDay)

      const addLine = (price, options) => {
        if (price == null) return
        const line = candleSeries.createPriceLine({ price, ...options })
        linesRef.current.push(line)
      }

      // Previous Day High — gold dashed
      if (prevHigh) {
        addLine(prevHigh, {
          color:            PREV_LEVEL_COLOR,
          lineWidth:        1,
          lineStyle:        2,
          axisLabelVisible: true,
          title:            'PDH',
        })
      }

      // Previous Day Low — gold dashed
      if (prevLow) {
        addLine(prevLow, {
          color:            PREV_LEVEL_COLOR,
          lineWidth:        1,
          lineStyle:        2,
          axisLabelVisible: true,
          title:            'PDL',
        })
      }

      // ODC — update existing series data (no create/destroy)
      if (odc && odcSeriesRef.current) {
        odcSeriesRef.current.setData([
          { time: odc.startTime, value: odc.price },
          { time: odc.endTime,   value: odc.price },
        ])
      } else if (odcSeriesRef.current) {
        odcSeriesRef.current.setData([])
      }

      // ORB zone — two lines for high and low (only intraday)
      if (showORB && orb.valid) {
        addLine(orb.orbHigh, {
          color:            ORB_COLOR,
          lineWidth:        1,
          lineStyle:        1,
          axisLabelVisible: true,
          title:            'ORB H',
        })
        addLine(orb.orbLow, {
          color:            ORB_COLOR,
          lineWidth:        1,
          lineStyle:        1,
          axisLabelVisible: true,
          title:            'ORB L',
        })
      }
    } catch { /* chart/series may be mid-teardown during preset switch */ }

    return () => {
      for (const line of linesRef.current) {
        try { candleSeries.removePriceLine(line) } catch { /* already removed */ }
      }
      linesRef.current = []
      try { odcSeriesRef.current?.setData([]) } catch { /* series removed */ }
    }
  }, [candleSeries, bars, byDayProp, showORB, visible])

  // Toggle ODC visibility without re-creating series
  useEffect(() => {
    if (disposedRef.current || !odcSeriesRef.current) return
    try {
      odcSeriesRef.current.applyOptions({ visible })
    } catch { /* series may have been removed */ }
  }, [visible])

  return null
}
