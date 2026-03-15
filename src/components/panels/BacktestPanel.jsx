/**
 * BacktestPanel — Backtest results in right panel format.
 *
 * Strategies: ORB Breakout, EMA Cross, VWAP Bounce.
 * Features: configurable params, equity curve, day type breakdown.
 * Uses the same indicator math as the live chart (no duplicate logic).
 */

import { useState, useMemo } from 'react'
import { useChartStore } from '../../store/useChartStore'
import { useAlpacaBars } from '../../hooks/useAlpacaBars'
import {
  backtestORB,
  backtestEMACross,
  backtestVWAPBounce,
  enrichTradesWithDayType,
  statsByDayType,
  equityCurve,
} from '../../utils/backtest'

const STRATEGIES = [
  { id: 'orb',        label: 'ORB' },
  { id: 'ema-cross',  label: 'EMA Cross' },
  { id: 'vwap',       label: 'VWAP Bounce' },
]

const DAY_TYPE_LABELS = {
  'trend-bull': { label: 'Trend Bull', color: '#22c55e' },
  'trend-bear': { label: 'Trend Bear', color: '#ef4444' },
  'chop':       { label: 'Chop',       color: '#eab308' },
  'range':      { label: 'Range',      color: '#6b7280' },
  'unknown':    { label: 'Unknown',    color: '#4b5563' },
}

function StatRow({ label, value, positive }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-theme-muted">{label}</span>
      <span className={`text-xs font-mono font-semibold ${
        positive === true ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-theme'
      }`}>
        {value}
      </span>
    </div>
  )
}

