/**
 * StatusBar — Shows market open/closed status, WebSocket connection state,
 * data source (Live WS vs REST polling), and last data refresh time.
 */

import { useMemo } from 'react'
import { useChartStore } from '../../store/useChartStore'
import { useJournalStore } from '../../store/useJournalStore'

/** Map market + WS state to visual properties. */
function getConnectionStatus(isMarketOpen, wsStatus) {
  if (!isMarketOpen) {
    return { dotClass: 'bg-neutral', label: 'Market Closed', sublabel: null, labelColor: 'text-theme-muted' }
  }
  if (wsStatus === 'subscribed') {
    return { dotClass: 'bg-bull animate-pulse', label: 'Live', sublabel: 'WebSocket', labelColor: 'text-bull' }
  }
  if (wsStatus === 'connecting' || wsStatus === 'authenticated') {
    return { dotClass: 'bg-warn animate-pulse', label: 'Connecting…', sublabel: 'WebSocket', labelColor: 'text-warn' }
  }
  if (wsStatus === 'error') {
    return { dotClass: 'bg-bear', label: 'Reconnecting…', sublabel: 'Polling', labelColor: 'text-bear' }
  }
  return { dotClass: 'bg-info', label: 'Market Open', sublabel: 'Polling', labelColor: 'text-info' }
}

export function StatusBar({ lastUpdated }) {
  const wsStatus = useChartStore((s) => s.wsStatus)
  const isMarketOpen = useChartStore((s) => s.isMarketOpen)
  const entries = useJournalStore((s) => s.entries)

  // Today's session stats from journal
  const sessionStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayEntries = entries.filter((e) => e.date?.startsWith(today) && e.result)
    if (todayEntries.length === 0) return null
    const wins = todayEntries.filter((e) => e.result === 'win').length
    const losses = todayEntries.filter((e) => e.result === 'loss').length
    return { trades: todayEntries.length, wins, losses }
  }, [entries])

  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
      })
    : null

  const { dotClass, label, sublabel, labelColor } = getConnectionStatus(isMarketOpen, wsStatus)

  return (
    <div className="flex items-center gap-3 text-xs font-mono" role="status" aria-label={`${label}${sessionStats ? `, Today: ${sessionStats.trades} trades, ${sessionStats.wins} wins, ${sessionStats.losses} losses` : ''}`}>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span className={labelColor}>{label}</span>
        {sublabel && (
          <span className="text-theme-muted">({sublabel})</span>
        )}
      </div>
      {timeStr && (
        <span className="text-theme-muted">
          Updated {timeStr} ET
        </span>
      )}

      {/* Session stats */}
      {sessionStats && (
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-theme-muted">Today:</span>
          <span className="text-theme">{sessionStats.trades}t</span>
          <span className="text-bull">{sessionStats.wins}W</span>
          <span className="text-bear">{sessionStats.losses}L</span>
        </div>
      )}

      {/* Ko-fi donate link */}
      <a
        href="https://ko-fi.com/cheechart"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex items-center gap-1 text-theme-muted hover:text-bear transition-colors shrink-0"
        aria-label="Support Cheechart on Ko-fi"
        title="Support Cheechart"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span className="hidden sm:inline">Donate</span>
      </a>
    </div>
  )
}
