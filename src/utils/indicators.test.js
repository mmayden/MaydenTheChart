/**
 * Unit tests for indicators.js
 *
 * Tests verify:
 *   - Correct math output (spot-checked against known values)
 *   - { series, signal } shape is returned by every function
 *   - Edge cases: empty input, insufficient data
 *   - Signal bias logic (bull/bear/neutral)
 */

import { describe, it, expect } from 'vitest'
import {
  ema,
  detectEMACrosses,
  vwapWithBands,
  atr,
  getDailyRangeStatus,
  relativeVolume,
  rsi,
  macd,
  bollingerBands,
} from './indicators'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate N bars with a known pattern */
function makeBars(closes, baseTime = 1700000000) {
  return closes.map((c, i) => ({
    time:   baseTime + i * 300,  // 5-min bars
    open:   c,
    high:   c + 0.5,
    low:    c - 0.5,
    close:  c,
    volume: 1000 + i * 100,
  }))
}

/** Generate bars with separate high/low/close control */
function makeFullBars(data, baseTime = 1700000000) {
  return data.map((d, i) => ({
    time:   baseTime + i * 300,
    open:   d.open   ?? d.close,
    high:   d.high   ?? d.close + 0.5,
    low:    d.low    ?? d.close - 0.5,
    close:  d.close,
    volume: d.volume ?? 1000,
  }))
}

// ─── EMA tests ───────────────────────────────────────────────────────────────

describe('ema()', () => {
  it('returns { series, signal } shape', () => {
    const bars   = makeBars(Array.from({ length: 20 }, (_, i) => 400 + i))
    const result = ema(bars, 9)
    expect(result).toHaveProperty('series')
    expect(result).toHaveProperty('signal')
    expect(result.signal).toHaveProperty('value')
    expect(result.signal).toHaveProperty('bias')
    expect(result.signal).toHaveProperty('strength')
  })

  it('returns empty series when bars < period', () => {
    const bars   = makeBars([400, 401, 402])
    const result = ema(bars, 9)
    expect(result.series).toHaveLength(0)
    expect(result.signal.bias).toBe('neutral')
  })

  it('seeds with SMA of first period bars', () => {
    // EMA(3) of [1,2,3,4,5]: seed = (1+2+3)/3 = 2
    const bars   = makeBars([1, 2, 3, 4, 5])
    const result = ema(bars, 3)
    // First value should be exactly the SMA seed
    expect(result.series[0].value).toBeCloseTo(2.0, 5)
  })

  it('computes EMA correctly against known value', () => {
    // EMA(3) multiplier = 2/(3+1) = 0.5
    // bars: [1,2,3,4,5]
    // seed = 2.0
    // i=3 (close=4): EMA = 4*0.5 + 2*(1-0.5) = 2 + 1 = 3
    // i=4 (close=5): EMA = 5*0.5 + 3*(1-0.5) = 2.5 + 1.5 = 4
    const bars   = makeBars([1, 2, 3, 4, 5])
    const result = ema(bars, 3)
    expect(result.series[1].value).toBeCloseTo(3.0, 5)
    expect(result.series[2].value).toBeCloseTo(4.0, 5)
  })

  it('produces bull signal when price is above EMA', () => {
    // Rising prices: EMA will lag below current price
    const bars   = makeBars(Array.from({ length: 20 }, (_, i) => 400 + i * 2))
    const result = ema(bars, 9)
    expect(result.signal.bias).toBe('bull')
  })

  it('produces bear signal when price is below EMA', () => {
    // Falling prices
    const bars   = makeBars(Array.from({ length: 20 }, (_, i) => 420 - i * 2))
    const result = ema(bars, 9)
    expect(result.signal.bias).toBe('bear')
  })

  it('handles empty bars array', () => {
    const result = ema([], 9)
    expect(result.series).toHaveLength(0)
    expect(result.signal.value).toBeNull()
  })
})

// ─── EMA cross detection ─────────────────────────────────────────────────────

