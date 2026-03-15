/**
 * backtest.js — Backtesting engine.
 *
 * Replays historical bars through the same indicator functions the live chart uses.
 * No duplicate math — calls ema(), rsi(), vwapWithBands(), etc. directly.
 *
 * Strategies:
 *   orb       — Opening Range Breakout (above ORB high = long, below ORB low = short)
 *   ema-cross — EMA 9 crosses EMA 48 = entry signal
 *   vwap      — VWAP bounce (price touches VWAP and reverses)
 */

import { ema, relativeVolume, vwapWithBands } from './indicators'
import { groupBarsByDay, getPreviousLevels, getORBZone, classifyDayType } from './levels'
import { EMA_PERIODS } from '../constants/chart'

// ── ORB Strategy ──────────────────────────────────────────────────────────────

/**
 * Backtest ORB breakout strategy on historical bars.
 *
 * Rules:
 *   - Entry: price breaks above ORB high (long) or below ORB low (short) after 9:45 AM
 *   - Exit: end of day (simplified — no trailing stop for MVP)
 *   - Filter: optional RVOL ≥ 1.5x on breakout bar
 *
 * @param {Array} bars - sorted oldest → newest, intraday bars
 * @param {Object} options
 * @param {boolean} options.requireVolume - require RVOL ≥ 1.5 on breakout bar
 * @returns {{ trades: Array, stats: Object }}
 */
export function backtestORB(bars, { requireVolume = false } = {}) {
  if (!bars?.length) return { trades: [], stats: emptyStats() }

  const byDay  = groupBarsByDay(bars)
  const rvol   = relativeVolume(bars)
  const rvolMap = new Map(rvol.series.map((s) => [s.time, s]))
  const trades = []
  const days   = Array.from(byDay.keys()).sort()

  for (let d = 1; d < days.length; d++) {
    const dayBars = byDay.get(days[d])
    if (!dayBars || dayBars.length < 4) continue

    const orbResult = getORBZone(dayBars, 15)
    if (!orbResult?.valid) continue

    const { orbHigh, orbLow } = orbResult

    // Find first bar after ORB window that breaks
    let entry = null
    for (let i = 3; i < dayBars.length; i++) {
      const bar = dayBars[i]

      // Volume filter
      if (requireVolume) {
        const rv = rvolMap.get(bar.time)
        if (!rv || rv.rvol < 1.5) continue
      }

      if (bar.close > orbHigh && !entry) {
        entry = { type: 'long', price: bar.close, time: bar.time, bar: i }
        break
      }
      if (bar.close < orbLow && !entry) {
        entry = { type: 'short', price: bar.close, time: bar.time, bar: i }
        break
      }
    }

    if (!entry) continue

    // Exit at end of day
    const exitBar = dayBars[dayBars.length - 1]
    const exitPrice = exitBar.close

    const pnl = entry.type === 'long'
      ? exitPrice - entry.price
      : entry.price - exitPrice

    trades.push({
      date: days[d],
      type: entry.type,
      entry: entry.price,
      exit: exitPrice,
      pnl,
      pnlPct: ((pnl / entry.price) * 100),
      result: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
    })
  }

  return { trades, stats: computeStats(trades) }
}

// ── EMA Cross Strategy ────────────────────────────────────────────────────────

/**
 * Backtest EMA 9/48 crossover strategy.
 *
 * Rules:
 *   - Long when EMA 9 crosses above EMA 48
 *   - Short when EMA 9 crosses below EMA 48
 *   - Exit on opposite cross
 *
 * @param {Array} bars - sorted oldest → newest
 * @returns {{ trades: Array, stats: Object }}
 */
