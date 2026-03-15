import { describe, it, expect } from 'vitest'
import { validatePreset, validateJournalEntry, validateWatchlist, validateSymbolUsage } from './validate'

// ─── validatePreset ──────────────────────────────────────────────────────────

describe('validatePreset', () => {
  const validPreset = {
    id: 'custom-123',
    name: 'My Preset',
    icon: '◉',
    isDefault: false,
    indicators: { ema: true, vwap: true, rvol: false, rsi: false, macd: false, levels: true, sr: false, bollinger: false },
    timeframe: '5Min',
  }

  it('passes a valid preset through unchanged', () => {
    const result = validatePreset(validPreset)
    expect(result).toEqual(validPreset)
  })

  it('returns null for null/undefined/non-object', () => {
    expect(validatePreset(null)).toBeNull()
    expect(validatePreset(undefined)).toBeNull()
    expect(validatePreset('string')).toBeNull()
    expect(validatePreset(42)).toBeNull()
  })

  it('returns null if id or name is missing', () => {
    expect(validatePreset({ ...validPreset, id: '' })).toBeNull()
    expect(validatePreset({ ...validPreset, name: '' })).toBeNull()
    expect(validatePreset({ ...validPreset, id: 123 })).toBeNull()
  })

  it('returns null if indicators is missing or not an object', () => {
    expect(validatePreset({ ...validPreset, indicators: null })).toBeNull()
    expect(validatePreset({ ...validPreset, indicators: 'string' })).toBeNull()
  })

  it('truncates long preset names to 50 chars', () => {
    const result = validatePreset({ ...validPreset, name: 'A'.repeat(100) })
    expect(result.name).toHaveLength(50)
  })

  it('defaults unknown indicator keys to false', () => {
    const result = validatePreset({ ...validPreset, indicators: { ema: true } })
    expect(result.indicators.ema).toBe(true)
    expect(result.indicators.vwap).toBe(false)
    expect(result.indicators.sr).toBe(false)
  })

  it('strips extra keys from indicators', () => {
    const result = validatePreset({
      ...validPreset,
      indicators: { ...validPreset.indicators, hackKey: true },
    })
    expect(result.indicators).not.toHaveProperty('hackKey')
  })

  it('falls back to 5Min for invalid timeframe', () => {
    const result = validatePreset({ ...validPreset, timeframe: 'invalid' })
    expect(result.timeframe).toBe('5Min')
  })

  it('defaults isDefault to false if non-boolean', () => {
    const result = validatePreset({ ...validPreset, isDefault: 'true' })
    expect(result.isDefault).toBe(false)
  })
})

// ─── validateJournalEntry ────────────────────────────────────────────────────

describe('validateJournalEntry', () => {
  const validEntry = {
    id: 'entry-abc',
    date: '2026-03-15T10:30:00.000Z',
    symbol: 'QQQ',
    timeframe: '5Min',
    setup: 'ORB breakout',
    result: 'win',
    notes: 'Clean breakout with volume',
    rating: 4,
  }

  it('passes a valid entry through', () => {
    const result = validateJournalEntry(validEntry)
    expect(result).toEqual(validEntry)
  })

  it('returns null for null/undefined/non-object', () => {
    expect(validateJournalEntry(null)).toBeNull()
    expect(validateJournalEntry(undefined)).toBeNull()
    expect(validateJournalEntry(42)).toBeNull()
  })

  it('returns null if id is missing', () => {
    expect(validateJournalEntry({ ...validEntry, id: '' })).toBeNull()
    expect(validateJournalEntry({ ...validEntry, id: 123 })).toBeNull()
  })

  it('returns null for invalid date strings', () => {
    expect(validateJournalEntry({ ...validEntry, date: 'not-a-date' })).toBeNull()
    expect(validateJournalEntry({ ...validEntry, date: 123 })).toBeNull()
  })

  it('nullifies invalid symbols', () => {
    const result = validateJournalEntry({ ...validEntry, symbol: 'invalid!' })
    expect(result.symbol).toBeNull()
  })

  it('nullifies invalid results', () => {
    const result = validateJournalEntry({ ...validEntry, result: 'maybe' })
    expect(result.result).toBeNull()
  })

  it('nullifies ratings outside 1-5', () => {
    expect(validateJournalEntry({ ...validEntry, rating: 0 }).rating).toBeNull()
    expect(validateJournalEntry({ ...validEntry, rating: 6 }).rating).toBeNull()
    expect(validateJournalEntry({ ...validEntry, rating: 1.5 }).rating).toBeNull()
  })

  it('truncates notes at 2000 chars', () => {
    const result = validateJournalEntry({ ...validEntry, notes: 'X'.repeat(3000) })
    expect(result.notes).toHaveLength(2000)
  })

  it('handles entries with missing optional fields', () => {
    const result = validateJournalEntry({ id: 'x', date: '2026-01-01T00:00:00Z' })
    expect(result).not.toBeNull()
    expect(result.symbol).toBeNull()
    expect(result.result).toBeNull()
    expect(result.rating).toBeNull()
    expect(result.notes).toBe('')
    expect(result.setup).toBe('')
  })
})

