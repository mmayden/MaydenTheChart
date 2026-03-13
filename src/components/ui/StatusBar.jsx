/**
 * StatusBar — Shows market open/closed status and last data refresh time.
 */

export function StatusBar({ lastUpdated }) {
  const now   = new Date()
  // Use Intl so EDT/EST is handled automatically — no hardcoded offset
  const nowET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const minuteOfDay = nowET.getHours() * 60 + nowET.getMinutes()

  // Market hours: 9:30 AM – 4:00 PM ET (570 – 960 minutes from midnight)
  const isMarketHours = minuteOfDay >= 570 && minuteOfDay < 960
  const isWeekend     = nowET.getDay() === 0 || nowET.getDay() === 6

  const marketOpen = isMarketHours && !isWeekend

  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
      })
    : null

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            marketOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
          }`}
        />
        <span className={marketOpen ? 'text-green-400' : 'text-gray-500'}>
          {marketOpen ? 'Market Open' : 'Market Closed'}
        </span>
      </div>
      {timeStr && (
        <span className="text-gray-400">
          Updated {timeStr} ET
        </span>
      )}
    </div>
  )
}
