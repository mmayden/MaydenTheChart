/**
 * SROverlay — Support & Resistance lines + swing high/low markers.
 *
 * Renders:
 *   - Support levels as green horizontal price lines (opacity = strength)
 *   - Resistance levels as red horizontal price lines (opacity = strength)
 *   - Swing high markers (▼ arrows) and swing low markers (▲ arrows)
 *
 * Uses createPriceLine on the candle series for levels,
 * and setMarkers on the candle series for swing dots.
 */

import { useEffect, useRef } from 'react'
import { log } from '../../utils/logger'
import { findSupportResistance } from '../../utils/supportResistance'
import { SR_RESISTANCE_RGB, SR_SUPPORT_RGB, SR_SWING_HIGH, SR_SWING_LOW } from '../../constants/chart'

const MAX_LEVELS = 8  // cap to avoid visual clutter

export function SROverlay({ candleSeries, bars, visible = true }) {
  const linesRef = useRef([])

  useEffect(() => {
    if (!candleSeries || !bars || bars.length === 0) return

    // Clean up previous lines
    for (const line of linesRef.current) {
      try { candleSeries.removePriceLine(line) } catch (_) {}
    }
    linesRef.current = []

    if (!visible) {
      try { candleSeries.setMarkers([]) } catch (_) {}
      return
    }

    try {
      const { support, resistance, swingHighs, swingLows } = findSupportResistance(bars, 10, 0.002)

      // Max strength for opacity scaling
      const allLevels = [...support, ...resistance]
      const maxStrength = Math.max(1, ...allLevels.map((l) => l.strength))

      // Draw resistance lines (red, above price)
      for (const level of resistance.slice(0, MAX_LEVELS)) {
        const opacity = Math.max(0.3, Math.min(1, level.strength / maxStrength))
        const line = candleSeries.createPriceLine({
          price:            level.price,
          color:            `rgba(${SR_RESISTANCE_RGB.join(',')}, ${opacity})`,
          lineWidth:        1,
          lineStyle:        1, // dotted
          axisLabelVisible: true,
          title:            `R ${level.strength > 1 ? '×' + level.strength : ''}`,
        })
        linesRef.current.push(line)
      }

      // Draw support lines (green, below price)
      for (const level of support.slice(0, MAX_LEVELS)) {
        const opacity = Math.max(0.3, Math.min(1, level.strength / maxStrength))
        const line = candleSeries.createPriceLine({
          price:            level.price,
          color:            `rgba(${SR_SUPPORT_RGB.join(',')}, ${opacity})`,
          lineWidth:        1,
          lineStyle:        1, // dotted
          axisLabelVisible: true,
          title:            `S ${level.strength > 1 ? '×' + level.strength : ''}`,
        })
        linesRef.current.push(line)
      }

      // Build a set of valid bar times so markers don't reference missing candles
      const validTimes = new Set(bars.map((b) => b.time))

      const markers = []

      for (const sh of swingHighs) {
        if (!validTimes.has(sh.time)) continue
        markers.push({
          time:     sh.time,
          position: 'aboveBar',
          color:    SR_SWING_HIGH,
          shape:    'arrowDown',
          text:     '',
        })
      }

      for (const sl of swingLows) {
        if (!validTimes.has(sl.time)) continue
        markers.push({
          time:     sl.time,
          position: 'belowBar',
          color:    SR_SWING_LOW,
          shape:    'arrowUp',
          text:     '',
        })
      }

      // Sort markers by time (required by lightweight-charts)
      markers.sort((a, b) => a.time - b.time)
      candleSeries.setMarkers(markers)
    } catch (err) {
      log.warn('SROverlay', 'Error rendering S/R levels', err)
    }

    return () => {
      for (const line of linesRef.current) {
        try { candleSeries.removePriceLine(line) } catch (_) {}
      }
      linesRef.current = []
      try { candleSeries.setMarkers([]) } catch (_) {}
    }
  }, [candleSeries, bars, visible])

  return null
}
