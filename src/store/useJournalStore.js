/**
 * useJournalStore — Zustand store for trade journal entries.
 *
 * Persists journal entries to localStorage.
 * Each entry: { id, date, symbol, timeframe, setup, result, notes, rating }
 */

import { create } from 'zustand'

const STORAGE_KEY = 'cheechart-journal'

function loadEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(stored)) return stored
  } catch { /* corrupt or missing */ }
  return []
}

function saveEntries(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* storage unavailable */ }
}

export const useJournalStore = create((set, get) => ({
  entries: loadEntries(),

  addEntry: (entry) => {
    const newEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...entry,
    }
    set((state) => {
      const next = [newEntry, ...state.entries]
      saveEntries(next)
      return { entries: next }
    })
    return newEntry.id
  },

  updateEntry: (id, updates) => {
    set((state) => {
      const next = state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e))
      saveEntries(next)
      return { entries: next }
    })
  },

  removeEntry: (id) => {
    set((state) => {
      const next = state.entries.filter((e) => e.id !== id)
      saveEntries(next)
      return { entries: next }
    })
  },

  /** Get entries sorted by date descending. */
  getRecentEntries: (limit = 50) => {
    return get().entries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
  },

  /** Get performance stats from journal entries. */
  getStats: () => {
    const entries = get().entries.filter((e) => e.result)
    if (entries.length === 0) return null

    const wins   = entries.filter((e) => e.result === 'win')
    const losses = entries.filter((e) => e.result === 'loss')
    const winRate = entries.length > 0 ? (wins.length / entries.length) * 100 : 0

    return {
      totalTrades: entries.length,
      wins: wins.length,
      losses: losses.length,
      breakeven: entries.length - wins.length - losses.length,
      winRate: parseFloat(winRate.toFixed(1)),
    }
  },
}))
