import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  collectBackup,
  parseBackupFile,
  validateBackupData,
  applyBackup,
  encodePresetShare,
  decodePresetShare,
} from './backup'

// ── Mock localStorage ────────────────────────────────────────────────────────

const storage = {}
const localStorageMock = {
  getItem: vi.fn((key) => storage[key] ?? null),
  setItem: vi.fn((key, val) => { storage[key] = val }),
  removeItem: vi.fn((key) => { delete storage[key] }),
  key: vi.fn((i) => Object.keys(storage)[i] ?? null),
  get length() { return Object.keys(storage).length },
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock FileReader (not available in Node test env)
class MockFileReader {
  readAsText(blob) {
    blob.text().then((text) => {
      this.result = text
      if (this.onload) this.onload()
    }).catch(() => {
      if (this.onerror) this.onerror()
    })
  }
}
vi.stubGlobal('FileReader', MockFileReader)

beforeEach(() => {
  for (const key of Object.keys(storage)) delete storage[key]
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
})

// ── Helper ───────────────────────────────────────────────────────────────────

function makeFile(content, name = 'test.json', type = 'application/json') {
  const blob = new Blob([content], { type })
  blob.name = name
  // File constructor not available in test env, add size
  return Object.assign(blob, { name, lastModified: Date.now() })
}

function validEnvelope(overrides = {}) {
  return {
    cheechart: true,
    version: 1,
    exportedAt: '2026-03-19T00:00:00.000Z',
    data: {
      presets: {},
      activePreset: 'full',
      alerts: {},
      watchlist: [],
      journal: [],
      annotations: {},
      symbolUsage: {},
      preferences: { theme: 'dark', accent: null, soundAlerts: false, symbol: null },
    },
    ...overrides,
  }
}

// ── collectBackup ────────────────────────────────────────────────────────────

describe('collectBackup', () => {
  it('produces valid envelope with all required fields', () => {
    const backup = collectBackup()
    expect(backup.cheechart).toBe(true)
    expect(backup.version).toBe(1)
    expect(typeof backup.exportedAt).toBe('string')
    expect(new Date(backup.exportedAt).getTime()).not.toBeNaN()
    expect(backup.data).toBeDefined()
  })

  it('includes all data sections', () => {
    const { data } = collectBackup()
    expect(data).toHaveProperty('presets')
    expect(data).toHaveProperty('activePreset')
    expect(data).toHaveProperty('alerts')
    expect(data).toHaveProperty('watchlist')
    expect(data).toHaveProperty('journal')
    expect(data).toHaveProperty('annotations')
    expect(data).toHaveProperty('symbolUsage')
    expect(data).toHaveProperty('preferences')
  })

  it('handles empty localStorage gracefully', () => {
    const backup = collectBackup()
    expect(backup.data.presets).toEqual({})
    expect(backup.data.alerts).toEqual({})
    expect(backup.data.watchlist).toEqual([])
    expect(backup.data.journal).toEqual([])
  })

  it('collects dynamic alert keys', () => {
    storage['cheechart-alerts-full'] = JSON.stringify([{ id: 'a1', type: 'price', price: 100, condition: 'above', triggered: false }])
    storage['cheechart-alerts-scalp'] = JSON.stringify([{ id: 'a2', type: 'price', price: 50, condition: 'below', triggered: false }])

    const { data } = collectBackup()
    expect(data.alerts.full).toHaveLength(1)
    expect(data.alerts.scalp).toHaveLength(1)
  })

  it('collects presets from localStorage', () => {
    storage['cheechart-presets'] = JSON.stringify({ 'my-preset': { id: 'my-preset', name: 'My Preset' } })
    const { data } = collectBackup()
    expect(data.presets['my-preset']).toBeDefined()
  })

  it('collects preferences', () => {
    storage['cheechart-theme'] = 'terminal'
    storage['cheechart-accent'] = 'green'
    storage['cheechart-sound-alerts'] = 'true'
    storage['cheechart-symbol'] = 'AAPL'

    const { data } = collectBackup()
    expect(data.preferences.theme).toBe('terminal')
    expect(data.preferences.accent).toBe('green')
    expect(data.preferences.soundAlerts).toBe(true)
    expect(data.preferences.symbol).toBe('AAPL')
  })
})

// ── parseBackupFile ──────────────────────────────────────────────────────────

describe('parseBackupFile', () => {
  it('parses a valid backup file', async () => {
    const file = makeFile(JSON.stringify(validEnvelope()))
    const result = await parseBackupFile(file)
    expect(result.ok).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.summary).toBeDefined()
  })

  it('rejects files over 5MB', async () => {
    const huge = 'x'.repeat(6 * 1024 * 1024)
    const file = makeFile(huge)
    const result = await parseBackupFile(file)
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/too large/i)
  })

  it('rejects non-JSON content', async () => {
    const file = makeFile('<html>not json</html>')
    const result = await parseBackupFile(file)
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/valid JSON/i)
  })

  it('rejects missing magic marker', async () => {
    const file = makeFile(JSON.stringify({ version: 1, data: {} }))
    const result = await parseBackupFile(file)
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/marker/i)
  })

  it('rejects wrong version', async () => {
    const file = makeFile(JSON.stringify({ cheechart: true, version: 99, data: {} }))
    const result = await parseBackupFile(file)
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/version/i)
  })

  it('rejects missing data section', async () => {
    const file = makeFile(JSON.stringify({ cheechart: true, version: 1 }))
    const result = await parseBackupFile(file)
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/data/i)
  })

  it('rejects malformed JSON', async () => {
    const file = makeFile('{bad json')
    const result = await parseBackupFile(file)
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/invalid json/i)
  })

  it('rejects empty file', async () => {
    const file = makeFile('')
    const result = await parseBackupFile(file)
    expect(result.ok).toBe(false)
  })
})

