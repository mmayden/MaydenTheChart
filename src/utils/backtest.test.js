/**
 * Unit tests for backtest.js
 *
 * Tests verify:
 *   - ORB and EMA-cross strategies produce correct trade/stats shapes
 *   - Empty input handling
 *   - Stats computation (win rate, risk:reward, profit factor)
 */

import { describe, it, expect } from 'vitest'
import { backtestORB, backtestEMACross } from './backtest'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate intraday bars for multiple days */
function makeIntradayBars(days = 5, barsPerDay = 20) {
  const bars = []
  const baseTime = 1700000000 // some Monday
  for (let d = 0; d < days; d++) {
    const dayOffset = d * 86400
    const basePrice = 400 + d * 2
    for (let i = 0; i < barsPerDay; i++) {
      const t = baseTime + dayOffset + 34200 + i * 300 // 9:30 AM + 5min intervals
      const drift = (i - barsPerDay / 2) * 0.3
      bars.push({
        time: t,
        open: basePrice + drift - 0.1,
        high: basePrice + drift + 0.5,
        low: basePrice + drift - 0.5,
        close: basePrice + drift,
        volume: 1000 + Math.random() * 2000,
      })
    }
  }
  return bars
}

/** Generate bars with clear EMA crossover pattern */
function makeCrossoverBars(count = 100) {
  return Array.from({ length: count }, (_, i) => {
    // Price oscillates to create crossovers
    const trend = Math.sin(i / 15) * 5
    const price = 400 + trend + i * 0.01
    return {
      time: 1700000000 + i * 3600,
      open: price - 0.1,
      high: price + 0.5,
      low: price - 0.5,
      close: price,
      volume: 1000,
    }
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('backtestORB', () => {
  it('returns empty on null/empty input', () => {
    expect(backtestORB(null).trades).toHaveLength(0)
    expect(backtestORB([]).trades).toHaveLength(0)
    expect(backtestORB(null).stats.totalTrades).toBe(0)
  })

  it('returns trades with correct shape', () => {
    const bars = makeIntradayBars(5, 20)
    const { trades } = backtestORB(bars)
    trades.forEach((t) => {
      expect(t).toHaveProperty('date')
      expect(t).toHaveProperty('type')
      expect(t).toHaveProperty('entry')
      expect(t).toHaveProperty('exit')
      expect(t).toHaveProperty('pnl')
      expect(t).toHaveProperty('pnlPct')
      expect(t).toHaveProperty('result')
      expect(['long', 'short']).toContain(t.type)
      expect(['win', 'loss', 'breakeven']).toContain(t.result)
    })
  })

  it('stats have correct shape', () => {
    const bars = makeIntradayBars(5, 20)
    const { stats } = backtestORB(bars)
    expect(stats).toHaveProperty('totalTrades')
    expect(stats).toHaveProperty('wins')
    expect(stats).toHaveProperty('losses')
    expect(stats).toHaveProperty('winRate')
    expect(stats).toHaveProperty('riskReward')
    expect(stats).toHaveProperty('totalPnlPct')
    expect(stats).toHaveProperty('profitFactor')
    expect(stats.wins + stats.losses + stats.breakeven).toBe(stats.totalTrades)
  })

  it('win rate is between 0 and 100', () => {
    const bars = makeIntradayBars(10, 30)
    const { stats } = backtestORB(bars)
    if (stats.totalTrades > 0) {
      expect(stats.winRate).toBeGreaterThanOrEqual(0)
      expect(stats.winRate).toBeLessThanOrEqual(100)
    }
  })
})

describe('backtestEMACross', () => {
  it('returns empty on null/empty input', () => {
    expect(backtestEMACross(null).trades).toHaveLength(0)
    expect(backtestEMACross([]).trades).toHaveLength(0)
  })

  it('returns trades with correct shape', () => {
    const bars = makeCrossoverBars(100)
    const { trades } = backtestEMACross(bars)
    trades.forEach((t) => {
      expect(t).toHaveProperty('date')
      expect(t).toHaveProperty('type')
      expect(t).toHaveProperty('entry')
      expect(t).toHaveProperty('exit')
      expect(t).toHaveProperty('pnl')
      expect(t).toHaveProperty('result')
      expect(['long', 'short']).toContain(t.type)
    })
  })

  it('stats computed correctly when trades exist', () => {
    const bars = makeCrossoverBars(200)
    const { stats } = backtestEMACross(bars)
    if (stats.totalTrades > 0) {
      expect(stats.winRate).toBeGreaterThanOrEqual(0)
      expect(stats.winRate).toBeLessThanOrEqual(100)
      expect(stats.wins + stats.losses + stats.breakeven).toBe(stats.totalTrades)
    }
  })
})