// ─── validateWatchlist ───────────────────────────────────────────────────────

describe('validateWatchlist', () => {
  it('passes a valid watchlist through', () => {
    const result = validateWatchlist(['QQQ', 'SPY', 'AAPL'])
    expect(result).toEqual(['QQQ', 'SPY', 'AAPL'])
  })

  it('returns null for non-array input', () => {
    expect(validateWatchlist('QQQ')).toBeNull()
    expect(validateWatchlist(null)).toBeNull()
    expect(validateWatchlist({})).toBeNull()
  })

  it('filters out invalid symbols', () => {
    const result = validateWatchlist(['QQQ', '123', 'bad!', 'SPY'])
    expect(result).toEqual(['QQQ', 'SPY'])
  })

  it('deduplicates symbols', () => {
    const result = validateWatchlist(['QQQ', 'SPY', 'QQQ', 'SPY'])
    expect(result).toEqual(['QQQ', 'SPY'])
  })

  it('caps at 100 symbols', () => {
    const big = Array.from({ length: 150 }, (_, i) => `SYM${String(i).padStart(2, '0')}`.slice(0, 5).toUpperCase())
    // Generate valid symbols
    const valid = Array.from({ length: 150 }, (_, i) => `T${i}`)
      .filter((s) => /^[A-Z]{1,10}$/.test(s))
    const result = validateWatchlist(valid)
    expect(result.length).toBeLessThanOrEqual(100)
  })

  it('filters non-string elements', () => {
    const result = validateWatchlist(['QQQ', 42, null, 'SPY'])
    expect(result).toEqual(['QQQ', 'SPY'])
  })

  it('handles dotted symbols like BRK.B', () => {
    const result = validateWatchlist(['BRK.B', 'SPY'])
    expect(result).toEqual(['BRK.B', 'SPY'])
  })
})

// ─── validateSymbolUsage ─────────────────────────────────────────────────────

describe('validateSymbolUsage', () => {
  it('passes valid usage counts through', () => {
    const result = validateSymbolUsage({ QQQ: 5, SPY: 3 })
    expect(result).toEqual({ QQQ: 5, SPY: 3 })
  })

  it('returns empty object for non-object input', () => {
    expect(validateSymbolUsage(null)).toEqual({})
    expect(validateSymbolUsage('string')).toEqual({})
    expect(validateSymbolUsage([])).toEqual({})
  })

  it('filters out invalid symbol keys', () => {
    const result = validateSymbolUsage({ QQQ: 5, '!!!': 3, '': 1 })
    expect(result).toEqual({ QQQ: 5 })
  })

  it('filters out non-integer or negative values', () => {
    const result = validateSymbolUsage({ QQQ: 5, SPY: -1, AAPL: 3.5, NVDA: 'foo' })
    expect(result).toEqual({ QQQ: 5 })
  })
})
