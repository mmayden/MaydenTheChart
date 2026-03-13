/**
 * LevelOverlay — Renders key price levels on the chart.
 *
 * Levels rendered:
 *   - Previous Day High (PDH) — gold dashed line, labeled "PDH"
 *   - Previous Day Low  (PDL) — gold dashed line, labeled "PDL"
 *   - Open of Day Candle (ODC) — white solid line
 *   - ORB zone — shaded box using two horizontal lines (only on intraday TFs)
 *
 * Uses lightweight-charts v5 price lines (createPriceLine) on the candle series,
 * not separate series — this is the correct v5 pattern for horizontal levels.
 */

import { useEffect, useRef } from 'react'
import { getPreviousLevels, getOpenOfDay, getORBZone } from '../../utils/levels'
import {
  PREV_LEVEL_COLOR,
  ODC_COLOR,
  ORB_COLOR,
} from '../../constants/chart'

export function LevelOverlay({ candleSeries, bars, showORB = true, visible = true }) {
  const linesRef = useRef([])  // array of { line, series } for cleanup

  useEffect(() => {
    if (!candleSeries || !bars || bars.length === 0) return

    // Clear previous lines
    for (const { line } of linesRef.current) {
      try { candleSeries.removePriceLine(line) } catch (_) {}
    }
    linesRef.current = []

    const { prevHigh, prevLow } = getPreviousLevels(bars)
    const odc                   = getOpenOfDay(bars)
    const orb                   = getORBZone(bars)

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

    // Open of Day Candle — white thin solid
    if (odc) {
      addLine(odc, {
        color:         ODC_COLOR,
        lineWidth:     1,
        lineStyle:     0,   // solid
        axisLabelVisible: true,
        title:         'ODC',
      })
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
    }
  }, [candleSeries, bars, showORB, visible])

  return null
}
