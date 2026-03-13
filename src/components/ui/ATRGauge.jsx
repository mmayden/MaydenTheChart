/**
 * ATRGauge — Fuel-gauge showing how much of today's ATR range has been consumed.
 *
 * < 50%:  green  — plenty of range, conditions good for breakout trades
 * 50-80%: yellow — getting extended, be selective
 * 80%+:   red    — late in range, Nick says "no reason to trade"
 * 100%+:  red + flashing — high volatility day, expect big move
 *
 * Receives pre-computed { atrValue, rangeUsed, percentConsumed } from parent.
 */

const ATR_COLORS = {
  dark:    { red: '#ef4444', yellow: '#eab308', green: '#22c55e' },
  loompia: { red: '#D44020', yellow: '#C85818', green: '#48B068' },
}

export function ATRGauge({ atrValue, rangeUsed, percentConsumed, theme = 'dark' }) {
  if (!atrValue || atrValue === 0) return null

  const pct     = Math.min(percentConsumed, 120)   // cap display at 120%
  const fillPct = Math.min(pct, 100)
  const { red, yellow, green } = ATR_COLORS[theme] ?? ATR_COLORS.dark

  const color = pct >= 80 ? red : pct >= 50 ? yellow : green

  const label = pct >= 100
    ? 'Extended!'
    : pct >= 80
    ? 'Late Range'
    : pct >= 50
    ? 'Mid Range'
    : 'Early Range'

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-gray-300 font-semibold tracking-wide">ATR Range</span>
        <span style={{ color }} className="font-bold text-sm">
          {percentConsumed.toFixed(0)}%
        </span>
      </div>

      {/* Gauge bar */}
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${fillPct}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-gray-300">
          {rangeUsed.toFixed(2)} / {atrValue.toFixed(2)}
        </span>
        <span style={{ color }} className="font-semibold">
          {label}
        </span>
      </div>
    </div>
  )
}
