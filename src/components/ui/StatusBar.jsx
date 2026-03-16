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
    </div>
  )
}