// ── validateBackupData ───────────────────────────────────────────────────────

describe('validateBackupData', () => {
  it('validates presets correctly', () => {
    const raw = {
      presets: {
        'custom-1': { id: 'custom-1', name: 'Test', icon: '◉', isDefault: false, indicators: { ema: true }, timeframe: '5Min' },
      },
    }
    const { data, summary } = validateBackupData(raw)
    expect(summary.presets).toBe(1)
    expect(data.presets['custom-1'].name).toBe('Test')
  })

  it('rejects invalid presets', () => {
    const raw = { presets: { bad: { name: 42 } } }
    const { summary } = validateBackupData(raw)
    expect(summary.presets).toBe(0)
  })

  it('validates alerts per-preset', () => {
    const raw = {
      alerts: {
        full: [
          { id: 'a1', type: 'price', price: 100, condition: 'above', triggered: false },
          { id: 'bad', type: 'unknown' }, // should be filtered
        ],
      },
    }
    const { data, summary } = validateBackupData(raw)
    expect(summary.alerts).toBe(1)
    expect(data.alerts.full).toHaveLength(1)
  })

  it('caps alerts at 50 per preset', () => {
    const alerts = Array.from({ length: 60 }, (_, i) => ({
      id: `a${i}`, type: 'price', price: 100 + i, condition: 'above', triggered: false,
    }))
    const { data } = validateBackupData({ alerts: { full: alerts } })
    expect(data.alerts.full).toHaveLength(50)
  })

  it('validates journal entries', () => {
    const raw = {
      journal: [
        { id: 'j1', date: '2026-03-19', symbol: 'QQQ', result: 'win', notes: 'good', rating: 5, setup: '', timeframe: '5Min' },
        { id: 'bad' }, // missing date
      ],
    }
    const { summary } = validateBackupData(raw)
    expect(summary.journal).toBe(1)
  })

  it('caps journal at 10000 entries', () => {
    const entries = Array.from({ length: 10_100 }, (_, i) => ({
      id: `j${i}`, date: '2026-01-01', notes: '',
    }))
    const { data } = validateBackupData({ journal: entries })
    expect(data.journal.length).toBeLessThanOrEqual(10_000)
  })

  it('validates watchlist', () => {
    const raw = { watchlist: ['QQQ', 'invalid!!!', 'AAPL', 'QQQ'] }
    const { data } = validateBackupData(raw)
    expect(data.watchlist).toEqual(['QQQ', 'AAPL'])
  })

  it('validates annotations per-symbol', () => {
    const raw = {
      annotations: {
        QQQ: [
          { id: 'an1', type: 'text', time: 1000, price: 100, text: 'note', createdAt: 123 },
          { id: 'bad', type: 'invalid' },
        ],
      },
    }
    const { data, summary } = validateBackupData(raw)
    expect(summary.annotations).toBe(1)
    expect(data.annotations.QQQ).toHaveLength(1)
  })

  it('validates symbolUsage', () => {
    const raw = { symbolUsage: { QQQ: 10, 'INVALID!!!': 5, AAPL: -1 } }
    const { data } = validateBackupData(raw)
    expect(data.symbolUsage).toEqual({ QQQ: 10 })
  })

  it('validates preferences', () => {
    const raw = { preferences: { theme: 'terminal', accent: 'green', soundAlerts: true, symbol: 'SPY' } }
    const { data } = validateBackupData(raw)
    expect(data.preferences.theme).toBe('terminal')
    expect(data.preferences.soundAlerts).toBe(true)
  })

  it('handles completely empty data gracefully', () => {
    const { data, summary } = validateBackupData({})
    expect(summary.presets).toBe(0)
    expect(summary.journal).toBe(0)
    expect(data.watchlist).toEqual([])
  })

  // ── Security tests ─────────────────────────────────────────────────────

  it('ignores __proto__ keys in presets', () => {
    const raw = { presets: { __proto__: { id: '__proto__', name: 'evil' } } }
    const { data } = validateBackupData(raw)
    expect(data.presets).toEqual({})
  })

  it('ignores __proto__ keys in alerts', () => {
    const raw = { alerts: { __proto__: [{ id: 'a', type: 'price', price: 1, condition: 'above', triggered: false }] } }
    const { data } = validateBackupData(raw)
    expect(data.alerts).toEqual({})
  })

  it('ignores __proto__ keys in annotations', () => {
    const raw = { annotations: { __proto__: [{ id: 'a', type: 'text', time: 1, price: 1 }] } }
    const { data } = validateBackupData(raw)
    expect(data.annotations).toEqual({})
  })

  it('rejects non-array alerts', () => {
    const raw = { alerts: { full: 'not an array' } }
    const { data } = validateBackupData(raw)
    expect(data.alerts).toEqual({})
  })

  it('rejects non-array journal', () => {
    const raw = { journal: 'not an array' }
    const { data } = validateBackupData(raw)
    expect(data.journal).toEqual([])
  })

  it('caps annotations per symbol at 500', () => {
    const anns = Array.from({ length: 600 }, (_, i) => ({
      id: `a${i}`, type: 'text', time: 1000 + i, price: 100, text: 'note',
    }))
    const { data } = validateBackupData({ annotations: { QQQ: anns } })
    expect(data.annotations.QQQ).toHaveLength(500)
  })

  it('caps annotation symbols at 200', () => {
    const annotations = {}
    for (let i = 0; i < 250; i++) {
      const sym = `T${String(i).padStart(3, '0')}`
      annotations[sym] = [{ id: `a${i}`, type: 'text', time: 1000, price: 100, text: 'n' }]
    }
    const { data } = validateBackupData({ annotations })
    expect(Object.keys(data.annotations).length).toBeLessThanOrEqual(200)
  })
})

