/**
 * JournalPanel — Trade journal with analytics in right panel format.
 *
 * Log trades with: symbol, setup type, result, notes, rating.
 * Analytics: win rate by setup, current/longest streak, rating correlation.
 * Filter by result (All/Win/Loss) and setup type.
 * Persisted to localStorage via useJournalStore.
 */

import { useState, useMemo } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { useChartStore } from '../../store/useChartStore'

const SETUPS = ['ORB Breakout', 'EMA Cross', 'VWAP Bounce', 'S/R Level', 'Gap Fill', 'Other']
const RESULTS = ['win', 'loss', 'breakeven']
const FILTER_TABS = ['All', 'Win', 'Loss']

function computeStreaks(entries) {
  const sorted = [...entries]
    .filter((e) => e.result === 'win' || e.result === 'loss')
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (sorted.length === 0) return { current: 0, currentType: null, longest: 0, longestType: null }

  let current = 1
  let currentType = sorted[sorted.length - 1].result
  let longest = 1
  let longestType = sorted[0].result
  let streak = 1
  let streakType = sorted[0].result

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].result === sorted[i - 1].result) {
      streak++
    } else {
      streak = 1
      streakType = sorted[i].result
    }
    if (streak > longest) {
      longest = streak
      longestType = streakType
    }
  }

  // Current streak from end
  current = 1
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (sorted[i].result === currentType) current++
    else break
  }

  return { current, currentType, longest, longestType }
}

