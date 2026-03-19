/**
 * SubIndicatorValueOverlay — Shows current indicator value as an HTML overlay
 * on top of the RSI/MACD mini chart. Updates on crosshair move to show the
 * value at the hovered bar.
 *
 * Performance: Uses refs + direct DOM mutation (no React re-renders on mousemove).
 *
 * Props:
 *   type      — 'rsi' | 'macd'
 *   bars      — array of bar objects
 *   mainChart — main chart instance for crosshair sync
 */

import { useEffect, useRef, useMemo } from 'react'
import { rsi as calcRsi, macd as calcMacd } from '../../utils/indicators'
import {
  RSI_LINE_COLOR,
  MACD_LINE_COLOR,
  MACD_SIGNAL_COLOR,
} from '../../constants/chart'

function formatNum(n) {
  if (n == null || isNaN(n)) return '—'
  return n.toFixed(2)
}

export function SubIndicatorValueOverlay({ type, bars, mainChart }) {
  const labelRef = useRef(null)

  // Pre-compute indicator values indexed by time for O(1) crosshair lookup
  const valueMap = useMemo(() => {
    if (!bars?.length) return new Map()
    const map = new Map()

    if (type === 'rsi') {
      const { series } = calcRsi(bars, 14)
      for (const pt of series) {
        map.set(pt.time, { rsi: pt.value })
      }
    } else {
      const result = calcMacd(bars)
      for (let i = 0; i < result.macd.length; i++) {
        const t = result.macd[i].time
        map.set(t, {
          macd:   result.macd[i].value,
          signal: result.signalLine[i]?.value,
          hist:   result.histogram[i]?.value,
        })
      }
    }
    return map
  }, [bars, type])

  // Latest values for default display
  const latestText = useMemo(() => {
    if (!bars?.length) return ''
    // Walk backward to find latest available indicator value
    for (let i = bars.length - 1; i >= 0; i--) {
      const v = valueMap.get(bars[i].time)
      if (v) {
        if (type === 'rsi') return `${formatNum(v.rsi)}`
        return `${formatNum(v.macd)} / ${formatNum(v.signal)} / ${formatNum(v.hist)}`
      }
    }
    return ''
  }, [bars, valueMap, type])

  // Show latest value on mount
  useEffect(() => {
    if (labelRef.current) {
      labelRef.current.textContent = latestText
    }
  }, [latestText])

  // Subscribe to crosshair move on main chart
  useEffect(() => {
    if (!mainChart || !labelRef.current) return
    const el = labelRef.current

    const handler = (param) => {
      if (!param.time) {
        // Crosshair left — show latest value
        el.textContent = latestText
        return
      }
      const v = valueMap.get(param.time)
      if (!v) {
        el.textContent = latestText
        return
      }
      if (type === 'rsi') {
        el.textContent = formatNum(v.rsi)
      } else {
        el.textContent = `${formatNum(v.macd)} / ${formatNum(v.signal)} / ${formatNum(v.hist)}`
      }
    }

    mainChart.subscribeCrosshairMove(handler)
    return () => mainChart.unsubscribeCrosshairMove(handler)
  }, [mainChart, valueMap, latestText, type])

  const color = type === 'rsi' ? RSI_LINE_COLOR : MACD_LINE_COLOR

  return (
    <span
      ref={labelRef}
      className="absolute z-10 pointer-events-none select-none font-mono"
      style={{
        top: 3,
        right: 60,
        fontSize: 9,
        color,
        opacity: 0.85,
        letterSpacing: '0.02em',
      }}
    />
  )
}
