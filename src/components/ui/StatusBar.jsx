/**
 * StatusBar — Shows market open/closed status, WebSocket connection state,
 * and last data refresh time.
 */

import { useChartStore } from '../../store/useChartStore'

export function StatusBar({ lastUpdated }) {
  const wsStatus = useChartStore((s) => s.wsStatus)
  const isMarketOpen = useChartStore((s) => s.isMarketOpen)

  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
      })
    : null

  // Determine dot color and label based on market + WS state
  let dotClass, label
  if (!isMarketOpen) {
    dotClass = 'bg-gray-600'
    label = 'Market Closed'
  } else if (wsStatus === 'subscribed') {
    dotClass = 'bg-green-400 animate-pulse'
    label = 'Live'
  } else if (wsStatus === 'connecting' || wsStatus === 'authenticated') {
    dotClass = 'bg-yellow-400 animate-pulse'
    label = 'Connecting…'
  } else if (wsStatus === 'error') {
    dotClass = 'bg-red-400'
    label = 'Reconnecting…'
  } else {
    // Market open but WS disconnected (shouldn't last long)
    dotClass = 'bg-green-400 animate-pulse'
    label = 'Market Open'
  }

  const labelColor = !isMarketOpen
    ? 'text-gray-500'
    : wsStatus === 'subscribed'
      ? 'text-green-400'
      : wsStatus === 'error'
        ? 'text-red-400'
        : wsStatus === 'connecting' || wsStatus === 'authenticated'
          ? 'text-yellow-400'
          : 'text-green-400'

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span className={labelColor}>{label}</span>
      </div>
      {timeStr && (
        <span className="text-gray-400">
          Updated {timeStr} ET
        </span>
      )}
    </div>
  )
}
