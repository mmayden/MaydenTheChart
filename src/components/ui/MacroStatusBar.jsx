/**
 * MacroStatusBar — Minervini-style macro health display.
 *
 * Shows QQQ's position relative to its 50-day and 200-day SMAs.
 * Gives context for every intraday signal — a bull setup in a bear macro
 * carries extra risk.
 *
 * Receives pre-computed { price, sma50, sma200 } from parent.
 * Parent fetches daily bars separately (200+ days needed).
 */

export function MacroStatusBar({ price, sma50, sma200 }) {
  if (!price || !sma50 || !sma200) return null

  const aboveSma50  = price > sma50
  const aboveSma200 = price > sma200
  const ma50Rising  = sma50 > sma200   // rough proxy for trend direction

  let status, color, label

  if (aboveSma50 && aboveSma200 && ma50Rising) {
    status = 'bull'
    color  = '#22c55e'
    label  = 'Bull Trend'
  } else if (!aboveSma200) {
    status = 'bear'
    color  = '#ef4444'
    label  = 'Bear Trend'
  } else {
    status = 'neutral'
    color  = '#eab308'
    label  = 'Mixed'
  }

  const pctFrom50  = ((price - sma50)  / sma50  * 100).toFixed(1)
  const pctFrom200 = ((price - sma200) / sma200 * 100).toFixed(1)
  const sign50     = pctFrom50  >= 0 ? '+' : ''
  const sign200    = pctFrom200 >= 0 ? '+' : ''

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      {/* Status pill */}
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-bold tracking-wide">{label}</span>
      </div>

      {/* MA distances */}
      <span className="text-gray-600">
        50MA <span style={{ color: aboveSma50 ? '#22c55e' : '#ef4444' }}>
          {sign50}{pctFrom50}%
        </span>
      </span>
      <span className="text-gray-600">
        200MA <span style={{ color: aboveSma200 ? '#22c55e' : '#ef4444' }}>
          {sign200}{pctFrom200}%
        </span>
      </span>
    </div>
  )
}
