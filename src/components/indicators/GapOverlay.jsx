/**
 * GapOverlay — Renders unfilled weekly gaps on the chart.
 *
 * Each unfilled gap is rendered as two price lines (top + bottom of gap zone).
 * Filled gaps are not displayed. Partially filled gaps show fill percentage in label.
 *
 * Follows the LevelOverlay pattern: createPriceLine on candleSeries, cleanup via refs.
 */

import { useEffect, useRef } from 'react'
import { detectWeeklyGaps, checkGapFills } from '../../utils/gaps'
import { GAP_UP_COLOR, GAP_DOWN_COLOR } from '../../constants/chart'

export function GapOverlay({ candleSeries, bars, weeklyBars, visible = true }) {
  const linesRef = useRef([])

  useEffect(() => {
    // Clean up previous lines
    for (const line of linesRef.current) {
      try { candleSeries.removePriceLine(line) } catch { /* series may be destroyed */ }
    }
    linesRef.current = []

    if (!candleSeries || !weeklyBars?.length || !visible) return

    const rawGaps = detectWeeklyGaps(weeklyBars)
    if (!rawGaps.length) return

    // Check fill status against current bars
    const gaps = checkGapFills(rawGaps, bars ?? [])

    // Only show unfilled gaps (fillPct < 1)
    const unfilled = gaps.filter((g) => !g.filled)

    for (const gap of unfilled) {
      const color = gap.direction === 'up' ? GAP_UP_COLOR : GAP_DOWN_COLOR
      const fillLabel = gap.fillPct > 0 ? ` ${Math.round(gap.fillPct * 100)}%` : ''

      // Top line
      const topLine = candleSeries.createPriceLine({
        price:            gap.top,
        color,
        lineWidth:        1,
        lineStyle:        3,   // LargeGapped (sparse dots — visually distinct from S/R)
        axisLabelVisible: false,
        title:            `Gap ${gap.direction === 'up' ? '↑' : '↓'}${fillLabel}`,
      })
      linesRef.current.push(topLine)

      // Bottom line
      const bottomLine = candleSeries.createPriceLine({
        price:            gap.bottom,
        color,
        lineWidth:        1,
        lineStyle:        3,
        axisLabelVisible: false,
        title:            '',
      })
      linesRef.current.push(bottomLine)
    }

    return () => {
      for (const line of linesRef.current) {
        try { candleSeries.removePriceLine(line) } catch { /* series may be destroyed */ }
      }
      linesRef.current = []
    }
  }, [candleSeries, bars, weeklyBars, visible])

  return null
}
