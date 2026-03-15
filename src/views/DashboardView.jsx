/**
 * DashboardView — Analytics and tools dashboard.
 *
 * Sections:
 *   - Backtest stats card (win rate, R:R, equity curve)
 *   - Trade journal (log entries with notes)
 *   - Performance breakdown (by day type, hour, streak)
 *   - Watchlist (mini sparklines for tracked symbols)
 */

import { useChartStore } from '../store/useChartStore'
import { BacktestCard } from '../components/dashboard/BacktestCard'
import { TradeJournal } from '../components/dashboard/TradeJournal'
import { WatchlistCard } from '../components/dashboard/WatchlistCard'

export function DashboardView() {
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-lg font-bold tracking-wide">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Analytics, backtesting, and trade journal</p>
        </div>

        {/* Top row: Backtest + Watchlist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BacktestCard symbol={selectedSymbol} />
          </div>
          <div>
            <WatchlistCard />
          </div>
        </div>

        {/* Trade journal */}
        <TradeJournal />

      </div>
    </div>
  )
}
