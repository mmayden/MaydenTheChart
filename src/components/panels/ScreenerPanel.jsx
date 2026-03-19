/**
 * ScreenerPanel — Scans watchlist symbols for active confluence setups.
 *
 * Displays each symbol with its confluence score, bias, day type, and key
 * indicator readings. Click a symbol to switch the chart. Sorted by score.
 * Shares the watchlist from WatchlistPanel (same localStorage key).
 */

import { useState } from 'react'
import { useChartStore } from '../../store/useChartStore'
import { useScreener } from '../../hooks/useScreener'
import { validateWatchlist } from '../../utils/validate'
import { SYMBOL_RE } from '../../constants/patterns'

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

function ScoreBadge({ score, bias, level }) {
  const bgClass = level === 'strong'
    ? (bias === 'bull' ? 'bg-bull/20 text-bull' : bias === 'bear' ? 'bg-bear/20 text-bear' : 'bg-neutral/20 text-neutral')
    : level === 'moderate'
      ? 'bg-warn/20 text-warn'
      : 'bg-neutral/10 text-theme-muted'

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums ${bgClass}`}>
      {score}
      <span className="text-[9px] font-normal opacity-70">
        {bias === 'bull' ? '▲' : bias === 'bear' ? '▼' : '—'}
      </span>
    </span>
  )
}

function SymbolRow({ symbol, setup, isActive, isLoading, onSelect }) {
  if (isLoading) {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <span className="text-xs font-mono font-semibold text-theme-muted w-14 shrink-0">{symbol}</span>
        <div className="flex-1 flex justify-end">
          <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </li>
    )
  }

  if (!setup) {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <span className="text-xs font-mono font-semibold text-theme-muted w-14 shrink-0">{symbol}</span>
        <span className="flex-1 text-right text-[11px] text-theme-muted">No data</span>
      </li>
    )
  }

  const { price, confluence, dayType, rsiValue, atrPct } = setup

  return (
    <li className="hover:bg-theme-hover transition-colors">
      <button
        onClick={() => onSelect(symbol)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
      >
        {/* Symbol */}
        <span className={`text-xs font-mono font-semibold w-14 shrink-0 ${
          isActive ? 'text-accent' : 'text-theme'
        }`}>
          {symbol}
        </span>

        {/* Price */}
        <span className="text-[11px] font-mono text-theme-muted w-16 text-right shrink-0">
          {price.toFixed(2)}
        </span>

        {/* Confluence score badge */}
        <div className="shrink-0">
          <ScoreBadge
            score={confluence.score}
            bias={confluence.bias}
            level={confluence.level}
          />
        </div>

        {/* Mini indicators strip */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          {/* Day type chip */}
          {dayType && (
            <span className={`text-[9px] font-mono px-1 py-0.5 rounded truncate max-w-[80px] ${
              dayType.type === 'trend-bull' ? 'text-bull bg-bull/10'
                : dayType.type === 'trend-bear' ? 'text-bear bg-bear/10'
                  : dayType.type === 'chop' ? 'text-warn bg-warn/10'
                    : 'text-theme-muted bg-neutral/10'
            }`}>
              {dayType.type === 'trend-bull' ? 'Trend ▲'
                : dayType.type === 'trend-bear' ? 'Trend ▼'
                  : dayType.type === 'chop' ? 'Chop'
                    : 'Range'}
            </span>
          )}

          {/* RSI value */}
          {rsiValue != null && (
            <span className={`text-[9px] font-mono ${
              rsiValue > 70 ? 'text-bear' : rsiValue < 30 ? 'text-bull' : 'text-theme-muted'
            }`}>
              RSI {Math.round(rsiValue)}
            </span>
          )}

          {/* ATR % consumed */}
          {atrPct != null && (
            <span className={`text-[9px] font-mono ${
              atrPct > 80 ? 'text-bear' : atrPct > 50 ? 'text-warn' : 'text-theme-muted'
            }`}>
              ATR {Math.round(atrPct)}%
            </span>
          )}
        </div>
      </button>
    </li>
  )
}

export function ScreenerPanel() {
  const [symbols, setSymbols] = useState(loadWatchlist)
  const [newSymbol, setNewSymbol] = useState('')
  const setSymbol = useChartStore((s) => s.setSymbol)
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)
  const { results, isLoading } = useScreener(symbols)

  function addSymbol(e) {
    e.preventDefault()
    const s = newSymbol.trim().toUpperCase()
    if (!s || !SYMBOL_RE.test(s) || symbols.includes(s)) return
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

  // Count active setups (score >= 45 = moderate or strong)
  const activeCount = results.filter((r) => r.setup?.confluence?.score >= 45).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-theme-muted">{symbols.length} symbols</span>
          {activeCount > 0 && (
            <span className="text-[10px] font-mono font-bold text-accent bg-accent-dim px-1.5 py-0.5 rounded">
              {activeCount} active
            </span>
          )}
        </div>
        {isLoading && (
          <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Results list — sorted by confluence score */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-theme">
          {results.map((r) => (
            <SymbolRow
              key={r.symbol}
              symbol={r.symbol}
              setup={r.setup}
              isActive={r.symbol === selectedSymbol}
              isLoading={r.isLoading}
              onSelect={setSymbol}
            />
          ))}
        </ul>

        {results.length === 0 && !isLoading && (
          <div className="px-4 py-8 text-center text-[11px] text-theme-muted">
            Add symbols to scan for setups
          </div>
        )}
      </div>

      {/* Reasons for top result */}
      {results[0]?.setup?.confluence?.reasons?.length > 0 && (
        <div className="px-4 py-2 border-t border-theme shrink-0">
          <div className="text-[10px] text-theme-muted mb-1 font-semibold">
            Top setup: {results[0].symbol}
          </div>
          {results[0].setup.confluence.reasons.slice(0, 3).map((r, i) => (
            <div key={i} className="text-[9px] text-theme-muted opacity-70 truncate">
              + {r}
            </div>
          ))}
          {results[0].setup.confluence.warnings.slice(0, 2).map((w, i) => (
            <div key={i} className="text-[9px] text-warn opacity-70 truncate">
              ! {w}
            </div>
          ))}
        </div>
      )}

      {/* Add / remove symbols */}
      <div className="px-4 py-2 border-t border-theme shrink-0">
        <div className="flex flex-wrap gap-1 mb-2">
          {symbols.map((sym) => (
            <button
              key={sym}
              onClick={() => removeSymbol(sym)}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-theme-mid text-theme-muted hover:border-bear hover:text-bear transition-colors"
              title={`Remove ${sym}`}
            >
              {sym} ×
            </button>
          ))}
        </div>
        <form onSubmit={addSymbol} className="flex gap-2">
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
    </div>
  )
}
