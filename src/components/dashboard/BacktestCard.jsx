/**
 * BacktestCard — Backtest results display card.
 *
 * Shows stats from running the ORB or EMA-cross strategy
 * on historical data for the current symbol.
 */

import { useState, useMemo } from 'react'
import { useAlpacaBars } from '../../hooks/useAlpacaBars'
import { backtestORB, backtestEMACross } from '../../utils/backtest'

const STRATEGIES = [
  { id: 'orb',       label: 'ORB Breakout' },
  { id: 'ema-cross', label: 'EMA 9/48 Cross' },
]

function StatBox({ label, value, sub, positive }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg border border-gray-800">
      <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</span>
      <span className={`text-lg font-bold font-mono ${
        positive === true ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-gray-100'
      }`}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-gray-500 mt-0.5">{sub}</span>}
    </div>
  )
}

export function BacktestCard({ symbol }) {
  const [strategy, setStrategy] = useState('orb')
  const [volumeFilter, setVolumeFilter] = useState(false)
  const { data: bars } = useAlpacaBars()

  const results = useMemo(() => {
    if (!bars?.length) return null
    if (strategy === 'orb') return backtestORB(bars, { requireVolume: volumeFilter })
    if (strategy === 'ema-cross') return backtestEMACross(bars)
    return null
  }, [bars, strategy, volumeFilter])

  const stats = results?.stats

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-sm font-bold tracking-wide">Backtest</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">{symbol} — historical performance</p>
        </div>
        <div className="flex items-center gap-2">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStrategy(s.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                strategy === s.id
                  ? 'text-blue-400 bg-blue-950'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Volume filter toggle (ORB only) */}
      {strategy === 'orb' && (
        <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-800">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={volumeFilter}
              onChange={(e) => setVolumeFilter(e.target.checked)}
              className="accent-blue-500"
            />
            Require RVOL ≥ 1.5x on breakout
          </label>
        </div>
      )}

      {/* Stats grid */}
      <div className="p-5">
        {!stats || stats.totalTrades === 0 ? (
          <p className="text-center text-gray-500 text-xs py-8">
            {!bars?.length ? 'Load chart data to run backtest' : 'No trades found in this data range'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatBox label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.wins}W / ${stats.losses}L`} positive={stats.winRate > 50} />
              <StatBox label="Risk:Reward" value={`${stats.riskReward}:1`} positive={stats.riskReward > 1} />
              <StatBox label="Total P&L" value={`${stats.totalPnlPct > 0 ? '+' : ''}${stats.totalPnlPct}%`} positive={stats.totalPnlPct > 0} />
              <StatBox label="Profit Factor" value={stats.profitFactor} positive={stats.profitFactor > 1} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Avg Win" value={`+${stats.avgWin}%`} positive={true} />
              <StatBox label="Avg Loss" value={`${stats.avgLoss}%`} positive={false} />
              <StatBox label="Best Trade" value={`+${stats.maxWin}%`} positive={true} />
              <StatBox label="Worst Trade" value={`${stats.maxLoss}%`} positive={false} />
            </div>

            {/* Recent trades */}
            <div className="mt-5">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Recent Trades</div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left py-1.5 font-medium">Date</th>
                      <th className="text-left py-1.5 font-medium">Type</th>
                      <th className="text-right py-1.5 font-medium">Entry</th>
                      <th className="text-right py-1.5 font-medium">Exit</th>
                      <th className="text-right py-1.5 font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.trades.slice(-10).reverse().map((t, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="py-1.5 text-gray-400 font-mono">{t.date}</td>
                        <td className={`py-1.5 ${t.type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.type === 'long' ? 'LONG' : 'SHORT'}
                        </td>
                        <td className="py-1.5 text-right font-mono">${t.entry.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-mono">${t.exit.toFixed(2)}</td>
                        <td className={`py-1.5 text-right font-mono font-semibold ${
                          t.pnlPct > 0 ? 'text-green-400' : t.pnlPct < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {t.pnlPct > 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
