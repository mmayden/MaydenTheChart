/**
 * AnnotationOverlay — Renders user-created annotations on the chart.
 *
 * Three annotation types:
 *   - 'text'  → marker with text label (via setMarkers, merged with extraMarkers)
 *   - 'arrow' → directional arrow marker (arrowUp/arrowDown)
 *   - 'hline' → horizontal price line (via createPriceLine)
 *
 * Text/arrow annotations are returned as markers for SROverlay to merge.
 * HLine annotations are managed directly via candleSeries.createPriceLine.
 */

import { useEffect, useRef, useMemo } from 'react'
import { useAnnotationsStore } from '../../store/useAnnotationsStore'
import { ANNOTATION_TEXT_COLOR, ANNOTATION_ARROW_COLOR, ANNOTATION_LINE_COLOR } from '../../constants/chart'

/**
 * Manages hline annotations as price lines on the candle series.
 * Returns marker-format annotations for text/arrow types.
 */
export function AnnotationOverlay({ candleSeries, symbol }) {
  const linesRef = useRef([])
  const annotations = useAnnotationsStore((s) => s.getAnnotations(symbol))

  // Manage hline price lines
  useEffect(() => {
    // Clean up previous lines
    for (const line of linesRef.current) {
      try { candleSeries.removePriceLine(line) } catch { /* destroyed */ }
    }
    linesRef.current = []

    if (!candleSeries || !annotations.length) return

    const hlines = annotations.filter((a) => a.type === 'hline')
    for (const ann of hlines) {
      const line = candleSeries.createPriceLine({
        price:            ann.price,
        color:            ann.color || ANNOTATION_LINE_COLOR,
        lineWidth:        1,
        lineStyle:        2,   // dashed
        axisLabelVisible: true,
        title:            ann.text || '',
      })
      linesRef.current.push(line)
    }

    return () => {
      for (const line of linesRef.current) {
        try { candleSeries.removePriceLine(line) } catch { /* destroyed */ }
      }
      linesRef.current = []
    }
  }, [candleSeries, annotations])

  return null
}

/**
 * Hook to get annotation markers for merging with SROverlay's extraMarkers.
 * Returns lightweight-charts marker objects for text/arrow annotations.
 */
export function useAnnotationMarkers(symbol, bars) {
  const annotations = useAnnotationsStore((s) => s.getAnnotations(symbol))

  return useMemo(() => {
    if (!annotations.length || !bars?.length) return []

    const validTimes = new Set(bars.map((b) => b.time))

    return annotations
      .filter((a) => a.type === 'text' || a.type === 'arrow')
      .map((a) => {
        // Find the nearest valid bar time for this annotation
        let time = a.time
        if (!validTimes.has(time)) {
          let nearest = bars[0].time
          let minDiff = Math.abs(time - nearest)
          for (const b of bars) {
            const diff = Math.abs(time - b.time)
            if (diff < minDiff) { minDiff = diff; nearest = b.time }
            if (b.time > time) break
          }
          time = nearest
        }

        if (a.type === 'text') {
          return {
            time,
            position: 'aboveBar',
            color: a.color || ANNOTATION_TEXT_COLOR,
            shape: 'circle',
            text: a.text || '•',
          }
        }

        // arrow type
        const isUp = a.direction !== 'down'
        return {
          time,
          position: isUp ? 'belowBar' : 'aboveBar',
          color: a.color || ANNOTATION_ARROW_COLOR,
          shape: isUp ? 'arrowUp' : 'arrowDown',
          text: a.text || '',
        }
      })
  }, [annotations, bars])
}
