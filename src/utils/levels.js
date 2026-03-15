/**
 * levels.js — Price level detection from bar data.
 *
 * Handles:
 *   - Previous Day High/Low (Nick's Rule 1 — the backbone of everything)
 *   - Opening Range Breakout zone (first 15 minutes, 9:30–9:45 AM ET)
 *   - Open of Day candle (ODC) price
 *   - Day type classification (Trend/Range/Chop)
 *   - Weekly high/low for swing context
 *
 * All functions are pure — no side effects, no DOM access.
 * ET = America/New_York timezone.
 */

import { toETDateString, toETTime } from './timezone'

/**
 * Group bars by ET calendar date.
 *
 * @param {Array<{time, ...}>} bars - sorted oldest → newest
 * @returns {Map<string, Array>} - key: 'YYYY-MM-DD', value: bar array
 */
export function groupBarsByDay(bars) {
  const map = new Map()
  for (const bar of bars) {
    const dateStr = toETDateString(bar.time)
    if (!map.has(dateStr)) map.set(dateStr, [])
    map.get(dateStr).push(bar)
  }
  return map
}

/**
 * Get the previous trading day's high and low (Nick's Rule 1 levels).
 * Also returns weekly high/low from the most recent 5 trading days.
 *
 * @param {Array<{time, high, low, close}>} bars - sorted oldest → newest, ≥2 trading days
 * @returns {{
 *   prevHigh:    number | null,
 *   prevLow:     number | null,
 *   weeklyHigh:  number | null,
 *   weeklyLow:   number | null,
 *   prevDate:    string | null
 * }}
 */
export function getPreviousLevels(bars, byDay = null) {
  if (!bars || bars.length === 0) {
    return { prevHigh: null, prevLow: null, weeklyHigh: null, weeklyLow: null, prevDate: null }
  }

  const grouped   = byDay ?? groupBarsByDay(bars)
  const days      = Array.from(grouped.keys()).sort()
  const todayKey  = days[days.length - 1]
  const prevKey   = days[days.length - 2]

  if (!prevKey) {
    return { prevHigh: null, prevLow: null, weeklyHigh: null, weeklyLow: null, prevDate: null }
  }

  const prevBars = grouped.get(prevKey)
  const prevHigh = Math.max(...prevBars.map((b) => b.high))
  const prevLow  = Math.min(...prevBars.map((b) => b.low))

  // Weekly: last 5 trading days excluding today
  const recentDays  = days.slice(-6, -1)   // up to 5 days before today
  const weeklyBars  = recentDays.flatMap((d) => grouped.get(d) ?? [])
  const weeklyHigh  = weeklyBars.length ? Math.max(...weeklyBars.map((b) => b.high)) : null
  const weeklyLow   = weeklyBars.length ? Math.min(...weeklyBars.map((b) => b.low))  : null

  return { prevHigh, prevLow, weeklyHigh, weeklyLow, prevDate: prevKey }
}

/**
 * Get the Open of Day Candle (ODC) price and today's time range.
 * The open price of the first bar of today's session.
 *
 * @param {Array<{time, open, ...}>} bars - sorted oldest → newest
 * @returns {{ price: number, startTime: number, endTime: number } | null}
 */
export function getOpenOfDay(bars, byDay = null) {
  if (!bars || bars.length === 0) return null

  const grouped   = byDay ?? groupBarsByDay(bars)
  const days      = Array.from(grouped.keys()).sort()
  const todayKey  = days[days.length - 1]
  const todayBars = grouped.get(todayKey)

  if (!todayBars || todayBars.length === 0) return null

  // Sort today's bars by time (copy to avoid mutating input)
  const sorted = [...todayBars].sort((a, b) => a.time - b.time)
  return {
    price:     sorted[0].open,
    startTime: sorted[0].time,
    endTime:   sorted[sorted.length - 1].time,
  }
}

/**
 * Compute the Opening Range Breakout zone (first 15 minutes of session).
 * Only valid on intraday timeframes (1m, 5m, 15m).
 *
 * Session start: 9:30 AM ET
 * ORB window:   9:30 AM → 9:45 AM ET (15 minutes)
 *
 * @param {Array<{time, high, low, close}>} bars - sorted oldest → newest, intraday
 * @param {number} orbMinutes - default 15
 * @returns {{
 *   orbHigh: number | null,
 *   orbLow:  number | null,
 *   orbTime: number | null,   // Unix timestamp of last bar in ORB window
 *   valid:   boolean
 * }}
 */
export function getORBZone(bars, orbMinutes = 15, byDay = null) {
  if (!bars || bars.length === 0) {
    return { orbHigh: null, orbLow: null, orbTime: null, valid: false }
  }

  const grouped   = byDay ?? groupBarsByDay(bars)
  const days      = Array.from(grouped.keys()).sort()
  const todayKey  = days[days.length - 1]
  const todayBars = [...(grouped.get(todayKey) ?? [])].sort((a, b) => a.time - b.time)

  // Filter to bars within the ORB window
  const orbBars = todayBars.filter((bar) => {
    const { hour, minute } = toETTime(bar.time)
    const minutesSinceOpen = (hour - 9) * 60 + (minute - 30)
    return minutesSinceOpen >= 0 && minutesSinceOpen < orbMinutes
  })

  if (orbBars.length === 0) {
    return { orbHigh: null, orbLow: null, orbTime: null, valid: false }
  }

  const orbHigh = Math.max(...orbBars.map((b) => b.high))
  const orbLow  = Math.min(...orbBars.map((b) => b.low))
  const orbTime = orbBars[orbBars.length - 1].time

  return { orbHigh, orbLow, orbTime, valid: true }
}

/**
 * Classify the current day type based on Nick's Rule 1.
 *
 * @param {Array<{time, high, low, close}>} bars - all bars including today
 * @param {number} prevHigh - previous day's high
 * @param {number} prevLow  - previous day's low
 * @returns {{
 *   type:      'trend-bull' | 'trend-bear' | 'chop' | 'range',
 *   brokePDH:  boolean,
 *   brokePDL:  boolean,
 *   label:     string,
 *   color:     string
 * }}
 */
export function classifyDayType(bars, prevHigh, prevLow, byDay = null) {
  if (!bars || bars.length === 0 || prevHigh == null || prevLow == null) {
    return { type: 'range', brokePDH: false, brokePDL: false, label: '↔ Range Day', color: '#6b7280' }
  }

  const grouped   = byDay ?? groupBarsByDay(bars)
  const days      = Array.from(grouped.keys()).sort()
  const todayKey  = days[days.length - 1]
  const todayBars = grouped.get(todayKey) ?? []

  const brokePDH = todayBars.some((b) => b.high > prevHigh)
  const brokePDL = todayBars.some((b) => b.low  < prevLow)

  if (brokePDH && !brokePDL) {
    return { type: 'trend-bull', brokePDH, brokePDL, label: '↑ Trend Day — Bullish', color: '#22c55e' }
  }
  if (brokePDL && !brokePDH) {
    return { type: 'trend-bear', brokePDH, brokePDL, label: '↓ Trend Day — Bearish', color: '#ef4444' }
  }
  if (brokePDH && brokePDL) {
    return { type: 'chop', brokePDH, brokePDL, label: '⚡ Chop — Both Levels Broken', color: '#f59e0b' }
  }
  return { type: 'range', brokePDH, brokePDL, label: '↔ Range Day', color: '#6b7280' }
}
