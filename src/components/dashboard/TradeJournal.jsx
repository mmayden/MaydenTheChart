/**
 * TradeJournal — Trade logging and journaling card.
 *
 * Log trades with: symbol, setup type, result (win/loss/breakeven), notes, rating.
 * Persisted to localStorage via useJournalStore.
 * The #1 thing trading coaches recommend that no free tool integrates well.
 */

import { useState } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { useChartStore } from '../../store/useChartStore'

const SETUPS = ['ORB Breakout', 'EMA Cross', 'VWAP Bounce', 'S/R Level', 'Gap Fill', 'Other']
const RESULTS = ['win', 'loss', 'breakeven']

export function TradeJournal() {
  const { entries, addEntry, removeEntry } = useJournalStore()
  const selectedSymbol    = useChartStore((s) => s.selectedSymbol)
  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)

  const [showForm, setShowForm] = useState(false)
  const [symbol, setSymbol]     = useState(selectedSymbol)
  const [setup, setSetup]       = useState(SETUPS[0])
  const [result, setResult]     = useState('win')
  const [notes, setNotes]       = useState('')
  const [rating, setRating]     = useState(3)

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

  const stats = (() => {
    const all = entries.filter((e) => e.result)
    if (all.length === 0) return null
    const wins = all.filter((e) => e.result === 'win').length
    return { winRate: parseFloat(((wins / all.length) * 100).toFixed(1)) }
  })()

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-sm font-bold tracking-wide">Trade Journal</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {entries.length} entries
            {stats ? ` — ${stats.winRate}% win rate` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Trade'}
        </button>
      </div>

      {/* Add entry form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-5 py-4 border-b border-gray-800 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-100 font-mono focus:outline-none focus:border-blue-500"
                maxLength={10}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Setup</label>
              <select
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
              >
                {SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Result</label>
              <div className="flex gap-1">
                {RESULTS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResult(r)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${
                      result === r
                        ? r === 'win' ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : r === 'loss' ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                        : 'text-gray-500 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {r === 'breakeven' ? 'B/E' : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Rating (1-5)</label>
              <div className="flex gap-1 pt-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                      n <= rating
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                        : 'text-gray-600 border border-gray-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What worked? What didn't? What would you do differently?"
              className="w-full bg-[#0a0a0a] border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Save Entry
          </button>
        </form>
      )}

      {/* Entries list */}
      <div className="max-h-80 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-center text-gray-500 text-xs py-8">
            No journal entries yet. Start logging your trades to track performance.
          </p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {entries.slice(0, 20).map((entry) => (
              <li key={entry.id} className="px-5 py-3 flex items-start gap-3">
                <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                  entry.result === 'win' ? 'bg-green-400' : entry.result === 'loss' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold">{entry.symbol}</span>
                    <span className="text-gray-500">{entry.setup}</span>
                    <span className={`font-semibold ${
                      entry.result === 'win' ? 'text-green-400' : entry.result === 'loss' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {entry.result.toUpperCase()}
                    </span>
                    <span className="text-gray-600 ml-auto">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="shrink-0 text-gray-600 hover:text-red-400 text-xs transition-colors"
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