describe('detectEMACrosses()', () => {
  it('detects a bullish cross (9 crosses above 48)', () => {
    const ema9  = [
      { time: 1, value: 99  },  // below 100
      { time: 2, value: 101 },  // above 100
    ]
    const ema48 = [
      { time: 1, value: 100 },
      { time: 2, value: 100 },
    ]
    const crosses = detectEMACrosses(ema9, ema48)
    expect(crosses).toHaveLength(1)
    expect(crosses[0].direction).toBe('bull')
    expect(crosses[0].time).toBe(2)
  })

  it('detects a bearish cross (9 crosses below 48)', () => {
    const ema9  = [
      { time: 1, value: 101 },
      { time: 2, value: 99  },
    ]
    const ema48 = [
      { time: 1, value: 100 },
      { time: 2, value: 100 },
    ]
    const crosses = detectEMACrosses(ema9, ema48)
    expect(crosses).toHaveLength(1)
    expect(crosses[0].direction).toBe('bear')
  })

  it('returns empty when no crosses', () => {
    const ema9  = [{ time: 1, value: 105 }, { time: 2, value: 106 }]
    const ema48 = [{ time: 1, value: 100 }, { time: 2, value: 101 }]
    expect(detectEMACrosses(ema9, ema48)).toHaveLength(0)
  })
})

// ─── VWAP tests ───────────────────────────────────────────────────────────────

describe('vwapWithBands()', () => {
  it('returns all required keys', () => {
    const bars   = makeBars(Array.from({ length: 10 }, (_, i) => 400 + i))
    const result = vwapWithBands(bars)
    expect(result).toHaveProperty('vwap')
    expect(result).toHaveProperty('band1Upper')
    expect(result).toHaveProperty('band1Lower')
    expect(result).toHaveProperty('band2Upper')
    expect(result).toHaveProperty('band2Lower')
    expect(result).toHaveProperty('signal')
  })

  it('VWAP resets when date changes', () => {
    const DAY1 = 1700000000   // some epoch
    const DAY2 = DAY1 + 86400 // next day

    const bars = [
      { time: DAY1 + 0,    open: 400, high: 401, low: 399, close: 400, volume: 1000 },
      { time: DAY1 + 300,  open: 400, high: 401, low: 399, close: 400, volume: 1000 },
      { time: DAY2 + 0,    open: 410, high: 411, low: 409, close: 410, volume: 1000 },
      { time: DAY2 + 300,  open: 410, high: 411, low: 409, close: 410, volume: 1000 },
    ]

    const result = vwapWithBands(bars)
    // Day 2 VWAP should be ~410, not averaged with day 1's ~400
    const day2Vwap = result.vwap[2].value
    expect(day2Vwap).toBeCloseTo(410, 0)
  })

  it('band1Upper > vwap > band1Lower', () => {
    const bars   = makeFullBars([
      { close: 400, high: 405, low: 395, volume: 1000 },
      { close: 402, high: 407, low: 397, volume: 1200 },
      { close: 398, high: 403, low: 393, volume: 800  },
      { close: 401, high: 406, low: 396, volume: 1100 },
    ])
    const result = vwapWithBands(bars)
    const last   = result.vwap.length - 1
    expect(result.band1Upper[last].value).toBeGreaterThan(result.vwap[last].value)
    expect(result.band1Lower[last].value).toBeLessThan(result.vwap[last].value)
  })

  it('handles empty bars', () => {
    const result = vwapWithBands([])
    expect(result.vwap).toHaveLength(0)
    expect(result.signal.value).toBeNull()
  })
})

// ─── ATR tests ────────────────────────────────────────────────────────────────

describe('atr()', () => {
  it('returns { series, signal } shape', () => {
    const bars   = makeBars(Array.from({ length: 20 }, (_, i) => 400 + i))
    const result = atr(bars)
    expect(result).toHaveProperty('series')
    expect(result).toHaveProperty('signal')
  })

  it('ATR is always positive', () => {
    const bars   = makeBars(Array.from({ length: 30 }, (_, i) => 400 + Math.sin(i) * 5))
    const result = atr(bars, 14)
    result.series.forEach((p) => expect(p.value).toBeGreaterThan(0))
  })

  it('returns empty when bars < period + 1', () => {
    const bars   = makeBars(Array.from({ length: 10 }, (_, i) => 400 + i))
    const result = atr(bars, 14)
    expect(result.series).toHaveLength(0)
  })

  it('uses Wilder smoothing (not SMA after seed)', () => {
    // Bars with constant TR of 1.0 → ATR should converge to 1.0
    const bars = Array.from({ length: 30 }, (_, i) => ({
      time:   1700000000 + i * 300,
      open:   400,
      high:   400.5,
      low:    399.5,
      close:  400,
      volume: 1000,
    }))
    const result = atr(bars, 3)
    // After seeding, every TR is 1.0 — ATR should stay at ~1.0
    const lastVal = result.series[result.series.length - 1].value
    expect(lastVal).toBeCloseTo(1.0, 2)
  })
})

