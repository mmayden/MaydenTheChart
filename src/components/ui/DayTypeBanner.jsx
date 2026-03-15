/**
 * DayTypeBanner — Live banner showing current day type classification.
 *
 * Updates in real time as price breaks or holds previous day's H/L.
 * Based on Rule 1: the single most important daily level framework.
 *
 *   Trend Bull  — PDH broken, PDL held → green background
 *   Trend Bear  — PDL broken, PDH held → red background
 *   Chop        — both broken → orange background
 *   Range Day   — neither broken → gray background
 */

export function DayTypeBanner({ dayType }) {
  if (!dayType) return null

  const { label, color, type } = dayType

  const bgMap = {
    'trend-bull': 'rgba(34,197,94,0.12)',
    'trend-bear': 'rgba(239,68,68,0.12)',
    'chop':       'rgba(245,158,11,0.12)',
    'range':      'rgba(107,114,128,0.10)',
  }

  const bg = bgMap[type] ?? bgMap.range

  return (
    <div
      data-tour="day-type"
      className="flex items-center gap-2 px-3 py-1 rounded text-xs font-mono font-bold tracking-wide"
      style={{ backgroundColor: bg, color, border: `1px solid ${color}33` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  )
}
