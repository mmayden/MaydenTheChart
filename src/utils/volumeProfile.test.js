import { describe, it, expect } from 'vitest'
import { volumeProfile } from './volumeProfile'

// Helper — create a simple bar
function bar(time, open, high, low, close, volume) {
  return { time, open, high, low, close, volume }
}

describe('volumeProfile', () => {
  // ─── Edge cases ────────────────────────────────────────────────────────────

  it('returns empty for null/undefined/empty bars', () => {
    expect(volumeProfile(null).series).toEqual([])
    expect(volumeProfile(undefined).series).toEqual([])
    expect(volumeProfile([]).series).toEqual([])
  })

  it('returns empty for single bar (need >= 2)', () => {
    const result = volumeProfile([bar(1, 100, 105, 95, 102, 1000)])
    expect(result.series).toEqual([])
  })

  it('returns empty when all bars have same high/low', () => {
    const bars = [
      bar(1, 100, 100, 100, 100, 1000),
      bar(2, 100, 100, 100, 100, 2000),
    ]
    expect(volumeProfile(bars).series).toEqual([])
  })

  // ─── Basic structure ──────────────────────────────────────────────────────

  it('returns correct number of bins', () => {
    const bars = [
      bar(1, 100, 110, 90, 105, 1000),
      bar(2, 105, 115, 95, 110, 2000),
    ]
    const result = volumeProfile(bars, 20)
    expect(result.series).toHaveLength(20)
  })

  it('bins cover full price range', () => {
    const bars = [
      bar(1, 100, 120, 80, 110, 1000),
      bar(2, 110, 130, 90, 120, 2000),
    ]
    const result = volumeProfile(bars, 10)
    const lowest  = result.series[0].priceBottom
    const highest = result.series[result.series.length - 1].priceTop

    expect(lowest).toBeCloseTo(80, 5)
    expect(highest).toBeCloseTo(130, 5)
  })

  // ─── POC detection ────────────────────────────────────────────────────────

  it('identifies POC as the bin with highest volume', () => {
    const result = volumeProfile([
      bar(1, 100, 110, 90, 105, 1000),
      bar(2, 105, 115, 95, 110, 2000),
    ], 10)

    const pocBins = result.series.filter(b => b.isPOC)
    expect(pocBins).toHaveLength(1)

    const poc = pocBins[0]
    const maxVol = Math.max(...result.series.map(b => b.volume))
    expect(poc.volume).toBe(maxVol)
  })

  it('signal.poc equals POC bin midpoint', () => {
    const result = volumeProfile([
      bar(1, 100, 110, 90, 105, 1000),
      bar(2, 105, 115, 95, 110, 2000),
    ], 10)

    const pocBin = result.series.find(b => b.isPOC)
    expect(result.signal.poc).toBeCloseTo(pocBin.priceMid, 5)
  })

  // ─── Value Area ───────────────────────────────────────────────────────────

  it('Value Area contains ~70% of total volume', () => {
    const bars = []
    for (let i = 0; i < 100; i++) {
      // Random-ish bars spread across 50-150 range
      const base = 80 + (i % 20) * 3
      bars.push(bar(i, base, base + 5, base - 5, base + 2, 1000 + i * 10))
    }
    const result = volumeProfile(bars, 50)

    const totalVol = result.series.reduce((s, b) => s + b.volume, 0)
    const vaVol    = result.series.filter(b => b.inVA).reduce((s, b) => s + b.volume, 0)
    const vaPct    = vaVol / totalVol

    // VA should capture at least 70% (may be slightly more due to discrete bins)
    expect(vaPct).toBeGreaterThanOrEqual(0.70)
    // But shouldn't be wildly more than needed
    expect(vaPct).toBeLessThanOrEqual(1.0)
  })

  it('vaHigh > vaLow', () => {
    const result = volumeProfile([
      bar(1, 100, 120, 80, 110, 5000),
      bar(2, 110, 130, 90, 120, 3000),
    ], 20)

    expect(result.signal.vaHigh).toBeGreaterThan(result.signal.vaLow)
  })

  it('POC is within Value Area', () => {
    const result = volumeProfile([
      bar(1, 100, 120, 80, 110, 5000),
      bar(2, 110, 130, 90, 120, 3000),
    ], 20)

    expect(result.signal.poc).toBeGreaterThanOrEqual(result.signal.vaLow)
    expect(result.signal.poc).toBeLessThanOrEqual(result.signal.vaHigh)
  })

  // ─── Volume distribution ─────────────────────────────────────────────────

  it('total volume across bins equals input total', () => {
    const bars = [
      bar(1, 100, 110, 90, 105, 1000),
      bar(2, 105, 115, 95, 110, 2000),
      bar(3, 108, 112, 98, 100, 500),
    ]
    const result = volumeProfile(bars, 20)

    const inputTotal = 1000 + 2000 + 500
    const binTotal   = result.series.reduce((s, b) => s + b.volume, 0)
    expect(binTotal).toBeCloseTo(inputTotal, 0)
  })

  it('bull + bear volume equals total volume per bin', () => {
    const result = volumeProfile([
      bar(1, 100, 120, 80, 115, 5000),  // bull
      bar(2, 115, 125, 90, 95, 3000),   // bear
    ], 10)

    for (const bin of result.series) {
      expect(bin.bullVolume + bin.bearVolume).toBeCloseTo(bin.volume, 5)
    }
  })

  it('classifies bull volume correctly (close >= open)', () => {
    const result = volumeProfile([
      bar(1, 100, 110, 90, 105, 1000),  // bull
      bar(2, 100, 110, 90, 105, 1000),  // bull
    ], 10)

    const totalBull = result.series.reduce((s, b) => s + b.bullVolume, 0)
    const totalBear = result.series.reduce((s, b) => s + b.bearVolume, 0)
    expect(totalBull).toBe(2000)
    expect(totalBear).toBe(0)
  })

  it('classifies bear volume correctly (close < open)', () => {
    const result = volumeProfile([
      bar(1, 105, 110, 90, 100, 1000),  // bear
      bar(2, 108, 115, 92, 95, 2000),   // bear
    ], 10)

    const totalBull = result.series.reduce((s, b) => s + b.bullVolume, 0)
    const totalBear = result.series.reduce((s, b) => s + b.bearVolume, 0)
    expect(totalBull).toBe(0)
    expect(totalBear).toBeCloseTo(3000, 5)
  })

  // ─── Single-price bars ────────────────────────────────────────────────────

  it('handles bars with zero range (high === low)', () => {
    const result = volumeProfile([
      bar(1, 100, 110, 90, 105, 1000),
      bar(2, 100, 100, 100, 100, 500),  // zero-range bar
    ], 10)

    const totalVol = result.series.reduce((s, b) => s + b.volume, 0)
    expect(totalVol).toBeCloseTo(1500, 0)
  })

  // ─── Signal bias ──────────────────────────────────────────────────────────

  it('signal bias is bull when last close > POC', () => {
    // Concentrate volume low, close high
    const result = volumeProfile([
      bar(1, 90, 95, 85, 92, 10000),   // heavy volume at low prices
      bar(2, 92, 120, 90, 118, 100),   // close high, thin volume up top
    ], 20)

    expect(result.signal.bias).toBe('bull')
  })

  it('signal bias is bear when last close < POC', () => {
    // Concentrate volume high, close low
    const result = volumeProfile([
      bar(1, 110, 120, 105, 115, 10000),  // heavy volume at high prices
      bar(2, 115, 120, 85, 87, 100),      // close low, thin volume down
    ], 20)

    expect(result.signal.bias).toBe('bear')
  })

  // ─── Bars with zero volume ────────────────────────────────────────────────

  it('skips bars with zero volume', () => {
    const result = volumeProfile([
      bar(1, 100, 110, 90, 105, 1000),
      bar(2, 105, 115, 95, 110, 0),
    ], 10)

    const totalVol = result.series.reduce((s, b) => s + b.volume, 0)
    expect(totalVol).toBeCloseTo(1000, 0)
  })

  // ─── Custom bin count ─────────────────────────────────────────────────────

  it('respects custom numBins parameter', () => {
    const bars = [
      bar(1, 100, 120, 80, 110, 1000),
      bar(2, 110, 130, 90, 120, 2000),
    ]
    expect(volumeProfile(bars, 5).series).toHaveLength(5)
    expect(volumeProfile(bars, 100).series).toHaveLength(100)
  })

  // ─── Signal shape ────────────────────────────────────────────────────────

  it('signal has required fields per indicator contract', () => {
    const result = volumeProfile([
      bar(1, 100, 110, 90, 105, 1000),
      bar(2, 105, 115, 95, 110, 2000),
    ])

    expect(result).toHaveProperty('series')
    expect(result).toHaveProperty('signal')
    expect(result.signal).toHaveProperty('value')
    expect(result.signal).toHaveProperty('bias')
    expect(result.signal).toHaveProperty('strength')
    expect(['bull', 'bear', 'neutral']).toContain(result.signal.bias)
    expect(['strong', 'moderate', 'weak']).toContain(result.signal.strength)
  })

  it('signal includes poc, vaHigh, vaLow, totalVolume', () => {
    const result = volumeProfile([
      bar(1, 100, 110, 90, 105, 1000),
      bar(2, 105, 115, 95, 110, 2000),
    ])

    expect(typeof result.signal.poc).toBe('number')
    expect(typeof result.signal.vaHigh).toBe('number')
    expect(typeof result.signal.vaLow).toBe('number')
    expect(result.signal.totalVolume).toBe(3000)
  })
})
