/**
 * WatchlistCard — Mini sparkline watchlist for tracking multiple symbols.
 *
 * Shows a configurable list of symbols with current price and direction.
 * Symbols can be added/removed. Persisted to localStorage.
 */

import { useState, useEffect } from 'react'
import { useChartStore } from '../../store/useChartStore'

const STORAGE_KEY = 'cheechart-watchlist'
const DEFAULT_WATCHLIST = ['QQQ', 'SPY', 'AAPL', 'NVDA', 'TSLA']

function loadWatchlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(stored) && stored.length > 0) return stored
  } catch { /* corrupt */ }
  return [...DEFAULT_WATCHLIST]
}

function saveWatchlist(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* storage unavailable */ }
}

export function WatchlistCard() {
  const [symbols, setSymbols] = useState(loadWatchlist)
  const [newSymbol, setNewSymbol] = useState('')
  const setSymbol   = useChartStore((s) => s.setSymbol)

  function addSymbol(e) {
    e.preventDefault()
    const s = newSymbol.trim().toUpperCase()
    if (!s || symbols.includes(s)) return
    const next = [...symbols, s]
    setSymbols(next)
    saveWatchlist(next)
    setNewSymbol('')
  }

  function removeSymbol(sym) {
    const next = symbols.filter((s) => s !== sym)
    setSymbols(next)
    saveWatchlist(next)
  }

  function handleClick(sym) {
    setSymbol(sym)
  }

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-sm font-bold tracking-wide">Watchlist</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">{symbols.length} symbols</p>
      </div>

      {/* Symbol list */}
      <div className="max-h-64 overflow-y-auto">
        <ul className="divide-y divide-gray-800">
          {symbols.map((sym) => (
            <li key={sym} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-800/30 transition-colors group">
              <button
                onClick={() => handleClick(sym)}
                className="flex-1 text-left text-xs font-mono font-semibold text-gray-200 hover:text-blue-400 transition-colors"
              >
                {sym}
              </button>
              <button
                onClick={() => removeSymbol(sym)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-all"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Add symbol form */}
      <form onSubmit={addSymbol} className="flex gap-2 px-5 py-3 border-t border-gray-800">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="Add symbol..."
          className="flex-1 bg-[#0a0a0a] border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
          maxLength={10}
        />
        <button
          type="submit"
          disabled={!newSymbol.trim()}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}
