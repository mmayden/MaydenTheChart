/**
 * ReplayPanel — Trade replay controls.
 *
 * User picks a date, loads that day's bars, then steps through bar-by-bar
 * with play/pause/speed controls. Can place simulated buy/sell trades
 * with running P&L tracking.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChartStore } from '../../store/useChartStore'
import { useReplayStore } from '../../store/useReplayStore'
import { fetchBars } from '../../services/dataProvider'
import { log } from '../../utils/logger'

const SPEEDS = [1, 2, 5, 10]

/** Format unix timestamp to HH:MM AM/PM ET. */
function formatTime(unixTime) {
  if (!unixTime) return '--:--'
  const d = new Date(unixTime * 1000)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
}

/** Format a date string as YYYY-MM-DD for input[type=date]. */
function todayStr() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

/** Get a reasonable default date (last weekday). */
function defaultDate() {
  const d = new Date()
  const day = d.getDay()
  // If Sunday (0) go back 2 days, Saturday (6) go back 1, else use today
  if (day === 0) d.setDate(d.getDate() - 2)
  else if (day === 6) d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function ReplayPanel() {
  const symbol = useChartStore((s) => s.selectedSymbol)

  const isReplaying  = useReplayStore((s) => s.isReplaying)
  const replayBars   = useReplayStore((s) => s.replayBars)
  const currentStep  = useReplayStore((s) => s.currentStep)
  const speed        = useReplayStore((s) => s.speed)
  const isPlaying    = useReplayStore((s) => s.isPlaying)
  const openPosition = useReplayStore((s) => s.openPosition)
  const trades       = useReplayStore((s) => s.trades)

  const startReplay  = useReplayStore((s) => s.startReplay)
  const stopReplay   = useReplayStore((s) => s.stopReplay)
  const stepForward  = useReplayStore((s) => s.stepForward)
  const stepBack     = useReplayStore((s) => s.stepBack)
  const jumpToStart  = useReplayStore((s) => s.jumpToStart)
  const jumpToEnd    = useReplayStore((s) => s.jumpToEnd)
  const setSpeed     = useReplayStore((s) => s.setSpeed)
  const togglePlay   = useReplayStore((s) => s.togglePlay)
  const placeBuy     = useReplayStore((s) => s.placeBuy)
  const placeSell    = useReplayStore((s) => s.placeSell)

  const [date, setDate]       = useState(defaultDate)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const intervalRef = useRef(null)

  // Auto-advance timer
  useEffect(() => {
    if (isPlaying && isReplaying) {
      const ms = Math.max(50, 1000 / speed)
      intervalRef.current = setInterval(stepForward, ms)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, isReplaying, speed, stepForward])

  // Keyboard controls during replay
  useEffect(() => {
    if (!isReplaying) return
    function handler(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        stepForward()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        stepBack()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isReplaying, togglePlay, stepForward, stepBack])

  const handleStart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch full day's 5min bars for the selected date
      const start = `${date}T09:30:00-04:00`
      const end   = `${date}T16:00:00-04:00`
      const bars = await fetchBars(symbol, '5Min', start, end, 500)
      if (!bars?.length) {
        setError('No bars found for this date. Try a trading day.')
        setLoading(false)
        return
      }
      startReplay(bars)
    } catch (err) {
      log.error('Replay', 'Failed to fetch replay bars', err)
      setError('Failed to load bars. Check your connection.')
    }
    setLoading(false)
  }, [date, symbol, startReplay])

  const currentBar  = replayBars[currentStep]
  const pnl         = useReplayStore.getState().getRunningPnL()
  const stats       = useReplayStore.getState().getStats()

  // Setup view (not replaying)
  if (!isReplaying) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="text-xs text-theme-muted">
          Step through a historical day bar-by-bar. Practice entries and exits with simulated trades.
        </div>

        {/* Date picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-theme-muted">Date</label>
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="bg-input border border-theme-mid rounded px-3 py-2 text-sm font-mono text-theme focus:border-accent focus:outline-none"
          />
        </div>

        {/* Symbol display */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-theme-muted">Symbol:</span>
          <span className="text-sm font-bold" style={{ color: 'var(--symbol-color)' }}>{symbol}</span>
          <span className="text-xs text-theme-muted ml-auto">5m bars</span>
        </div>

        {error && (
          <div className="text-xs text-bear bg-bear/10 rounded px-3 py-2">{error}</div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="btn-primary rounded px-4 py-2.5 text-sm font-semibold"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading…
            </span>
          ) : (
            'Start Replay'
          )}
        </button>
      </div>
    )
  }

  // Replay controls view
  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Bar info */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-theme-muted font-mono">
          Bar {currentStep + 1}/{replayBars.length}
        </div>
        <div className="text-xs text-theme-muted font-mono">
          {formatTime(currentBar?.time)}
        </div>
      </div>

      {/* Current price */}
      {currentBar && (
        <div className="text-center py-1">
          <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--symbol-color)' }}>
            ${currentBar.close.toFixed(2)}
          </span>
        </div>
      )}

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-1">
        <button onClick={jumpToStart} className="replay-btn" title="Jump to start">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
        </button>
        <button onClick={stepBack} className="replay-btn" title="Step back (←)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6l8.5 6L6 18zm9 12V6h2v12z" transform="scale(-1,1) translate(-24,0)" /></svg>
        </button>
        <button onClick={togglePlay} className="replay-btn-primary" title="Play/Pause (Space)">
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <button onClick={stepForward} className="replay-btn" title="Step forward (→)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6l8.5 6L6 18zm9 12V6h2v12z" /></svg>
        </button>
        <button onClick={jumpToEnd} className="replay-btn" title="Jump to end">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6l8.5 6L6 18zM16 6h2v12h-2z" /></svg>
        </button>
      </div>

      {/* Speed selector */}
      <div className="flex items-center justify-center gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={[
              'px-2 py-1 text-xs font-mono rounded border transition-colors',
              speed === s
                ? 'border-accent text-accent bg-accent-dim'
                : 'border-theme-mid text-theme-muted hover:border-theme-mid hover:bg-theme-hover',
            ].join(' ')}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-theme" />

      {/* Trade buttons */}
      <div className="flex gap-2">
        <button
          onClick={placeBuy}
          disabled={!!openPosition}
          className={[
            'flex-1 py-2.5 rounded text-sm font-bold transition-colors',
            openPosition
              ? 'bg-neutral/20 text-theme-muted cursor-not-allowed'
              : 'bg-bull/20 text-bull hover:bg-bull/30 border border-bull/40',
          ].join(' ')}
        >
          BUY {currentBar ? `$${currentBar.close.toFixed(2)}` : ''}
        </button>
        <button
          onClick={placeSell}
          disabled={!openPosition}
          className={[
            'flex-1 py-2.5 rounded text-sm font-bold transition-colors',
            !openPosition
              ? 'bg-neutral/20 text-theme-muted cursor-not-allowed'
              : 'bg-bear/20 text-bear hover:bg-bear/30 border border-bear/40',
          ].join(' ')}
        >
          SELL {currentBar ? `$${currentBar.close.toFixed(2)}` : ''}
        </button>
      </div>

      {/* Open position */}
      {openPosition && currentBar && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded border border-theme-mid text-xs font-mono">
          <span className="text-theme-muted">Open @ ${openPosition.entryPrice.toFixed(2)}</span>
          <span className={((currentBar.close - openPosition.entryPrice) >= 0) ? 'text-bull' : 'text-bear'}>
            {((currentBar.close - openPosition.entryPrice) / openPosition.entryPrice * 100).toFixed(2)}%
          </span>
        </div>
      )}

      {/* Running P&L */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-theme-muted">P&L</span>
        <span className={`text-sm font-bold tabular-nums ${pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
        </span>
      </div>

      {/* Divider */}
      {trades.length > 0 && <div className="border-t border-theme" />}

      {/* Trade history */}
      {trades.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-theme-muted font-semibold">Trade History</span>
          <div className="max-h-32 overflow-y-auto flex flex-col gap-0.5">
            {trades.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono px-1">
                <span className="text-theme-muted">
                  {formatTime(replayBars[t.entryStep]?.time)} → {formatTime(replayBars[t.exitStep]?.time)}
                </span>
                <span className={t.pnlPct >= 0 ? 'text-bull' : 'text-bear'}>
                  {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats summary */}
      {stats.count > 0 && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded text-xs font-mono" style={{ backgroundColor: 'var(--hover-bg)' }}>
          <span>{stats.count} trades</span>
          <span>{stats.winRate}% win</span>
          <span className={stats.totalPnl >= 0 ? 'text-bull' : 'text-bear'}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Stop button */}
      <button
        onClick={stopReplay}
        className="mt-1 px-4 py-2 rounded text-xs font-mono font-semibold border border-theme-mid text-theme-muted hover:text-bear hover:border-bear/40 transition-colors"
      >
        Stop Replay
      </button>
    </div>
  )
}