export function backtestEMACross(bars) {
  if (!bars?.length) return { trades: [], stats: emptyStats() }

  const ema9  = ema(bars, EMA_PERIODS[0]).series
  const ema48 = ema(bars, EMA_PERIODS[1]).series

  const ema48Map = new Map(ema48.map((p) => [p.time, p.value]))
  const barMap   = new Map(bars.map((b) => [b.time, b]))
  const trades   = []
  let position   = null

  for (let i = 1; i < ema9.length; i++) {
    const prev9  = ema9[i - 1].value
    const curr9  = ema9[i].value
    const prev48 = ema48Map.get(ema9[i - 1].time)
    const curr48 = ema48Map.get(ema9[i].time)

    if (prev48 == null || curr48 == null) continue

    const bar = barMap.get(ema9[i].time)
    if (!bar) continue

    const bullCross = prev9 <= prev48 && curr9 > curr48
    const bearCross = prev9 >= prev48 && curr9 < curr48

    // Close existing position on opposite cross
    if (position && ((position.type === 'long' && bearCross) || (position.type === 'short' && bullCross))) {
      const pnl = position.type === 'long'
        ? bar.close - position.price
        : position.price - bar.close

      trades.push({
        date: new Date(bar.time * 1000).toISOString().slice(0, 10),
        type: position.type,
        entry: position.price,
        exit: bar.close,
        pnl,
        pnlPct: ((pnl / position.price) * 100),
        result: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
      })
      position = null
    }

    // Open new position
    if (!position) {
      if (bullCross) position = { type: 'long', price: bar.close, time: bar.time }
      if (bearCross) position = { type: 'short', price: bar.close, time: bar.time }
    }
  }

  return { trades, stats: computeStats(trades) }
}

// ── VWAP Bounce Strategy ──────────────────────────────────────────────────────

/**
 * Backtest VWAP bounce strategy on intraday bars.
 *
 * Rules:
 *   - Long when price touches VWAP from above and bounces (close > VWAP after touch)
 *   - Short when price touches VWAP from below and rejects
 *   - Exit at end of day
 *   - Optional: require bullish day type for longs, bearish for shorts
 *
 * @param {Array} bars - sorted oldest → newest, intraday bars
 * @param {Object} options
 * @param {boolean} options.requireTrend - require aligned day type
 * @param {number} options.touchThresholdPct - how close to VWAP counts as "touch" (default 0.1%)
 * @returns {{ trades: Array, stats: Object }}
 */
export function backtestVWAPBounce(bars, { requireTrend = false, touchThresholdPct = 0.1 } = {}) {
  if (!bars?.length) return { trades: [], stats: emptyStats() }

  const byDay  = groupBarsByDay(bars)
  const trades = []
  const days   = Array.from(byDay.keys()).sort()

  for (let d = 1; d < days.length; d++) {
    const dayBars = byDay.get(days[d])
    if (!dayBars || dayBars.length < 10) continue

    // Compute VWAP for this day's bars
    const vwapResult = vwapWithBands(dayBars)
    const vwapSeries = vwapResult.vwap
    if (!vwapSeries.length) continue

    // Build VWAP lookup
    const vwapMap = new Map(vwapSeries.map((v) => [v.time, v.value]))

    // Day type filter
    let dayType = null
    if (requireTrend) {
      const prevDayBars = byDay.get(days[d - 1])
      if (prevDayBars?.length) {
        const { prevHigh, prevLow } = getPreviousLevels(dayBars, byDay)
        if (prevHigh && prevLow) {
          dayType = classifyDayType(dayBars, prevHigh, prevLow, byDay)
        }
      }
    }

    let entry = null

    // Skip first 6 bars (30min on 5m) to let VWAP stabilize
    for (let i = 6; i < dayBars.length - 1; i++) {
      const bar = dayBars[i]
      const vwap = vwapMap.get(bar.time)
      if (!vwap) continue

      const threshold = vwap * (touchThresholdPct / 100)
      const touchedVWAP = Math.abs(bar.low - vwap) < threshold || Math.abs(bar.high - vwap) < threshold

      if (!touchedVWAP || entry) continue

      // Bounce detection: bar closes away from VWAP after touching
      const bullBounce = bar.low <= vwap + threshold && bar.close > vwap
      const bearBounce = bar.high >= vwap - threshold && bar.close < vwap

      if (bullBounce) {
        if (requireTrend && dayType?.type === 'trend-bear') continue
        entry = { type: 'long', price: bar.close, time: bar.time }
      } else if (bearBounce) {
        if (requireTrend && dayType?.type === 'trend-bull') continue
        entry = { type: 'short', price: bar.close, time: bar.time }
      }
    }

    if (!entry) continue

    const exitBar = dayBars[dayBars.length - 1]
    const pnl = entry.type === 'long'
      ? exitBar.close - entry.price
      : entry.price - exitBar.close

    trades.push({
      date: days[d],
      type: entry.type,
      entry: entry.price,
      exit: exitBar.close,
      pnl,
      pnlPct: ((pnl / entry.price) * 100),
      result: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
      dayType: dayType?.type ?? null,
    })
  }

  return { trades, stats: computeStats(trades) }
}

