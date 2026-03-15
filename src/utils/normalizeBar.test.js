import { describe, it, expect } from 'vitest'
import { normalizeBar } from './normalizeBar'

describe('normalizeBar', () => {
  it('converts Alpaca REST bar to lightweight-charts shape', () => {
    const bar = { t: '2024-03-14T14:30:00Z', o: 100.5, h: 101.2, l: 99.8, c: 100.9, v: 50000 }
    const result = normalizeBar(bar)

    expect(result).toEqual({
      time:   Math.floor(new Date('2024-03-14T14:30:00Z').getTime() / 1000),
      open:   100.5,
      high:   101.2,
      low:    99.8,
      close:  100.9,
      volume: 50000,
    })
  })

  it('converts Alpaca WebSocket bar (extra fields ignored)', () => {
    const bar = { t: '2024-03-14T14:30:00Z', o: 100, h: 101, l: 99, c: 100.5, v: 1000, T: 'b', S: 'QQQ', n: 42, vw: 100.3 }
    const result = normalizeBar(bar)

    expect(result.time).toBe(Math.floor(new Date('2024-03-14T14:30:00Z').getTime() / 1000))
    expect(result.open).toBe(100)
    expect(result.high).toBe(101)
    expect(result.low).toBe(99)
    expect(result.close).toBe(100.5)
    expect(result.volume).toBe(1000)
    expect(result).not.toHaveProperty('T')
    expect(result).not.toHaveProperty('S')
  })

  it('produces integer unix seconds (not milliseconds)', () => {
    const bar = { t: '2024-01-01T00:00:00Z', o: 1, h: 2, l: 0.5, c: 1.5, v: 100 }
    const result = normalizeBar(bar)

    expect(result.time).toBe(1704067200)
    expect(Number.isInteger(result.time)).toBe(true)
  })

  it('handles fractional timestamps by flooring', () => {
    const bar = { t: '2024-03-14T14:30:00.500Z', o: 1, h: 2, l: 0.5, c: 1.5, v: 100 }
    const result = normalizeBar(bar)

    expect(Number.isInteger(result.time)).toBe(true)
  })

  it('preserves exact numeric values without rounding', () => {
    const bar = { t: '2024-03-14T14:30:00Z', o: 100.123456, h: 200.999, l: 0.001, c: 50.505050, v: 999999 }
    const result = normalizeBar(bar)

    expect(result.open).toBe(100.123456)
    expect(result.high).toBe(200.999)
    expect(result.low).toBe(0.001)
    expect(result.close).toBe(50.505050)
    expect(result.volume).toBe(999999)
  })
})