function computeSetupStats(entries) {
  const filtered = entries.filter((e) => e.result && e.setup)
  const groups = {}
  for (const e of filtered) {
    if (!groups[e.setup]) groups[e.setup] = { total: 0, wins: 0 }
    groups[e.setup].total++
    if (e.result === 'win') groups[e.setup].wins++
  }
  return Object.entries(groups)
    .map(([setup, s]) => ({
      setup,
      total: s.total,
      wins: s.wins,
      winRate: parseFloat(((s.wins / s.total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.total - a.total)
}

function computeRatingCorrelation(entries) {
  const rated = entries.filter((e) => e.rating && e.result)
  if (rated.length < 3) return null

  const groups = {}
  for (const e of rated) {
    if (!groups[e.rating]) groups[e.rating] = { total: 0, wins: 0 }
    groups[e.rating].total++
    if (e.result === 'win') groups[e.rating].wins++
  }

  return Object.entries(groups)
    .map(([r, s]) => ({
      rating: parseInt(r),
      total: s.total,
      winRate: parseFloat(((s.wins / s.total) * 100).toFixed(1)),
    }))
    .sort((a, b) => a.rating - b.rating)
}

export function JournalPanel() {
  const { entries, addEntry, removeEntry } = useJournalStore()
  const selectedSymbol    = useChartStore((s) => s.selectedSymbol)
  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)

  const [showForm, setShowForm] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [filterResult, setFilterResult] = useState('All')
  const [filterSetup, setFilterSetup] = useState(null)
  const [symbol, setSymbol]     = useState(selectedSymbol)
  const [setup, setSetup]       = useState(SETUPS[0])
  const [result, setResult]     = useState('win')
  const [notes, setNotes]       = useState('')
  const [rating, setRating]     = useState(3)

  const filteredEntries = useMemo(() => {
    let list = entries
    if (filterResult !== 'All') {
      list = list.filter((e) => e.result === filterResult.toLowerCase())
    }
    if (filterSetup) {
      list = list.filter((e) => e.setup === filterSetup)
    }
    return list
  }, [entries, filterResult, filterSetup])

  const analytics = useMemo(() => {
    if (entries.length === 0) return null
    const all = entries.filter((e) => e.result)
    const wins = all.filter((e) => e.result === 'win').length
    return {
      total: all.length,
      winRate: all.length > 0 ? parseFloat(((wins / all.length) * 100).toFixed(1)) : 0,
      streaks: computeStreaks(all),
      bySetup: computeSetupStats(all),
      ratingCorr: computeRatingCorrelation(entries),
    }
  }, [entries])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmedSymbol = symbol.trim().toUpperCase()
    if (!trimmedSymbol) return
    addEntry({
      symbol: trimmedSymbol,
      timeframe: selectedTimeframe,
      setup,
      result,
      notes: notes.trim(),
      rating,
    })
    setNotes('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header: stats + buttons */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
        <span className="text-[11px] text-theme-muted">
          {entries.length} entries{analytics ? ` — ${analytics.winRate}% win rate` : ''}
        </span>
        <div className="flex gap-1.5">
          {entries.length > 0 && (
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                showAnalytics
                  ? 'text-accent bg-accent-dim border border-accent/30'
                  : 'text-theme-muted border border-theme-mid hover:text-theme hover:border-theme-mid'
              }`}
            >
              Stats
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-2.5 py-1 text-[11px] font-semibold rounded btn-primary text-white transition-colors"
          >
            {showForm ? 'Cancel' : '+ Log'}
          </button>
        </div>
      </div>

      {/* Analytics panel */}
      {showAnalytics && analytics && (
        <div className="px-4 py-3 border-b border-theme space-y-3 shrink-0">
          {/* Streaks */}
          <div>
            <div className="text-[10px] text-theme-muted uppercase tracking-widest mb-1.5">Streaks</div>
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-theme-muted">Current: </span>
                <span className={`font-mono font-semibold ${
                  analytics.streaks.currentType === 'win' ? 'text-bull' : 'text-bear'
                }`}>
                  {analytics.streaks.current} {analytics.streaks.currentType === 'win' ? 'W' : 'L'}
                </span>
              </div>
              <div>
                <span className="text-theme-muted">Best: </span>
                <span className={`font-mono font-semibold ${
                  analytics.streaks.longestType === 'win' ? 'text-bull' : 'text-bear'
                }`}>
                  {analytics.streaks.longest} {analytics.streaks.longestType === 'win' ? 'W' : 'L'}
                </span>
              </div>
            </div>
          </div>

          {/* Win rate by setup */}
          {analytics.bySetup.length > 0 && (
            <div>
              <div className="text-[10px] text-theme-muted uppercase tracking-widest mb-1.5">By Setup</div>
              <div className="space-y-1">
                {analytics.bySetup.map((s) => (
                  <button
                    key={s.setup}
                    onClick={() => setFilterSetup(filterSetup === s.setup ? null : s.setup)}
                    className={`flex items-center w-full gap-2 text-xs py-0.5 rounded transition-colors ${
                      filterSetup === s.setup ? 'text-accent' : 'text-theme hover:text-theme'
                    }`}
                  >
                    <span className="truncate flex-1 text-left">{s.setup}</span>
                    <span className="text-theme-muted font-mono">{s.total}t</span>
                    <span className={`font-mono font-semibold w-12 text-right ${
                      s.winRate >= 50 ? 'text-bull' : 'text-bear'
                    }`}>
                      {s.winRate}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rating correlation */}
          {analytics.ratingCorr && (
            <div>
              <div className="text-[10px] text-theme-muted uppercase tracking-widest mb-1.5">Rating vs Win Rate</div>
              <div className="flex gap-1">
                {analytics.ratingCorr.map((r) => (
                  <div key={r.rating} className="flex-1 text-center">
                    <div className={`text-[11px] font-mono font-semibold ${
                      r.winRate >= 50 ? 'text-bull' : 'text-bear'
                    }`}>
                      {r.winRate}%
                    </div>
                    <div className="text-[10px] text-warn font-bold">{r.rating}</div>
                    <div className="text-[9px] text-theme-muted">{r.total}t</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add entry form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-theme space-y-2.5 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-theme-muted uppercase tracking-widest block mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-input border border-theme-mid rounded px-2 py-1.5 text-xs text-theme font-mono focus:outline-none focus:border-accent"
                maxLength={10}
              />
            </div>
            <div>
              <label className="text-[10px] text-theme-muted uppercase tracking-widest block mb-1">Setup</label>
              <select
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                className="w-full bg-input border border-theme-mid rounded px-2 py-1.5 text-xs text-theme focus:outline-none focus:border-accent"
              >
                {SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-theme-muted uppercase tracking-widest block mb-1">Result</label>
            <div className="flex gap-1">
              {RESULTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResult(r)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${
                    result === r
                      ? r === 'win' ? 'bg-bull/20 text-bull border border-bull/40'
                      : r === 'loss' ? 'bg-bear/20 text-bear border border-bear/40'
                      : 'bg-neutral/20 text-neutral border border-neutral/40'
                      : 'text-theme-muted border border-theme-mid hover:border-theme-mid'
                  }`}
                >
                  {r === 'breakeven' ? 'B/E' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-theme-muted uppercase tracking-widest block mb-1">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                    n <= rating
                      ? 'bg-warn/20 text-warn border border-warn/40'
                      : 'text-theme-muted border border-theme-mid'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes..."
            className="w-full bg-input border border-theme-mid rounded px-2 py-1.5 text-xs text-theme placeholder-theme-muted focus:outline-none focus:border-accent resize-none"
            rows={2}
          />

          <button
            type="submit"
            className="w-full btn-primary text-white text-xs font-bold py-2 rounded transition-colors"
          >
            Save Entry
          </button>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-theme shrink-0">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterResult(tab)}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
              filterResult === tab
                ? 'text-accent bg-accent-dim'
                : 'text-theme-muted hover:text-theme'
            }`}
          >
            {tab}
          </button>
        ))}
        {filterSetup && (
          <button
            onClick={() => setFilterSetup(null)}
            className="ml-auto px-2 py-1 text-[11px] text-theme-muted hover:text-theme transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <p className="text-center text-theme-muted text-xs py-8">
            {entries.length === 0 ? 'No entries yet. Log trades to track performance.' : 'No entries match filter.'}
          </p>
        ) : (
          <ul className="divide-y divide-theme">
            {filteredEntries.slice(0, 50).map((entry) => (
              <li key={entry.id} className="px-4 py-2.5 flex items-start gap-2">
                <span className={`shrink-0 mt-1 w-1.5 h-1.5 rounded-full ${
                  entry.result === 'win' ? 'bg-bull' : entry.result === 'loss' ? 'bg-bear' : 'bg-neutral'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-mono font-semibold">{entry.symbol}</span>
                    <span className="text-theme-muted truncate">{entry.setup}</span>
                    {entry.rating && (
                      <span className="text-warn text-[10px] font-bold">{entry.rating}/5</span>
                    )}
                    <span className={`font-semibold ml-auto shrink-0 ${
                      entry.result === 'win' ? 'text-bull' : entry.result === 'loss' ? 'text-bear' : 'text-neutral'
                    }`}>
                      {entry.result.toUpperCase()}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-[11px] text-theme-muted mt-0.5 line-clamp-1">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="shrink-0 text-theme-muted hover:text-bear text-xs transition-colors"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
