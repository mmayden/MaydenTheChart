/**
 * Unit tests for useJournalStore
 *
 * Tests verify:
 *   - CRUD operations (add, update, remove)
 *   - Edge cases (empty store)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useJournalStore } from './useJournalStore'

function resetStore() {
  useJournalStore.setState({ entries: [] })
}

function addSample(overrides = {}) {
  return useJournalStore.getState().addEntry({
    symbol: 'QQQ',
    timeframe: '5Min',
    setup: 'ORB Breakout',
    result: 'win',
    notes: '',
    rating: 3,
    ...overrides,
  })
}

describe('useJournalStore', () => {
  beforeEach(resetStore)

  it('starts empty after reset', () => {
    expect(useJournalStore.getState().entries).toHaveLength(0)
  })

  it('addEntry creates entry with id and date', () => {
    const id = addSample()
    const entries = useJournalStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe(id)
    expect(entries[0].date).toBeTruthy()
    expect(entries[0].symbol).toBe('QQQ')
  })

  it('addEntry prepends (newest first)', () => {
    addSample({ symbol: 'AAPL' })
    addSample({ symbol: 'NVDA' })
    const entries = useJournalStore.getState().entries
    expect(entries[0].symbol).toBe('NVDA')
    expect(entries[1].symbol).toBe('AAPL')
  })

  it('updateEntry modifies existing entry', () => {
    const id = addSample({ notes: 'original' })
    useJournalStore.getState().updateEntry(id, { notes: 'updated' })
    expect(useJournalStore.getState().entries[0].notes).toBe('updated')
  })

  it('removeEntry deletes entry', () => {
    const id = addSample()
    addSample({ symbol: 'SPY' })
    useJournalStore.getState().removeEntry(id)
    const entries = useJournalStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].symbol).toBe('SPY')
  })
})
