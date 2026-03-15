/**
 * WatchlistPanel — Symbol watchlist with live prices in right panel format.
 *
 * Track multiple symbols with add/remove. Click to switch chart.
 * Shows live price + daily % change (via /api/snapshot).
 * Auto-refreshes every 30s when panel is open.
 * Persisted to localStorage.
 */

import { useState } from 'react'
import { useChartStore } from '../../store/useChartStore'
import { useWatchlistQuotes } from '../../hooks/useWatchlistQuotes'
import { validateWatchlist } from '../../utils/validate'

const STORAGE_KEY = 'cheechart-watchlist'
const DEFAULT_WATCHLIST = ['QQQ', 'SPY', 'AAPL', 'NVDA', 'TSLA']

function loadWatchlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    const validated = validateWatchlist(stored)
    if (validated && validated.length > 0) return validated
  } catch { /* corrupt */ }
  return [...DEFAULT_WATCHLIST]
}

function saveWatchlist(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* storage unavailable */ }
}

export function WatchlistPanel() {
  const [symbols, setSymbols] = useState(loadWatchlist)
  const [newSymbol, setNewSymbol] = useState('')
  const setSymbol      = useChartStore((s) => s.setSymbol)
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)
  const { quotes, isLoading } = useWatchlistQuotes(symbols)

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme shrink-0">
        <span className="text-[11px] text-theme-muted">{symbols.length} symbols</span>
        {isLoading && (
          <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Symbol list */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-theme">
          {symbols.map((sym) => {
            const q = quotes[sym]
            const hasPrice = q?.price != null
            const isPositive = q?.changePercent > 0
            const isNegative = q?.changePercent < 0

            return (
              <li key={sym} className="flex items-center gap-3 px-4 py-2.5 hover:bg-theme-hover transition-colors group">
                <button
                  onClick={() => setSymbol(sym)}
                  className={`text-left text-xs font-mono font-semibold transition-colors w-14 shrink-0 ${
                    sym === selectedSymbol ? 'text-accent' : 'text-theme hover:text-accent'
                  }`}
                >
                  {sym}
                </button>

                {/* Price + change */}
                {hasPrice ? (
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-xs font-mono text-theme">
                      {q.price.toFixed(2)}
                    </span>
                    <span className={`text-[11px] font-mono font-semibold min-w-[52px] text-right ${
                      isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-theme-muted'
                    }`}>
                      {isPositive ? '+' : ''}{q.changePercent}%
                    </span>
                  </div>
                ) : (
                  <span className="flex-1 text-right text-[11px] text-theme-muted">—</span>
                )}

                <button
                  onClick={() => removeSymbol(sym)}
                  className="opacity-0 group-hover:opacity-100 text-theme-muted hover:text-red-400 text-xs transition-all shrink-0"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Add symbol form */}
      <form onSubmit={addSymbol} className="flex gap-2 px-4 py-3 border-t border-theme shrink-0">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="Add symbol..."
          className="flex-1 bg-input border border-theme-mid rounded px-2 py-1.5 text-xs text-theme placeholder-theme-muted focus:outline-none focus:border-accent font-mono"
          maxLength={10}
        />
        <button
          type="submit"
          disabled={!newSymbol.trim()}
          className="px-3 py-1.5 text-xs font-semibold rounded btn-primary disabled:opacity-40 text-white transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}