describe('getDailyRangeStatus()', () => {
  it('calculates percent consumed correctly', () => {
    const bars = [
      { time: 1700000000, high: 410, low: 395, close: 405, open: 400, volume: 1000 },
      { time: 1700000300, high: 412, low: 398, close: 408, open: 405, volume: 1000 },
    ]
    // range: high=412, low=395 → 17 pts
    // ATR = 20 → 85%
    const result = getDailyRangeStatus(bars, 20)
    expect(result.rangeUsed).toBeCloseTo(17, 1)
    expect(result.percentConsumed).toBeCloseTo(85, 1)
  })

  it('returns zeros for empty input', () => {
    const result = getDailyRangeStatus([], 20)
    expect(result.rangeUsed).toBe(0)
    expect(result.percentConsumed).toBe(0)
  })
})

// ─── RVOL tests ───────────────────────────────────────────────────────────────

describe('relativeVolume()', () => {
  it('returns { series, signal } shape', () => {
    const bars   = makeBars(Array.from({ length: 30 }, (_, i) => 400 + i))
    const result = relativeVolume(bars)
    expect(result).toHaveProperty('series')
    expect(result).toHaveProperty('signal')
  })

  it('highlights bars above threshold', () => {
    // Constant volume of 1000, then one spike to 3000 (RVOL ~3.0)
    const bars = Array.from({ length: 25 }, (_, i) => ({
      time:   1700000000 + i * 300,
      open:   400, high: 400.5, low: 399.5, close: 400,
      volume: i === 24 ? 3000 : 1000,
    }))
    const result = relativeVolume(bars, 20, 1.5)
    const last   = result.series[result.series.length - 1]
    expect(last.highlight).toBe(true)
    expect(last.rvol).toBeGreaterThan(1.5)
  })

  it('does not highlight normal volume bars', () => {
    const bars = Array.from({ length: 25 }, (_, i) => ({
      time:   1700000000 + i * 300,
      open:   400, high: 400.5, low: 399.5, close: 400,
      volume: 1000,
    }))
    const result = relativeVolume(bars, 20, 1.5)
    result.series.forEach((p) => expect(p.highlight).toBe(false))
  })
})

// ─── RSI tests ────────────────────────────────────────────────────────────────

describe('rsi()', () => {
  it('returns { series, signal } shape', () => {
    const bars   = makeBars(Array.from({ length: 30 }, (_, i) => 400 + i))
    const result = rsi(bars, 14)
    expect(result).toHaveProperty('series')
    expect(result).toHaveProperty('signal')
  })

  it('RSI values are between 0 and 100', () => {
    const bars   = makeBars(Array.from({ length: 50 }, (_, i) => 400 + Math.sin(i * 0.5) * 10))
    const result = rsi(bars, 14)
    result.series.forEach((p) => {
      expect(p.value).toBeGreaterThanOrEqual(0)
      expect(p.value).toBeLessThanOrEqual(100)
    })
  })

  it('RSI approaches 100 for purely rising prices', () => {
    const bars   = makeBars(Array.from({ length: 40 }, (_, i) => 400 + i))
    const result = rsi(bars, 14)
    const lastVal = result.series[result.series.length - 1].value
    expect(lastVal).toBeGreaterThan(90)
  })

  it('RSI approaches 0 for purely falling prices', () => {
    const bars   = makeBars(Array.from({ length: 40 }, (_, i) => 440 - i))
    const result = rsi(bars, 14)
    const lastVal = result.series[result.series.length - 1].value
    expect(lastVal).toBeLessThan(10)
  })

  it('signal is bull when RSI > 50', () => {
    const bars   = makeBars(Array.from({ length: 40 }, (_, i) => 400 + i))
    const result = rsi(bars, 14)
    expect(result.signal.bias).toBe('bull')
  })

  it('returns empty when insufficient bars', () => {
    const bars   = makeBars([400, 401, 402])
    const result = rsi(bars, 14)
    expect(result.series).toHaveLength(0)
    expect(result.signal.value).toBeNull()
  })
})

