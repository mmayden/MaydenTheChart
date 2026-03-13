/**
 * Unit tests for supportResistance.js
 */

import { describe, it, expect } from 'vitest'
import {
  detectSwingPoints,
  clusterPivots,
  findSupportResistance,
} from './supportResistance'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate bars with a price pattern for swing detection */
function makeBars(prices, baseTime = 1700000000) {
  return prices.map((p, i) => ({
    time:   baseTime + i * 300,
    open:   p,
    high:   p + 0.5,
    low:    p - 0.5,
    close:  p,
    volume: 1000,
  }))
}

/**
 * Create a V-shaped pattern: descending then ascending.
 * The middle bar is the swing low.
 */
function makeVPattern(n, basePrice = 500) {
  const mid = Math.floor(n / 2)
  const prices = []
  for (let i = 0; i < n; i++) {
    prices.push(basePrice + Math.abs(i - mid) * 2)
  }
  return prices
}

/**
 * Create an inverted-V pattern: ascending then descending.
 * The middle bar is the swing high.
 */
function makeInvertedV(n, basePrice = 500) {
  const mid = Math.floor(n / 2)
  const prices = []
  for (let i = 0; i < n; i++) {
    prices.push(basePrice - Math.abs(i - mid) * 2)
  }
  return prices
}

// ─── detectSwingPoints ──────────────────────────────────────────────────────

describe('detectSwingPoints', () => {
  it('returns empty arrays for insufficient data', () => {
    const result = detectSwingPoints([], 10)
    expect(result.swingHighs).toEqual([])
    expect(result.swingLows).toEqual([])
  })

  it('returns empty arrays for null input', () => {
    const result = detectSwingPoints(null, 10)
    expect(result.swingHighs).toEqual([])
    expect(result.swingLows).toEqual([])
  })

  it('detects a swing low in a V-pattern', () => {
    const prices = makeVPattern(25, 500) // lookback 10 needs 21+ bars
    const bars = makeBars(prices)
    const { swingLows } = detectSwingPoints(bars, 10)
    expect(swingLows.length).toBeGreaterThanOrEqual(1)
    // The swing low should be near the lowest price
    const lowestPrice = Math.min(...prices)
    expect(swingLows.some((s) => Math.abs(s.price - (lowestPrice - 0.5)) < 1)).toBe(true)
  })

  it('detects a swing high in an inverted-V pattern', () => {
    const prices = makeInvertedV(25, 520)
    const bars = makeBars(prices)
    const { swingHighs } = detectSwingPoints(bars, 10)
    expect(swingHighs.length).toBeGreaterThanOrEqual(1)
    // The swing high should be near the highest price
    const highestPrice = Math.max(...prices)
    expect(swingHighs.some((s) => Math.abs(s.price - (highestPrice + 0.5)) < 1)).toBe(true)
  })

  it('respects lookback window size', () => {
    const prices = makeVPattern(11, 500) // lookback=3, need 7+ bars
    const bars = makeBars(prices)
    const { swingLows } = detectSwingPoints(bars, 3)
    expect(swingLows.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── clusterPivots ──────────────────────────────────────────────────────────

describe('clusterPivots', () => {
  it('returns empty for empty input', () => {
    expect(clusterPivots([])).toEqual([])
    expect(clusterPivots(null)).toEqual([])
  })

  it('clusters nearby pivots', () => {
    const pivots = [
      { time: 1, price: 500.00 },
      { time: 2, price: 500.05 },  // within 0.1% of 500
      { time: 3, price: 500.10 },  // within 0.1% of 500
      { time: 4, price: 510.00 },  // far away — separate cluster
    ]
    const clusters = clusterPivots(pivots, 0.001)
    expect(clusters.length).toBe(2)
    // First cluster should have strength 3
    expect(clusters[0].strength).toBe(3)
    expect(clusters[0].price).toBeCloseTo(500.05, 1)
    // Second cluster
    expect(clusters[1].strength).toBe(1)
    expect(clusters[1].price).toBeCloseTo(510, 0)
  })

  it('keeps distant pivots separate', () => {
    const pivots = [
      { time: 1, price: 490 },
      { time: 2, price: 500 },
      { time: 3, price: 510 },
    ]
    const clusters = clusterPivots(pivots, 0.001)
    expect(clusters.length).toBe(3)
    expect(clusters.every((c) => c.strength === 1)).toBe(true)
  })

  it('single pivot returns one cluster', () => {
    const clusters = clusterPivots([{ time: 1, price: 500 }])
    expect(clusters.length).toBe(1)
    expect(clusters[0].strength).toBe(1)
  })
})

// ─── findSupportResistance ──────────────────────────────────────────────────

describe('findSupportResistance', () => {
  it('returns empty for insufficient data', () => {
    const result = findSupportResistance([])
    expect(result.support).toEqual([])
    expect(result.resistance).toEqual([])
    expect(result.swingHighs).toEqual([])
    expect(result.swingLows).toEqual([])
  })

  it('returns support and resistance arrays', () => {
    // Create a clear oscillating pattern with lookback=3 so peaks/valleys are distinct
    // Pattern: V ^ V ^ V with amplitude large enough to dominate the ±0.5 spread
    const prices = []
    for (let i = 0; i < 40; i++) {
      const cycle = Math.sin((i / 40) * Math.PI * 6) * 5
      prices.push(500 + cycle)
    }
    const bars = makeBars(prices)
    const result = findSupportResistance(bars, 3, 0.005)
    // Should have detected some structure
    expect(result.swingHighs.length).toBeGreaterThan(0)
    expect(result.swingLows.length).toBeGreaterThan(0)
  })

  it('returns correct shape', () => {
    const prices = makeVPattern(25, 500)
    const bars = makeBars(prices)
    const result = findSupportResistance(bars, 5, 0.002)

    // Check shape of support/resistance entries
    for (const level of [...result.support, ...result.resistance]) {
      expect(level).toHaveProperty('price')
      expect(level).toHaveProperty('strength')
      expect(typeof level.price).toBe('number')
      expect(typeof level.strength).toBe('number')
    }

    // Check swing point shape
    for (const point of [...result.swingHighs, ...result.swingLows]) {
      expect(point).toHaveProperty('time')
      expect(point).toHaveProperty('price')
    }
  })
})
