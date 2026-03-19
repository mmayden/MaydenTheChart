import { describe, it, expect, beforeEach } from 'vitest'
import { migrateStore, stampCurrentVersions, stampAlertVersion } from './migrate'

/** Minimal localStorage mock. */
function createMockStorage(initial = {}) {
  const store = { ...initial }
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val) },
    removeItem: (key) => { delete store[key] },
    _dump: () => ({ ...store }),
  }
}

describe('migrateStore', () => {
  let storage

  beforeEach(() => {
    storage = createMockStorage()
  })

  it('does nothing when migrations array is empty', () => {
    storage.setItem('test-key', JSON.stringify({ foo: 1 }))
    migrateStore('test-key', [], storage)
    expect(JSON.parse(storage.getItem('test-key'))).toEqual({ foo: 1 })
    expect(storage.getItem('test-key-v')).toBeNull()
  })

  it('stamps version when key has no data', () => {
    migrateStore('test-key', [{ version: 1, up: (d) => d }], storage)
    expect(storage.getItem('test-key')).toBeNull()
    expect(storage.getItem('test-key-v')).toBe('1')
  })

  it('runs v0 → v1 migration on unversioned data', () => {
    storage.setItem('test-key', JSON.stringify({ items: [1, 2] }))
    const migrations = [
      { version: 1, up: (data) => ({ ...data, migrated: true }) },
    ]
    migrateStore('test-key', migrations, storage)

    const result = JSON.parse(storage.getItem('test-key'))
    expect(result).toEqual({ items: [1, 2], migrated: true })
    expect(storage.getItem('test-key-v')).toBe('1')
  })

  it('runs multi-step migration v0 → v1 → v2', () => {
    storage.setItem('test-key', JSON.stringify({ name: 'old' }))
    const migrations = [
      { version: 1, up: (data) => ({ ...data, v1: true }) },
      { version: 2, up: (data) => ({ ...data, v2: true, name: data.name.toUpperCase() }) },
    ]
    migrateStore('test-key', migrations, storage)

    const result = JSON.parse(storage.getItem('test-key'))
    expect(result).toEqual({ name: 'OLD', v1: true, v2: true })
    expect(storage.getItem('test-key-v')).toBe('2')
  })

  it('skips already-current data', () => {
    storage.setItem('test-key', JSON.stringify({ foo: 1 }))
    storage.setItem('test-key-v', '2')
    const migrations = [
      { version: 1, up: (data) => ({ ...data, v1: true }) },
      { version: 2, up: (data) => ({ ...data, v2: true }) },
    ]
    migrateStore('test-key', migrations, storage)

    // Data should be unchanged
    expect(JSON.parse(storage.getItem('test-key'))).toEqual({ foo: 1 })
  })

  it('runs only pending steps on partially-migrated data', () => {
    storage.setItem('test-key', JSON.stringify({ base: true, v1: true }))
    storage.setItem('test-key-v', '1')
    const migrations = [
      { version: 1, up: (data) => ({ ...data, v1: true }) },
      { version: 2, up: (data) => ({ ...data, v2: true }) },
      { version: 3, up: (data) => ({ ...data, v3: true }) },
    ]
    migrateStore('test-key', migrations, storage)

    const result = JSON.parse(storage.getItem('test-key'))
    expect(result).toEqual({ base: true, v1: true, v2: true, v3: true })
    expect(storage.getItem('test-key-v')).toBe('3')
  })

  it('handles corrupt JSON gracefully (no crash, no overwrite)', () => {
    storage.setItem('test-key', 'not-json{{{')
    const migrations = [{ version: 1, up: (d) => d }]
    migrateStore('test-key', migrations, storage)

    // Data should be left as-is
    expect(storage.getItem('test-key')).toBe('not-json{{{')
    // Version should NOT be stamped
    expect(storage.getItem('test-key-v')).toBeNull()
  })

  it('leaves data unchanged when a migration throws', () => {
    storage.setItem('test-key', JSON.stringify({ items: [1] }))
    const migrations = [
      { version: 1, up: () => { throw new Error('boom') } },
    ]
    migrateStore('test-key', migrations, storage)

    // Original data preserved
    expect(JSON.parse(storage.getItem('test-key'))).toEqual({ items: [1] })
    // Version NOT stamped
    expect(storage.getItem('test-key-v')).toBeNull()
  })

  it('works with array data', () => {
    storage.setItem('test-key', JSON.stringify([{ id: 1 }, { id: 2 }]))
    const migrations = [
      { version: 1, up: (data) => data.map((item) => ({ ...item, upgraded: true })) },
    ]
    migrateStore('test-key', migrations, storage)

    const result = JSON.parse(storage.getItem('test-key'))
    expect(result).toEqual([{ id: 1, upgraded: true }, { id: 2, upgraded: true }])
    expect(storage.getItem('test-key-v')).toBe('1')
  })

  it('handles version key with non-numeric value', () => {
    storage.setItem('test-key', JSON.stringify({ a: 1 }))
    storage.setItem('test-key-v', 'garbage')
    const migrations = [{ version: 1, up: (data) => ({ ...data, fixed: true }) }]
    migrateStore('test-key', migrations, storage)

    const result = JSON.parse(storage.getItem('test-key'))
    expect(result).toEqual({ a: 1, fixed: true })
    expect(storage.getItem('test-key-v')).toBe('1')
  })
})

describe('stampCurrentVersions', () => {
  it('stamps version keys for all known stores', () => {
    const storage = createMockStorage()
    stampCurrentVersions(storage)

    expect(storage.getItem('cheechart-presets-v')).toBe('1')
    expect(storage.getItem('cheechart-journal-v')).toBe('1')
    expect(storage.getItem('cheechart-annotations-v')).toBe('1')
  })
})

describe('stampAlertVersion', () => {
  it('stamps version for a specific alert preset key', () => {
    const storage = createMockStorage()
    stampAlertVersion('full', 1, storage)

    expect(storage.getItem('cheechart-alerts-full-v')).toBe('1')
  })

  it('defaults to version 1', () => {
    const storage = createMockStorage()
    stampAlertVersion('custom', undefined, storage)

    expect(storage.getItem('cheechart-alerts-custom-v')).toBe('1')
  })
})