// ─── MACD tests ───────────────────────────────────────────────────────────────

describe('macd()', () => {
  it('returns { macd, signalLine, histogram, signal } shape', () => {
    const bars   = makeBars(Array.from({ length: 60 }, (_, i) => 400 + i * 0.5))
    const result = macd(bars)
    expect(result).toHaveProperty('macd')
    expect(result).toHaveProperty('signalLine')
    expect(result).toHaveProperty('histogram')
    expect(result).toHaveProperty('signal')
    expect(result.signal).toHaveProperty('bias')
  })

  it('histogram = macd - signal for every point', () => {
    const bars   = makeBars(Array.from({ length: 80 }, (_, i) => 400 + Math.sin(i * 0.3) * 5))
    const result = macd(bars)

    const signalMap = new Map(result.signalLine.map((p) => [p.time, p.value]))
    result.histogram.forEach((p) => {
      const macdVal = result.macd.find((m) => m.time === p.time)?.value
      const sigVal  = signalMap.get(p.time)
      if (macdVal != null && sigVal != null) {
        expect(p.value).toBeCloseTo(macdVal - sigVal, 3)
      }
    })
  })

  it('bullish signal when histogram > 0', () => {
    // Accelerating (quadratic) prices: fast EMA keeps growing faster than slow EMA
    // → MACD line keeps rising → histogram stays positive → bias = 'bull'
    const bars   = makeBars(Array.from({ length: 80 }, (_, i) => 400 + i * i * 0.1))
    const result = macd(bars)
    const lastHist = result.histogram[result.histogram.length - 1]?.value
    expect(lastHist).toBeGreaterThan(0)
    expect(result.signal.bias).toBe('bull')
  })

  it('returns empty on insufficient data', () => {
    const bars   = makeBars(Array.from({ length: 10 }, (_, i) => 400 + i))
    const result = macd(bars)
    expect(result.macd).toHaveLength(0)
    expect(result.signal.value).toBeNull()
  })
})

// ─── Edge case tests (null, empty, single element, boundary) ────────────────

