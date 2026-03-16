/**
 * ConfluenceBar — Setup quality readout: traffic light + expandable breakdown.
 *
 * Shows a compact pill with score, bias dot, and level label.
 * Click to expand a breakdown of reasons + warnings from confluenceScore().
 *
 * Positioned in the chart sub-header between PriceDisplay and DayTypeBanner.
 */

import { useState } from 'react'
import { SIGNAL_COLORS } from '../../constants/chart'

const LEVEL_COLORS = SIGNAL_COLORS

const BIAS_LABELS = {
  bull:    'Bullish',
  bear:    'Bearish',
  neutral: 'Neutral',
}

export function ConfluenceBar({ confluence }) {
  const [expanded, setExpanded] = useState(false)

  if (!confluence || confluence.level === 'none') return null

  const { score, bias, level, reasons, warnings } = confluence
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS.none
  const biasLabel = BIAS_LABELS[bias] ?? 'Neutral'

  return (
    <div className="relative">
      {/* Compact pill — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={`Confluence: ${score} out of 100, ${biasLabel}, ${level}`}
        className="flex items-center gap-2 px-3 py-1 rounded text-xs font-mono font-bold tracking-wide transition-colors hover:bg-theme-hover"
        style={{
          backgroundColor: `${color}12`,
          border: `1px solid ${color}33`,
          color,
        }}
        title="Click to expand confluence breakdown"
      >
        {/* Traffic light dot */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />

        {/* Score + label */}
        <span>{score}</span>
        <span className="text-theme-muted font-normal">
          {biasLabel} · {level}
        </span>

        {/* Expand chevron */}
        <svg
          className={`w-3 h-3 text-theme-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded breakdown dropdown */}
      {expanded && (
        <div
          className="absolute top-full left-0 mt-1 z-50 w-72 rounded-lg border border-theme-mid shadow-xl font-mono text-xs"
          style={{ backgroundColor: 'var(--bg-surface, #0d1117)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b border-theme-mid rounded-t-lg"
            style={{ backgroundColor: `${color}08` }}
          >
            <span className="font-bold" style={{ color }}>
              Confluence: {score}/100
            </span>
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {level.toUpperCase()}
            </span>
          </div>

          {/* Reasons (green checks) */}
          {reasons.length > 0 && (
            <div className="px-3 py-2 space-y-1">
              {reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-theme">
                  <span className="text-bull shrink-0 mt-px">✓</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings (yellow caution) */}
          {warnings.length > 0 && (
            <div className="px-3 py-2 space-y-1 border-t border-theme">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-theme-muted">
                  <span className="text-warn shrink-0 mt-px">⚠</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
