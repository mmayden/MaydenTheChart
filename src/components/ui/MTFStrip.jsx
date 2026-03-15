/**
 * MTFStrip — Multi-timeframe EMA alignment strip.
 *
 * Shows 5m | 15m | 1h | 4h | 1D as colored dots/pills:
 *   Green = EMA 9>48>200 (full bull stack)
 *   Red   = EMA 9<48<200 (full bear stack)
 *   Yellow = partial alignment (9+48 agree but 200 diverges)
 *   Gray  = mixed / no data
 *
 * Compact horizontal strip, fits in the chart sub-header or status bar.
 */

import { useMTFSignals } from '../../hooks/useMTFSignals'
import { SIGNAL_COLORS } from '../../constants/chart'

const ALIGNMENT_COLORS = SIGNAL_COLORS

const ALIGNMENT_BG = {
  bull:    'rgba(34,197,94,0.12)',
  bear:    'rgba(239,68,68,0.12)',
  neutral: 'rgba(107,114,128,0.08)',
}

export function MTFStrip() {
  const { signals, isLoading } = useMTFSignals()

  if (isLoading && !signals.some((s) => s.alignment)) return null

  return (
    <div className="flex items-center gap-1" role="status" aria-label="Multi-timeframe EMA alignment" title="Multi-timeframe EMA alignment">
      <span className="text-theme-muted text-xs font-mono mr-1 hidden sm:inline">MTF</span>
      {signals.map((s) => {
        const bias = s.alignment?.bias ?? 'neutral'
        const aligned = s.alignment?.aligned ?? false
        const color = ALIGNMENT_COLORS[bias] ?? ALIGNMENT_COLORS.neutral
        const bg = ALIGNMENT_BG[bias] ?? ALIGNMENT_BG.neutral

        return (
          <div
            key={s.key}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-semibold"
            style={{
              backgroundColor: bg,
              border: `1px solid ${color}33`,
              color,
              opacity: s.isLoading ? 0.4 : 1,
            }}
            title={`${s.label}: EMA ${aligned ? 'fully aligned' : 'partial'} ${bias}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}