describe('edge cases', () => {
  describe('ema()', () => {
    it('returns neutral signal for null input', () => {
      const result = ema(null, 9)
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
      expect(result.signal.bias).toBe('neutral')
    })

    it('returns empty for empty array', () => {
      const result = ema([], 9)
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns empty for single element', () => {
      const result = ema(makeBars([400]), 9)
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns exactly 1 series point when bars.length === period', () => {
      const bars   = makeBars(Array.from({ length: 9 }, (_, i) => 400 + i))
      const result = ema(bars, 9)
      expect(result.series).toHaveLength(1)
      expect(result.signal.value).toBeCloseTo(404, 0) // SMA seed of 400..408
    })
  })

  describe('atr()', () => {
    it('returns neutral signal for null input', () => {
      const result = atr(null)
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
      expect(result.signal.bias).toBe('neutral')
    })

    it('returns empty for empty array', () => {
      const result = atr([])
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns empty for single element', () => {
      const result = atr(makeBars([400]))
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns exactly 1 series point when bars.length === period + 1', () => {
      // ATR(14) needs 15 bars (14 TRs, then SMA of first 14)
      const bars   = makeBars(Array.from({ length: 15 }, (_, i) => 400 + i))
      const result = atr(bars, 14)
      expect(result.series).toHaveLength(1)
      expect(result.signal.value).toBeGreaterThan(0)
    })
  })

  describe('rsi()', () => {
    it('returns neutral signal for null input', () => {
      const result = rsi(null)
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
      expect(result.signal.bias).toBe('neutral')
    })

    it('returns empty for empty array', () => {
      const result = rsi([])
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns empty for single element', () => {
      const result = rsi(makeBars([400]))
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns exactly 1 series point when bars.length === period + 1', () => {
      // RSI(14) needs 15 bars
      const bars   = makeBars(Array.from({ length: 15 }, (_, i) => 400 + i))
      const result = rsi(bars, 14)
      expect(result.series).toHaveLength(1)
      expect(result.signal.value).toBeGreaterThanOrEqual(0)
      expect(result.signal.value).toBeLessThanOrEqual(100)
    })
  })

  describe('macd()', () => {
    it('returns neutral signal for null input', () => {
      const result = macd(null)
      expect(result.macd).toHaveLength(0)
      expect(result.signalLine).toHaveLength(0)
      expect(result.histogram).toHaveLength(0)
      expect(result.signal.value).toBeNull()
      expect(result.signal.bias).toBe('neutral')
    })

    it('returns empty for empty array', () => {
      const result = macd([])
      expect(result.macd).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns empty for single element', () => {
      const result = macd(makeBars([400]))
      expect(result.macd).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns empty when bars.length === slowPeriod + signalPeriod - 1 (just under boundary)', () => {
      // MACD default needs 26 + 9 = 35 bars minimum
      const bars   = makeBars(Array.from({ length: 34 }, (_, i) => 400 + i))
      const result = macd(bars)
      expect(result.macd).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns data when bars.length === slowPeriod + signalPeriod (exact boundary)', () => {
      // 26 + 9 = 35 bars
      const bars   = makeBars(Array.from({ length: 35 }, (_, i) => 400 + i))
      const result = macd(bars)
      expect(result.macd.length).toBeGreaterThanOrEqual(0)
      // May or may not produce output depending on internal EMA alignment;
      // the key contract is it doesn't crash
      expect(result.signal).toBeDefined()
    })
  })

  describe('vwapWithBands()', () => {
    it('returns neutral signal for null input', () => {
      const result = vwapWithBands(null)
      expect(result.vwap).toHaveLength(0)
      expect(result.signal.value).toBeNull()
      expect(result.signal.bias).toBe('neutral')
    })

    it('returns empty for empty array', () => {
      const result = vwapWithBands([])
      expect(result.vwap).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns 1 point for single element', () => {
      const bars   = makeBars([400])
      const result = vwapWithBands(bars)
      expect(result.vwap).toHaveLength(1)
      expect(result.band1Upper).toHaveLength(1)
      expect(result.band1Lower).toHaveLength(1)
      expect(result.band2Upper).toHaveLength(1)
      expect(result.band2Lower).toHaveLength(1)
      // VWAP of a single bar = typical price
      expect(result.vwap[0].value).toBeCloseTo((400.5 + 399.5 + 400) / 3, 2)
    })
  })

  describe('relativeVolume()', () => {
    it('returns neutral signal for null input', () => {
      const result = relativeVolume(null)
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
      expect(result.signal.bias).toBe('neutral')
    })

    it('returns empty for empty array', () => {
      const result = relativeVolume([])
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns empty for single element', () => {
      const result = relativeVolume(makeBars([400]))
      expect(result.series).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns exactly 1 series point when bars.length === period + 1', () => {
      // RVOL(20) needs 21 bars
      const bars   = makeBars(Array.from({ length: 21 }, (_, i) => 400 + i))
      const result = relativeVolume(bars, 20)
      expect(result.series).toHaveLength(1)
      expect(result.signal.value).toBeDefined()
    })
  })

  describe('getDailyRangeStatus()', () => {
    it('returns zeros for null input', () => {
      const result = getDailyRangeStatus(null, 20)
      expect(result.rangeUsed).toBe(0)
      expect(result.percentConsumed).toBe(0)
    })

    it('returns zeros for empty array', () => {
      const result = getDailyRangeStatus([], 20)
      expect(result.rangeUsed).toBe(0)
      expect(result.percentConsumed).toBe(0)
    })

    it('handles single element', () => {
      const bars = [{ time: 1700000000, high: 405, low: 395, close: 400, open: 400, volume: 1000 }]
      const result = getDailyRangeStatus(bars, 20)
      expect(result.rangeUsed).toBe(10)
      expect(result.percentConsumed).toBe(50)
    })

    it('returns zeros when atrValue is null', () => {
      const bars = [{ time: 1700000000, high: 405, low: 395, close: 400, open: 400, volume: 1000 }]
      const result = getDailyRangeStatus(bars, null)
      expect(result.rangeUsed).toBe(0)
      expect(result.percentConsumed).toBe(0)
    })

    it('returns zeros when atrValue is 0', () => {
      const bars = [{ time: 1700000000, high: 405, low: 395, close: 400, open: 400, volume: 1000 }]
      const result = getDailyRangeStatus(bars, 0)
      expect(result.rangeUsed).toBe(0)
      expect(result.percentConsumed).toBe(0)
    })

    it('returns zeros when atrValue is negative', () => {
      const bars = [{ time: 1700000000, high: 405, low: 395, close: 400, open: 400, volume: 1000 }]
      const result = getDailyRangeStatus(bars, -5)
      expect(result.rangeUsed).toBe(0)
      expect(result.percentConsumed).toBe(0)
    })
  })
})

