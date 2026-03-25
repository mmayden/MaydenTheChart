/**
 * useJournalStore — Zustand store for trade journal entries.
 *
 * Persists journal entries to localStorage.
 * Each entry: { id, date, symbol, timeframe, setup, result, notes, rating }
 */

import { create } from 'zustand'
import { validateJournalEntry } from '../utils/validate'

const STORAGE_KEY = 'cheechart-journal'

function loadEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(stored)) {
      return stored.map(validateJournalEntry).filter(Boolean)
    }
  } catch { /* corrupt or missing */ }
  return []
}

function saveEntries(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* storage unavailable */ }
}

export const useJournalStore = create((set) => ({
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
}))