// ── Day Type Breakdown ────────────────────────────────────────────────────────

/**
 * Break down trade stats by day type (trend-bull, trend-bear, chop, range).
 *
 * @param {Array} trades - trades array with dayType field
 * @returns {Object} - { 'trend-bull': stats, 'trend-bear': stats, ... }
 */
export function statsByDayType(trades) {
  const groups = {}
  for (const t of trades) {
    const dt = t.dayType ?? 'unknown'
    if (!groups[dt]) groups[dt] = []
    groups[dt].push(t)
  }
  const result = {}
  for (const [dt, trs] of Object.entries(groups)) {
    result[dt] = computeStats(trs)
  }
  return result
}

/**
 * Add day type classification to ORB/EMA trade results retroactively.
 */
export function enrichTradesWithDayType(bars, trades) {
  if (!bars?.length || !trades?.length) return trades

  const byDay = groupBarsByDay(bars)
  const days  = Array.from(byDay.keys()).sort()

  return trades.map((t) => {
    if (t.dayType) return t
    const dayIdx = days.indexOf(t.date)
    if (dayIdx < 1) return { ...t, dayType: 'unknown' }
    const dayBars = byDay.get(t.date)
    if (!dayBars?.length) return { ...t, dayType: 'unknown' }
    const { prevHigh, prevLow } = getPreviousLevels(dayBars, byDay)
    if (!prevHigh || !prevLow) return { ...t, dayType: 'unknown' }
    const dt = classifyDayType(dayBars, prevHigh, prevLow, byDay)
    return { ...t, dayType: dt?.type ?? 'unknown' }
  })
}

// ── Equity Curve ──────────────────────────────────────────────────────────────

/**
 * Compute cumulative P&L series from trades for equity curve visualization.
 *
 * @param {Array} trades - trades array with pnlPct
 * @returns {Array<{date: string, cumPnl: number}>}
 */
export function equityCurve(trades) {
  let cum = 0
  return trades.map((t) => {
    cum += t.pnlPct
    return { date: t.date, cumPnl: parseFloat(cum.toFixed(2)) }
  })
}

// ── Stats computation ─────────────────────────────────────────────────────────

function emptyStats() {
  return {
    totalTrades: 0, wins: 0, losses: 0, breakeven: 0,
    winRate: 0, avgWin: 0, avgLoss: 0, riskReward: 0,
    totalPnlPct: 0, maxWin: 0, maxLoss: 0,
    profitFactor: 0, avgPnlPct: 0,
  }
}

function computeStats(trades) {
  if (trades.length === 0) return emptyStats()

  const wins      = trades.filter((t) => t.result === 'win')
  const losses    = trades.filter((t) => t.result === 'loss')
  const breakeven = trades.filter((t) => t.result === 'breakeven')

  const avgWin  = wins.length   > 0 ? wins.reduce((s, t) => s + t.pnlPct, 0)   / wins.length   : 0
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length : 0

  const totalWinPnl  = wins.reduce((s, t) => s + Math.abs(t.pnlPct), 0)
  const totalLossPnl = losses.reduce((s, t) => s + Math.abs(t.pnlPct), 0)

  return {
    totalTrades:  trades.length,
    wins:         wins.length,
    losses:       losses.length,
    breakeven:    breakeven.length,
    winRate:      parseFloat(((wins.length / trades.length) * 100).toFixed(1)),
    avgWin:       parseFloat(avgWin.toFixed(2)),
    avgLoss:      parseFloat(avgLoss.toFixed(2)),
    riskReward:   avgLoss !== 0 ? parseFloat((Math.abs(avgWin / avgLoss)).toFixed(2)) : 0,
    totalPnlPct:  parseFloat(trades.reduce((s, t) => s + t.pnlPct, 0).toFixed(2)),
    maxWin:       trades.length > 0 ? parseFloat(Math.max(0, ...trades.map((t) => t.pnlPct)).toFixed(2)) : 0,
    maxLoss:      trades.length > 0 ? parseFloat(Math.min(0, ...trades.map((t) => t.pnlPct)).toFixed(2)) : 0,
    profitFactor: totalLossPnl > 0 ? parseFloat((totalWinPnl / totalLossPnl).toFixed(2)) : 0,
    avgPnlPct:    parseFloat((trades.reduce((s, t) => s + t.pnlPct, 0) / trades.length).toFixed(2)),
  }
}
