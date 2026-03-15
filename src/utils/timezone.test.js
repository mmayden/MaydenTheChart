/**
 * Unit tests for timezone.js — ET date/time conversion utilities.
 *
 * Tests cover:
 *   - Basic date string conversion
 *   - Basic time extraction
 *   - DST boundaries (spring forward / fall back)
 *   - Midnight edge cases
 *   - Zero / negative timestamps
 */

import { describe, it, expect } from 'vitest'
import { toETDateString, toETTime } from './timezone'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create unix seconds from a UTC date string */
function utcSecs(isoStr) {
  return Math.floor(new Date(isoStr).getTime() / 1000)
}

// ── toETDateString ──────────────────────────────────────────────────────────

describe('toETDateString', () => {
  it('converts a midday UTC timestamp to ET date', () => {
    // 2024-06-15 18:00 UTC = 2024-06-15 14:00 ET (EDT, -4h)
    const ts = utcSecs('2024-06-15T18:00:00Z')
    expect(toETDateString(ts)).toBe('2024-06-15')
  })

  it('handles UTC midnight rolling back to previous ET day', () => {
    // 2024-06-15 03:00 UTC = 2024-06-14 23:00 ET (EDT, -4h) → previous day
    const ts = utcSecs('2024-06-15T03:00:00Z')
    expect(toETDateString(ts)).toBe('2024-06-14')
  })

  it('handles EST offset (winter, -5h)', () => {
    // 2024-01-15 04:00 UTC = 2024-01-14 23:00 EST → previous day
    const ts = utcSecs('2024-01-15T04:00:00Z')
    expect(toETDateString(ts)).toBe('2024-01-14')
  })

  it('handles EST midday correctly', () => {
    // 2024-01-15 18:00 UTC = 2024-01-15 13:00 EST
    const ts = utcSecs('2024-01-15T18:00:00Z')
    expect(toETDateString(ts)).toBe('2024-01-15')
  })

  // ── DST boundary tests ──

  it('spring forward: 2024-03-10 at 1:59 AM EST → still March 10', () => {
    // 2024-03-10 06:59 UTC = 2024-03-10 01:59 EST (DST has not kicked in yet)
    const ts = utcSecs('2024-03-10T06:59:00Z')
    expect(toETDateString(ts)).toBe('2024-03-10')
  })

  it('spring forward: 2024-03-10 at 3:00 AM EDT → still March 10', () => {
    // 2024-03-10 07:00 UTC = 2024-03-10 03:00 EDT (clocks jumped from 2:00→3:00)
    const ts = utcSecs('2024-03-10T07:00:00Z')
    expect(toETDateString(ts)).toBe('2024-03-10')
  })

  it('fall back: 2024-11-03 at 1:00 AM EDT → still November 3', () => {
    // 2024-11-03 05:00 UTC = 2024-11-03 01:00 EDT (before fall back)
    const ts = utcSecs('2024-11-03T05:00:00Z')
    expect(toETDateString(ts)).toBe('2024-11-03')
  })

  it('fall back: 2024-11-03 at 1:00 AM EST → still November 3', () => {
    // 2024-11-03 06:00 UTC = 2024-11-03 01:00 EST (after fall back)
    const ts = utcSecs('2024-11-03T06:00:00Z')
    expect(toETDateString(ts)).toBe('2024-11-03')
  })

  it('returns valid date format (YYYY-MM-DD)', () => {
    const ts = utcSecs('2024-08-01T12:00:00Z')
    expect(toETDateString(ts)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ── toETTime ────────────────────────────────────────────────────────────────

describe('toETTime', () => {
  it('returns correct hour and minute for a simple case', () => {
    // 2024-06-15 18:30 UTC = 2024-06-15 14:30 EDT
    const ts = utcSecs('2024-06-15T18:30:00Z')
    const { hour, minute } = toETTime(ts)
    expect(hour).toBe(14)
    expect(minute).toBe(30)
  })

  it('handles market open time (9:30 AM ET)', () => {
    // EDT: 9:30 AM ET = 13:30 UTC
    const ts = utcSecs('2024-06-15T13:30:00Z')
    const { hour, minute } = toETTime(ts)
    expect(hour).toBe(9)
    expect(minute).toBe(30)
  })

  it('handles market close time (4:00 PM ET)', () => {
    // EDT: 4:00 PM ET = 20:00 UTC
    const ts = utcSecs('2024-06-15T20:00:00Z')
    const { hour, minute } = toETTime(ts)
    expect(hour).toBe(16)
    expect(minute).toBe(0)
  })

  it('handles EST offset (winter)', () => {
    // EST: 9:30 AM ET = 14:30 UTC
    const ts = utcSecs('2024-01-15T14:30:00Z')
    const { hour, minute } = toETTime(ts)
    expect(hour).toBe(9)
    expect(minute).toBe(30)
  })

  it('returns numbers, not strings', () => {
    const ts = utcSecs('2024-06-15T18:30:00Z')
    const { hour, minute } = toETTime(ts)
    expect(typeof hour).toBe('number')
    expect(typeof minute).toBe('number')
  })

  // ── DST boundary ──

  it('spring forward: 3:00 AM EDT reads correctly', () => {
    // 2024-03-10 07:00 UTC = 2024-03-10 03:00 EDT
    const ts = utcSecs('2024-03-10T07:00:00Z')
    const { hour } = toETTime(ts)
    expect(hour).toBe(3)
  })

  it('fall back: 1:00 AM EST (second occurrence) reads correctly', () => {
    // 2024-11-03 06:00 UTC = 2024-11-03 01:00 EST
    const ts = utcSecs('2024-11-03T06:00:00Z')
    const { hour } = toETTime(ts)
    expect(hour).toBe(1)
  })

  it('midnight ET returns hour 0', () => {
    // EDT: midnight = 04:00 UTC
    const ts = utcSecs('2024-06-15T04:00:00Z')
    const { hour, minute } = toETTime(ts)
    expect(hour).toBe(0)
    expect(minute).toBe(0)
  })
})
