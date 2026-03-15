/**
 * CrosshairLegend — OHLCV data overlay that follows the crosshair position.
 *
 * Subscribes to lightweight-charts v5 `subscribeCrosshairMove` and displays
 * bar data (Open, High, Low, Close, Volume) at the cursor's time position.
 * Close is colored green/red based on candle direction.
 *
 * Performance: Updates DOM directly via ref — no React re-renders on mouse move.
 *
 * Props:
 *   chart      — lightweight-charts IChartApi instance
 *   bars       — array of { time, open, high, low, close, volume } bar objects
 *   indicators — indicator toggle object from Zustand (reserved for future use)
 *   theme      — 'dark' | 'lumpia'
 */

import { useEffect, useRef } from 'react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVolume(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return String(v)
}

function formatPrice(n) {
  return n.toFixed(2)
}

/**
 * Format a unix timestamp (seconds) as ET date/time string.
 * lightweight-charts v5 passes time as unix seconds.
 */
function formatTimeET(unixSeconds) {
  const date = new Date(unixSeconds * 1000)
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month:    'short',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CrosshairLegend({ chart, bars, indicators, theme = 'dark' }) {
  const legendRef = useRef(null)
  const barsRef   = useRef(bars)

  // Keep bars ref current without triggering effect re-runs
  useEffect(() => {
    barsRef.current = bars
  }, [bars])

  useEffect(() => {
    if (!chart || !legendRef.current) return

    const el = legendRef.current

    const handler = (param) => {
      if (!param.time) {
        el.style.display = 'none'
        return
      }

      const bar = barsRef.current?.find(b => b.time === param.time)
      if (!bar) {
        el.style.display = 'none'
        return
      }

      const bullish   = bar.close >= bar.open
      const closeClr  = bullish ? '#22c55e' : '#ef4444'
      const dimColor  = '#9ca3af'

      el.style.display = 'block'
      el.innerHTML = [
        `<span style="color:${dimColor}">${formatTimeET(param.time)}</span>`,
        `<span style="color:${dimColor}">O</span> ${formatPrice(bar.open)}`,
        `<span style="color:${dimColor}">H</span> ${formatPrice(bar.high)}`,
        `<span style="color:${dimColor}">L</span> ${formatPrice(bar.low)}`,
        `<span style="color:${closeClr}">C ${formatPrice(bar.close)}</span>`,
        `<span style="color:${dimColor}">V</span> ${formatVolume(bar.volume ?? 0)}`,
      ].join('&nbsp;&nbsp;')
    }

    chart.subscribeCrosshairMove(handler)

    return () => {
      chart.unsubscribeCrosshairMove(handler)
    }
  }, [chart])

  return (
    <div
      ref={legendRef}
      style={{
        position:        'absolute',
        top:             8,
        left:            8,
        zIndex:          10,
        pointerEvents:   'none',
        display:         'none',
        fontFamily:      'ui-monospace, "Cascadia Code", "Fira Code", Menlo, monospace',
        fontSize:        11,
        lineHeight:      1,
        color:           '#d1d5db',
        backgroundColor: 'rgba(10, 10, 10, 0.75)',
        padding:         '4px 8px',
        borderRadius:    4,
        whiteSpace:      'nowrap',
      }}
    />
  )
}
