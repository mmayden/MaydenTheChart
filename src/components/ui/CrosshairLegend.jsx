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
 *   theme      — 'dark' | 'lumpia' | 'terminal'
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

export function CrosshairLegend({ chart, bars, theme: _theme = 'dark' }) {
  const legendRef  = useRef(null)
  const barsMapRef = useRef(new Map())

  // Build time→bar lookup Map when bars change (O(1) per crosshair move)
  useEffect(() => {
    const m = new Map()
    if (bars) for (const bar of bars) m.set(bar.time, bar)
    barsMapRef.current = m
  }, [bars])

  useEffect(() => {
    if (!chart || !legendRef.current) return

    const el = legendRef.current

    const handler = (param) => {
      if (!param.time) {
        el.style.opacity = '0'
        return
      }

      const bar = barsMapRef.current.get(param.time)
      if (!bar) {
        el.style.opacity = '0'
        return
      }

      const bullish   = bar.close >= bar.open
      const styles    = getComputedStyle(document.documentElement)
      const closeClr  = bullish ? (styles.getPropertyValue('--color-bull').trim() || '#22c55e') : (styles.getPropertyValue('--color-bear').trim() || '#ef4444')
      const dimColor  = styles.getPropertyValue('--text-muted').trim() || '#9ca3af'

      el.style.opacity = '1'
      el.textContent = ''

      const spacer = () => {
        const s = document.createElement('span')
        s.textContent = '\u00A0\u00A0'
        return s
      }

      const dim = (text) => {
        const s = document.createElement('span')
        s.style.color = dimColor
        s.textContent = text
        return s
      }

      const parts = [
        dim(formatTimeET(param.time)),
        spacer(),
        dim('O'),
        document.createTextNode(' ' + formatPrice(bar.open)),
        spacer(),
        dim('H'),
        document.createTextNode(' ' + formatPrice(bar.high)),
        spacer(),
        dim('L'),
        document.createTextNode(' ' + formatPrice(bar.low)),
        spacer(),
        (() => { const s = document.createElement('span'); s.style.color = closeClr; s.textContent = 'C ' + formatPrice(bar.close); return s })(),
        spacer(),
        dim('V'),
        document.createTextNode(' ' + formatVolume(bar.volume ?? 0)),
      ]

      parts.forEach(node => el.appendChild(node))
    }

    chart.subscribeCrosshairMove(handler)

    return () => {
      chart.unsubscribeCrosshairMove(handler)
    }
  }, [chart])

  return (
    <div
      ref={legendRef}
      className="crosshair-legend"
      style={{
        position:        'absolute',
        top:             6,
        left:            6,
        zIndex:          10,
        pointerEvents:   'none',
        opacity:         0,
        fontFamily:      'ui-monospace, "Cascadia Code", "Fira Code", Menlo, monospace',
        fontSize:        11,
        lineHeight:      1.2,
        letterSpacing:   '0.02em',
        color:           'var(--text-primary, #d1d5db)',
        backgroundColor: 'rgba(11, 16, 24, 0.88)',
        padding:         '5px 10px',
        borderRadius:    4,
        whiteSpace:      'nowrap',
      }}
    />
  )
}
