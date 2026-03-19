import { describe, it, expect } from 'vitest'
import { detectWeeklyGaps, checkGapFills } from './gaps'

// Helper: make a bar at a given unix time
const bar = (time, open, high, low, close) => ({ time, open, high, low, close, volume: 1000 })

describe('detectWeeklyGaps', () => {
  it('returns empty for null/undefined input', () => {
    expect(detectWeeklyGaps(null)).toEqual([])
    expect(detectWeeklyGaps(undefined)).toEqual([])
    expect(detectWeeklyGaps([])).toEqual([])
  })

  it('returns empty for single bar', () => {
    expect(detectWeeklyGaps([bar(100, 440, 445, 435, 442)])).toEqual([])
  })

  it('returns empty when bars overlap (no gap)', () => {
    const bars = [
      bar(100, 440, 445, 435, 442),
      bar(200, 443, 448, 440, 446),  // low (440) <= prev high (445)
    ]
    expect(detectWeeklyGaps(bars)).toEqual([])
  })

  it('detects gap up', () => {
    const bars = [
      bar(100, 440, 445, 435, 442),
      bar(200, 450, 455, 448, 453),  // low (448) > prev high (445)
    ]
    const gaps = detectWeeklyGaps(bars)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toEqual({
      top: 448,
      bottom: 445,
      time: 200,
      direction: 'up',
      gapSize: 3,
    })
  })

  it('detects gap down', () => {
    const bars = [
      bar(100, 450, 455, 445, 448),
      bar(200, 440, 442, 435, 438),  // high (442) < prev low (445)
    ]
    const gaps = detectWeeklyGaps(bars)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toEqual({
      top: 445,
      bottom: 442,
      time: 200,
      direction: 'down',
      gapSize: 3,
    })
  })

  it('detects multiple gaps', () => {
    const bars = [
      bar(100, 440, 445, 435, 442),
      bar(200, 450, 455, 448, 453),  // gap up
      bar(300, 460, 465, 458, 462),  // gap up
    ]
    const gaps = detectWeeklyGaps(bars)
    expect(gaps).toHaveLength(2)
    expect(gaps[0].direction).toBe('up')
    expect(gaps[1].direction).toBe('up')
  })

  it('handles mixed gap up and gap down', () => {
    const bars = [
      bar(100, 440, 445, 435, 442),
      bar(200, 450, 455, 448, 453),  // gap up
      bar(300, 440, 442, 430, 435),  // gap down (high 442 < prev low 448)
    ]
    const gaps = detectWeeklyGaps(bars)
    expect(gaps).toHaveLength(2)
    expect(gaps[0].direction).toBe('up')
    expect(gaps[1].direction).toBe('down')
  })
})

describe('checkGapFills', () => {
  it('returns gaps with filled=false when no bars provided', () => {
    const gaps = [{ top: 448, bottom: 445, time: 200, direction: 'up', gapSize: 3 }]
    const result = checkGapFills(gaps, [])
    expect(result).toHaveLength(1)
    expect(result[0].filled).toBe(false)
    expect(result[0].fillPct).toBe(0)
  })

  it('marks gap up as filled when price drops through entire gap', () => {
    const gaps = [{ top: 448, bottom: 445, time: 200, direction: 'up', gapSize: 3 }]
    const bars = [
      bar(250, 450, 452, 444, 446),  // low (444) < bottom (445) → full fill
    ]
    const result = checkGapFills(gaps, bars)
    expect(result[0].filled).toBe(true)
    expect(result[0].fillPct).toBe(1)
    expect(result[0].fillTime).toBe(250)
  })

  it('marks gap down as filled when price rises through entire gap', () => {
    const gaps = [{ top: 445, bottom: 442, time: 200, direction: 'down', gapSize: 3 }]
    const bars = [
      bar(250, 440, 446, 438, 444),  // high (446) > top (445) → full fill
    ]
    const result = checkGapFills(gaps, bars)
    expect(result[0].filled).toBe(true)
    expect(result[0].fillPct).toBe(1)
  })

  it('calculates partial fill percentage for gap up', () => {
    const gaps = [{ top: 450, bottom: 445, time: 200, direction: 'up', gapSize: 5 }]
    const bars = [
      bar(250, 452, 453, 447, 451),  // enters gap from top: penetrates 3/5 = 0.6
    ]
    const result = checkGapFills(gaps, bars)
    expect(result[0].filled).toBe(false)
    expect(result[0].fillPct).toBe(0.6)
  })

  it('calculates partial fill percentage for gap down', () => {
    const gaps = [{ top: 450, bottom: 445, time: 200, direction: 'down', gapSize: 5 }]
    const bars = [
      bar(250, 443, 448, 442, 446),  // enters gap from bottom: penetrates 3/5 = 0.6
    ]
    const result = checkGapFills(gaps, bars)
    expect(result[0].filled).toBe(false)
    expect(result[0].fillPct).toBe(0.6)
  })

  it('ignores bars before the gap time', () => {
    const gaps = [{ top: 448, bottom: 445, time: 200, direction: 'up', gapSize: 3 }]
    const bars = [
      bar(100, 440, 450, 430, 445),  // before gap time — should be ignored
    ]
    const result = checkGapFills(gaps, bars)
    expect(result[0].filled).toBe(false)
  })

  it('handles multiple gaps independently', () => {
    const gaps = [
      { top: 448, bottom: 445, time: 200, direction: 'up', gapSize: 3 },
      { top: 460, bottom: 455, time: 300, direction: 'up', gapSize: 5 },
    ]
    const bars = [
      bar(250, 450, 452, 444, 446),  // fills first gap
      bar(350, 458, 459, 456, 457),  // partially fills second gap
    ]
    const result = checkGapFills(gaps, bars)
    expect(result[0].filled).toBe(true)
    expect(result[1].filled).toBe(false)
    expect(result[1].fillPct).toBeGreaterThan(0)
  })

  it('returns empty for empty gaps array', () => {
    expect(checkGapFills([], [bar(100, 440, 445, 435, 442)])).toEqual([])
  })
})