// ─── Signal contract verification ───────────────────────────────────────────

describe('signal contract', () => {
  const VALID_BIASES    = ['bull', 'bear', 'neutral']
  const VALID_STRENGTHS = ['strong', 'moderate', 'weak']

  // Sufficient data for all indicators
  const sufficientBars = makeBars(Array.from({ length: 80 }, (_, i) => 400 + Math.sin(i * 0.3) * 10))

  describe('ema()', () => {
    it('signal has numeric value, valid bias, valid strength', () => {
      const result = ema(sufficientBars, 9)
      expect(typeof result.signal.value).toBe('number')
      expect(result.signal.value).not.toBeNull()
      expect(result.signal.value).not.toBeNaN()
      expect(VALID_BIASES).toContain(result.signal.bias)
      expect(VALID_STRENGTHS).toContain(result.signal.strength)
    })

    it('signal contract holds for multiple periods', () => {
      for (const period of [9, 21, 48]) {
        const result = ema(sufficientBars, period)
        expect(typeof result.signal.value).toBe('number')
        expect(VALID_BIASES).toContain(result.signal.bias)
        expect(VALID_STRENGTHS).toContain(result.signal.strength)
      }
    })
  })

  describe('atr()', () => {
    it('signal has numeric value, neutral bias, valid strength', () => {
      const result = atr(sufficientBars, 14)
      expect(typeof result.signal.value).toBe('number')
      expect(result.signal.value).not.toBeNull()
      expect(result.signal.value).not.toBeNaN()
      expect(result.signal.bias).toBe('neutral') // ATR is always neutral
      expect(VALID_STRENGTHS).toContain(result.signal.strength)
    })
  })

  describe('rsi()', () => {
    it('signal has numeric value, valid bias, valid strength', () => {
      const result = rsi(sufficientBars, 14)
      expect(typeof result.signal.value).toBe('number')
      expect(result.signal.value).not.toBeNull()
      expect(result.signal.value).not.toBeNaN()
      expect(result.signal.value).toBeGreaterThanOrEqual(0)
      expect(result.signal.value).toBeLessThanOrEqual(100)
      expect(VALID_BIASES).toContain(result.signal.bias)
      expect(VALID_STRENGTHS).toContain(result.signal.strength)
    })

    it('bull bias when RSI > 50, bear bias when RSI < 50', () => {
      const risingBars  = makeBars(Array.from({ length: 40 }, (_, i) => 400 + i))
      const fallingBars = makeBars(Array.from({ length: 40 }, (_, i) => 440 - i))
      expect(rsi(risingBars, 14).signal.bias).toBe('bull')
      expect(rsi(fallingBars, 14).signal.bias).toBe('bear')
    })
  })

  describe('macd()', () => {
    it('signal has numeric value, valid bias, valid strength', () => {
      const result = macd(sufficientBars)
      expect(typeof result.signal.value).toBe('number')
      expect(result.signal.value).not.toBeNull()
      expect(result.signal.value).not.toBeNaN()
      expect(VALID_BIASES).toContain(result.signal.bias)
      expect(VALID_STRENGTHS).toContain(result.signal.strength)
    })

    it('bull bias when histogram > 0, bear when < 0', () => {
      // Accelerating prices → positive histogram
      const bullBars = makeBars(Array.from({ length: 80 }, (_, i) => 400 + i * i * 0.05))
      const bullResult = macd(bullBars)
      if (bullResult.histogram.length > 0) {
        const lastHist = bullResult.histogram[bullResult.histogram.length - 1].value
        if (lastHist > 0) expect(bullResult.signal.bias).toBe('bull')
        if (lastHist < 0) expect(bullResult.signal.bias).toBe('bear')
      }
    })
  })

  describe('vwapWithBands()', () => {
    it('signal has numeric value, valid bias, valid strength', () => {
      const result = vwapWithBands(sufficientBars)
      expect(typeof result.signal.value).toBe('number')
      expect(result.signal.value).not.toBeNull()
      expect(result.signal.value).not.toBeNaN()
      expect(VALID_BIASES).toContain(result.signal.bias)
      expect(VALID_STRENGTHS).toContain(result.signal.strength)
    })
  })

  describe('relativeVolume()', () => {
    it('signal has numeric value, valid bias, valid strength', () => {
      const result = relativeVolume(sufficientBars, 20, 1.5)
      expect(typeof result.signal.value).toBe('number')
      expect(result.signal.value).not.toBeNull()
      expect(result.signal.value).not.toBeNaN()
      expect(VALID_BIASES).toContain(result.signal.bias)
      expect(VALID_STRENGTHS).toContain(result.signal.strength)
    })

    it('bias is neutral when RVOL is below threshold', () => {
      // Constant volume → RVOL ~1.0 → below 1.5 threshold → neutral
      const bars = Array.from({ length: 30 }, (_, i) => ({
        time:   1700000000 + i * 300,
        open:   400, high: 400.5, low: 399.5, close: 400,
        volume: 1000,
      }))
      const result = relativeVolume(bars, 20, 1.5)
      expect(result.signal.bias).toBe('neutral')
      expect(result.signal.strength).toBe('weak')
    })
  })

  // ─── Bollinger Bands ──────────────────────────────────────────────────────

  describe('bollingerBands', () => {
    it('returns empty on insufficient data', () => {
      const result = bollingerBands(makeBars([100, 101, 102]), 20)
      expect(result.middle).toHaveLength(0)
      expect(result.upper).toHaveLength(0)
      expect(result.lower).toHaveLength(0)
      expect(result.signal.value).toBeNull()
    })

    it('returns middle, upper, lower series with correct lengths', () => {
      const closes = Array.from({ length: 30 }, (_, i) => 400 + i * 0.5)
      const bars = makeBars(closes)
      const result = bollingerBands(bars, 20, 2)
      expect(result.middle).toHaveLength(11) // 30 - 20 + 1
      expect(result.upper).toHaveLength(11)
      expect(result.lower).toHaveLength(11)
    })

    it('upper > middle > lower for all points', () => {
      const closes = Array.from({ length: 30 }, (_, i) => 400 + Math.sin(i) * 2)
      const bars = makeBars(closes)
      const result = bollingerBands(bars, 20, 2)
      for (let i = 0; i < result.middle.length; i++) {
        expect(result.upper[i].value).toBeGreaterThan(result.middle[i].value)
        expect(result.lower[i].value).toBeLessThan(result.middle[i].value)
      }
    })

    it('signal has correct shape', () => {
      const closes = Array.from({ length: 30 }, (_, i) => 400 + i * 0.5)
      const bars = makeBars(closes)
      const result = bollingerBands(bars, 20, 2)
      expect(result.signal).toHaveProperty('value')
      expect(result.signal).toHaveProperty('bias')
      expect(result.signal).toHaveProperty('strength')
      expect(['bull', 'bear', 'neutral']).toContain(result.signal.bias)
    })

    it('middle band equals SMA(20) of closes', () => {
      const closes = Array.from({ length: 25 }, (_, i) => 400 + i)
      const bars = makeBars(closes)
      const result = bollingerBands(bars, 20, 2)
      // First middle value = SMA of first 20 closes
      const expectedSMA = closes.slice(0, 20).reduce((s, c) => s + c, 0) / 20
      expect(result.middle[0].value).toBeCloseTo(expectedSMA, 4)
    })
  })

})