function MiniEquityCurve({ curve }) {
  if (!curve?.length || curve.length < 2) return null

  const values = curve.map((c) => c.cumPnl)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const w = 280
  const h = 48
  const points = curve.map((c, i) => {
    const x = (i / (curve.length - 1)) * w
    const y = h - ((c.cumPnl - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')

  const lastVal = values[values.length - 1]
  const color = lastVal >= 0 ? '#22c55e' : '#ef4444'

  return (
    <div className="px-4 py-2 border-b border-theme">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-theme-muted uppercase tracking-widest">Equity Curve</span>
        <span className={`text-xs font-mono font-semibold ${lastVal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {lastVal >= 0 ? '+' : ''}{lastVal}%
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Zero line */}
        <line
          x1="0"
          y1={h - ((0 - min) / range) * (h - 4) - 2}
          x2={w}
          y2={h - ((0 - min) / range) * (h - 4) - 2}
          stroke="#374151"
          strokeWidth="0.5"
          strokeDasharray="4,3"
        />
      </svg>
    </div>
  )
}

function DayTypeBreakdown({ breakdown }) {
  if (!breakdown || Object.keys(breakdown).length === 0) return null

  return (
    <div className="px-4 py-2 border-t border-theme">
      <div className="text-[10px] text-theme-muted uppercase tracking-widest mb-2">By Day Type</div>
      <div className="space-y-2">
        {Object.entries(breakdown).map(([dt, s]) => {
          const cfg = DAY_TYPE_LABELS[dt] ?? DAY_TYPE_LABELS.unknown
          if (s.totalTrades === 0) return null
          return (
            <div key={dt} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="text-theme-muted w-20 shrink-0">{cfg.label}</span>
              <span className="text-theme font-mono">{s.totalTrades}t</span>
              <span className={`font-mono font-semibold ${s.winRate > 50 ? 'text-green-400' : 'text-red-400'}`}>
                {s.winRate}%
              </span>
              <span className={`font-mono ml-auto ${s.totalPnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {s.totalPnlPct >= 0 ? '+' : ''}{s.totalPnlPct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function BacktestPanel() {
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)
  const [strategy, setStrategy] = useState('orb')
  const [volumeFilter, setVolumeFilter] = useState(false)
  const [requireTrend, setRequireTrend] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { data: bars } = useAlpacaBars()

  const results = useMemo(() => {
    if (!bars?.length) return null
    let res = null
    if (strategy === 'orb') res = backtestORB(bars, { requireVolume: volumeFilter })
    else if (strategy === 'ema-cross') res = backtestEMACross(bars)
    else if (strategy === 'vwap') res = backtestVWAPBounce(bars, { requireTrend })
    if (!res) return null

    // Enrich all trades with day type for breakdown
    res.trades = enrichTradesWithDayType(bars, res.trades)
    return res
  }, [bars, strategy, volumeFilter, requireTrend])

  const stats = results?.stats
  const curve = useMemo(() => results?.trades ? equityCurve(results.trades) : null, [results])
  const breakdown = useMemo(() => results?.trades ? statsByDayType(results.trades) : null, [results])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Strategy selector */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-theme">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStrategy(s.id)}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${
              strategy === s.id
                ? 'text-accent bg-accent-dim'
                : 'text-theme-muted hover:text-theme hover:bg-theme-hover'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Strategy-specific filters */}
      {(strategy === 'orb' || strategy === 'vwap') && (
        <div className="px-4 py-2 border-b border-theme space-y-1.5">
          {strategy === 'orb' && (
            <label className="flex items-center gap-2 text-xs text-theme-muted cursor-pointer">
              <input
                type="checkbox"
                checked={volumeFilter}
                onChange={(e) => setVolumeFilter(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Require RVOL ≥ 1.5x
            </label>
          )}
          {strategy === 'vwap' && (
            <label className="flex items-center gap-2 text-xs text-theme-muted cursor-pointer">
              <input
                type="checkbox"
                checked={requireTrend}
                onChange={(e) => setRequireTrend(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Require aligned day type
            </label>
          )}
        </div>
      )}

      {/* Equity curve */}
      {curve && curve.length >= 2 && <MiniEquityCurve curve={curve} />}

      {/* Results */}
      <div className="px-4 py-3 flex-1">
        {!stats || stats.totalTrades === 0 ? (
          <p className="text-center text-theme-muted text-xs py-8">
            {!bars?.length ? 'Load chart data to run backtest' : `No trades found for ${selectedSymbol}`}
          </p>
        ) : (
          <>
            <div className="text-[10px] text-theme-muted uppercase tracking-widest mb-2">
              {selectedSymbol} — {stats.totalTrades} trades
            </div>

            <div className="divide-y divide-theme">
              <StatRow label="Win Rate" value={`${stats.winRate}%`} positive={stats.winRate > 50} />
              <StatRow label="Risk:Reward" value={`${stats.riskReward}:1`} positive={stats.riskReward > 1} />
              <StatRow label="Total P&L" value={`${stats.totalPnlPct > 0 ? '+' : ''}${stats.totalPnlPct}%`} positive={stats.totalPnlPct > 0} />
              <StatRow label="Profit Factor" value={stats.profitFactor} positive={stats.profitFactor > 1} />
              <StatRow label="Avg Win" value={`+${stats.avgWin}%`} positive={true} />
              <StatRow label="Avg Loss" value={`${stats.avgLoss}%`} positive={false} />
              <StatRow label="Best Trade" value={`+${stats.maxWin}%`} positive={true} />
              <StatRow label="Worst Trade" value={`${stats.maxLoss}%`} positive={false} />
            </div>

            {/* Day type breakdown toggle */}
            <button
              onClick={() => setShowBreakdown((b) => !b)}
              className="mt-3 w-full py-1.5 text-[11px] text-theme-muted hover:text-theme font-semibold rounded border border-theme-mid hover:border-theme-mid transition-colors"
            >
              {showBreakdown ? 'Hide' : 'Show'} Day Type Breakdown
            </button>

            {/* Recent trades */}
            <div className="mt-4">
              <div className="text-[10px] text-theme-muted uppercase tracking-widest mb-2">Recent Trades</div>
              <div className="max-h-48 overflow-y-auto">
                {results.trades.slice(-10).reverse().map((t, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-theme/30 text-xs">
                    <span className="text-theme-muted font-mono w-16 shrink-0">{t.date}</span>
                    <span className={`w-10 shrink-0 ${t.type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'long' ? 'LONG' : 'SHORT'}
                    </span>
                    {t.dayType && DAY_TYPE_LABELS[t.dayType] && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: DAY_TYPE_LABELS[t.dayType].color }}
                        title={DAY_TYPE_LABELS[t.dayType].label}
                      />
                    )}
                    <span className="flex-1" />
                    <span className={`font-mono font-semibold ${
                      t.pnlPct > 0 ? 'text-green-400' : t.pnlPct < 0 ? 'text-red-400' : 'text-theme-muted'
                    }`}>
                      {t.pnlPct > 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Day type breakdown (collapsible) */}
      {showBreakdown && stats?.totalTrades > 0 && <DayTypeBreakdown breakdown={breakdown} />}
    </div>
  )
}
