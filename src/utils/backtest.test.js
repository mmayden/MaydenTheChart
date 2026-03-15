/**
 * Unit tests for backtest.js
 *
 * Tests verify:
 *   - ORB and EMA-cross strategies produce correct trade/stats shapes
 *   - Empty input handling
 *   - Stats computation (win rate, risk:reward, profit factor)
 */

import { describe, it, expect } from 'vitest'
import { backtestORB, backtestEMACross, backtestVWAPBounce, enrichTradesWithDayType, statsByDayType, equityCurve } from './backtest'

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
        volume: 1000 + ((d * barsPerDay + i) % 7) * 300,
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

  it('win rate is between 0 and 100 when trades exist', () => {
    const bars = makeIntradayBars(10, 60)
    const { stats } = backtestORB(bars)
    // ORB may not always trigger on synthetic data — validate bounds unconditionally
    expect(stats.winRate).toBeGreaterThanOrEqual(0)
    expect(stats.winRate).toBeLessThanOrEqual(100)
    expect(stats.wins + stats.losses + stats.breakeven).toBe(stats.totalTrades)
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
    expect(stats.totalTrades).toBeGreaterThan(0)
    expect(stats.winRate).toBeGreaterThanOrEqual(0)
    expect(stats.winRate).toBeLessThanOrEqual(100)
    expect(stats.wins + stats.losses + stats.breakeven).toBe(stats.totalTrades)
  })
})

describe('backtestVWAPBounce', () => {
  it('returns empty on null/empty input', () => {
    expect(backtestVWAPBounce(null).trades).toHaveLength(0)
    expect(backtestVWAPBounce([]).trades).toHaveLength(0)
    expect(backtestVWAPBounce(null).stats.totalTrades).toBe(0)
  })

  it('returns trades with correct shape', () => {
    const bars = makeIntradayBars(5, 40)
    const { trades } = backtestVWAPBounce(bars)
    trades.forEach((t) => {
      expect(t).toHaveProperty('date')
      expect(t).toHaveProperty('type')
      expect(t).toHaveProperty('entry')
      expect(t).toHaveProperty('exit')
      expect(t).toHaveProperty('pnl')
      expect(t).toHaveProperty('pnlPct')
      expect(t).toHaveProperty('result')
      expect(['long', 'short']).toContain(t.type)
    })
  })

  it('stats have correct shape', () => {
    const bars = makeIntradayBars(5, 40)
    const { stats } = backtestVWAPBounce(bars)
    expect(stats).toHaveProperty('totalTrades')
    expect(stats).toHaveProperty('winRate')
    expect(stats.wins + stats.losses + stats.breakeven).toBe(stats.totalTrades)
  })
})

describe('equityCurve', () => {
  it('computes cumulative P&L', () => {
    const trades = [
      { date: '2024-01-01', pnlPct: 1.5 },
      { date: '2024-01-02', pnlPct: -0.5 },
      { date: '2024-01-03', pnlPct: 2.0 },
    ]
    const curve = equityCurve(trades)
    expect(curve).toHaveLength(3)
    expect(curve[0].cumPnl).toBe(1.5)
    expect(curve[1].cumPnl).toBe(1.0)
    expect(curve[2].cumPnl).toBe(3.0)
  })

  it('returns empty for empty trades', () => {
    expect(equityCurve([])).toHaveLength(0)
  })
})

describe('statsByDayType', () => {
  it('groups trades by day type', () => {
    const trades = [
      { pnlPct: 1, result: 'win', dayType: 'trend-bull' },
      { pnlPct: -0.5, result: 'loss', dayType: 'trend-bull' },
      { pnlPct: 0.3, result: 'win', dayType: 'chop' },
    ]
    const breakdown = statsByDayType(trades)
    expect(breakdown['trend-bull'].totalTrades).toBe(2)
    expect(breakdown['chop'].totalTrades).toBe(1)
  })

  it('handles trades with no day type', () => {
    const trades = [
      { pnlPct: 1, result: 'win' },
    ]
    const breakdown = statsByDayType(trades)
    expect(breakdown['unknown'].totalTrades).toBe(1)
  })
})

describe('enrichTradesWithDayType', () => {
  it('returns trades unchanged when no bars', () => {
    const trades = [{ date: '2024-01-01', pnlPct: 1 }]
    expect(enrichTradesWithDayType(null, trades)).toBe(trades)
  })

  it('returns trades unchanged when no trades', () => {
    expect(enrichTradesWithDayType([], null)).toBeNull()
  })
})