// ── applyBackup ──────────────────────────────────────────────────────────────

describe('applyBackup', () => {
  it('writes presets to localStorage', () => {
    applyBackup({
      presets: { 'c1': { id: 'c1', name: 'Test', isDefault: false, indicators: {}, timeframe: '5Min', icon: '◉' } },
      alerts: {}, watchlist: [], journal: [], annotations: {}, symbolUsage: {}, preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-presets'])
    expect(saved.c1.name).toBe('Test')
  })

  it('merges presets with new UUIDs on collision', () => {
    storage['cheechart-presets'] = JSON.stringify({ 'c1': { id: 'c1', name: 'Existing' } })
    applyBackup({
      presets: { 'c1': { id: 'c1', name: 'Imported', isDefault: false } },
      alerts: {}, watchlist: [], journal: [], annotations: {}, symbolUsage: {}, preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-presets'])
    // Original c1 should still exist, imported should have new ID
    expect(saved.c1.name).toBe('Existing')
    const keys = Object.keys(saved)
    expect(keys.length).toBe(2)
  })

  it('skips default presets on import', () => {
    applyBackup({
      presets: { 'full': { id: 'full', name: 'Full', isDefault: true } },
      alerts: {}, watchlist: [], journal: [], annotations: {}, symbolUsage: {}, preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-presets'] || '{}')
    expect(saved.full).toBeUndefined()
  })

  it('merges alerts per-preset', () => {
    storage['cheechart-alerts-full'] = JSON.stringify([{ id: 'existing', type: 'price', price: 50, condition: 'above', triggered: false }])
    applyBackup({
      presets: {},
      alerts: { full: [{ id: 'new1', type: 'price', price: 100, condition: 'below', triggered: false }] },
      watchlist: [], journal: [], annotations: {}, symbolUsage: {}, preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-alerts-full'])
    expect(saved).toHaveLength(2)
  })

  it('deduplicates alerts by ID on merge', () => {
    storage['cheechart-alerts-full'] = JSON.stringify([{ id: 'a1', type: 'price', price: 50, condition: 'above', triggered: false }])
    applyBackup({
      presets: {},
      alerts: { full: [{ id: 'a1', type: 'price', price: 100, condition: 'below', triggered: false }] },
      watchlist: [], journal: [], annotations: {}, symbolUsage: {}, preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-alerts-full'])
    expect(saved).toHaveLength(1) // no duplicate
  })

  it('merges watchlist with dedup', () => {
    storage['cheechart-watchlist'] = JSON.stringify(['QQQ', 'AAPL'])
    applyBackup({
      presets: {}, alerts: {},
      watchlist: ['AAPL', 'SPY'], // AAPL is dup
      journal: [], annotations: {}, symbolUsage: {}, preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-watchlist'])
    expect(saved).toEqual(['QQQ', 'AAPL', 'SPY'])
  })

  it('merges journal by ID', () => {
    storage['cheechart-journal'] = JSON.stringify([{ id: 'j1', date: '2026-01-01' }])
    applyBackup({
      presets: {}, alerts: {}, watchlist: [],
      journal: [{ id: 'j1', date: '2026-01-01' }, { id: 'j2', date: '2026-01-02' }],
      annotations: {}, symbolUsage: {}, preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-journal'])
    expect(saved).toHaveLength(2) // j1 deduped, j2 added
  })

  it('merges annotations per-symbol by ID', () => {
    storage['cheechart-annotations'] = JSON.stringify({ QQQ: [{ id: 'a1', type: 'text' }] })
    applyBackup({
      presets: {}, alerts: {}, watchlist: [], journal: [],
      annotations: { QQQ: [{ id: 'a1' }, { id: 'a2', type: 'text' }] },
      symbolUsage: {}, preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-annotations'])
    expect(saved.QQQ).toHaveLength(2) // a1 deduped, a2 added
  })

  it('applies max-wins merge for symbolUsage', () => {
    storage['cheechart-symbol-usage'] = JSON.stringify({ QQQ: 10, AAPL: 5 })
    applyBackup({
      presets: {}, alerts: {}, watchlist: [], journal: [], annotations: {},
      symbolUsage: { QQQ: 8, AAPL: 12, SPY: 3 },
      preferences: null,
    })
    const saved = JSON.parse(storage['cheechart-symbol-usage'])
    expect(saved.QQQ).toBe(10)  // existing was higher
    expect(saved.AAPL).toBe(12) // imported was higher
    expect(saved.SPY).toBe(3)   // new
  })

  it('writes preferences to localStorage', () => {
    applyBackup({
      presets: {}, alerts: {}, watchlist: [], journal: [], annotations: {}, symbolUsage: {},
      preferences: { theme: 'terminal', accent: 'green', soundAlerts: true, symbol: 'NVDA' },
    })
    expect(storage['cheechart-theme']).toBe('terminal')
    expect(storage['cheechart-accent']).toBe('green')
    expect(storage['cheechart-sound-alerts']).toBe('true')
    expect(storage['cheechart-symbol']).toBe('NVDA')
  })
})

// ── Preset Share Links ───────────────────────────────────────────────────────

describe('encodePresetShare', () => {
  it('produces a non-empty string', () => {
    const result = encodePresetShare({ name: 'Test', timeframe: '5Min', indicators: { ema: true, vwap: true } })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('encodes only enabled indicators', () => {
    const result = encodePresetShare({ name: 'Test', timeframe: '5Min', indicators: { ema: true, vwap: false, rsi: true } })
    const decoded = JSON.parse(atob(result.replace(/-/g, '+').replace(/_/g, '/')))
    expect(decoded.i).toContain('e') // ema
    expect(decoded.i).toContain('R') // rsi
    expect(decoded.i).not.toContain('v') // vwap off
  })

  it('returns empty string for null input', () => {
    expect(encodePresetShare(null)).toBe('')
  })
})

describe('decodePresetShare', () => {
  it('round-trips correctly', () => {
    const original = {
      name: 'My Scalp',
      timeframe: '15Min',
      indicators: {
        ema: true, vwap: true, rvol: false, rsi: true, macd: false, levels: true,
        sr: false, bollinger: false, rsiDiv: false, emaCross: false, gaps: false, volProfile: false,
      },
    }
    const encoded = encodePresetShare(original)
    const decoded = decodePresetShare(encoded)
    expect(decoded.name).toBe('My Scalp')
    expect(decoded.timeframe).toBe('15Min')
    expect(decoded.indicators.ema).toBe(true)
    expect(decoded.indicators.vwap).toBe(true)
    expect(decoded.indicators.rsi).toBe(true)
    expect(decoded.indicators.levels).toBe(true)
    expect(decoded.indicators.macd).toBe(false)
  })

  it('returns null for invalid base64', () => {
    expect(decodePresetShare('!!!not-base64!!!')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(decodePresetShare('')).toBeNull()
  })

  it('returns null for non-string', () => {
    expect(decodePresetShare(42)).toBeNull()
    expect(decodePresetShare(null)).toBeNull()
  })

  it('returns null for malformed JSON payload', () => {
    const encoded = btoa('{bad json')
    expect(decodePresetShare(encoded)).toBeNull()
  })

  it('returns null for oversized input (> 500 chars)', () => {
    const huge = btoa(JSON.stringify({ n: 'x'.repeat(1000), tf: '5Min', i: '' }))
    expect(decodePresetShare(huge)).toBeNull()
  })

  it('defaults to 5Min for unknown timeframe', () => {
    const encoded = btoa(JSON.stringify({ n: 'Test', tf: 'invalid', i: 'e' }))
    const decoded = decodePresetShare(encoded)
    expect(decoded.timeframe).toBe('5Min')
  })

  it('truncates long names to 50 chars', () => {
    const encoded = btoa(JSON.stringify({ n: 'a'.repeat(100), tf: '5Min', i: '' }))
    const decoded = decodePresetShare(encoded)
    expect(decoded.name.length).toBe(50)
  })

  it('ignores unknown indicator chars', () => {
    const encoded = btoa(JSON.stringify({ n: 'Test', tf: '5Min', i: 'eZZZ' }))
    const decoded = decodePresetShare(encoded)
    expect(decoded.indicators.ema).toBe(true)
    // Unknown chars don't set anything
    expect(Object.values(decoded.indicators).filter(Boolean)).toHaveLength(1)
  })

  it('returns null for non-object JSON payload', () => {
    const encoded = btoa(JSON.stringify([1, 2, 3]))
    expect(decodePresetShare(encoded)).toBeNull()
  })

  it('returns null for non-object first char', () => {
    const encoded = btoa('"just a string"')
    expect(decodePresetShare(encoded)).toBeNull()
  })
})
