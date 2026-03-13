/**
 * App.jsx — Root layout and chart orchestration.
 *
 * Layout:
 *   ┌─────────────────────────────────────────┐
 *   │ Header: symbol | price | timeframe | toggles │
 *   │ StatusBar: market open/closed          │
 *   ├─────────────────────────────────────────┤
 *   │                                         │
 *   │           Chart (fills space)           │
 *   │                                         │
 *   └─────────────────────────────────────────┘
 *
 * The chart ref pattern:
 *   CandlestickChart exposes { chart(), candleSeries() } via forwardRef.
 *   EMAOverlay, VWAPOverlay, LevelOverlay receive these and manage their own series.
 */

import { useRef, useState, useEffect } from 'react'
import { useAlpacaBars } from './hooks/useAlpacaBars'
import { useChartStore } from './store/useChartStore'
import { TIMEFRAME_CONFIG } from './constants/chart'

import { CandlestickChart } from './components/chart/CandlestickChart'
import { TimeframeSelector } from './components/chart/TimeframeSelector'
import { PriceDisplay } from './components/chart/PriceDisplay'
import { EMAOverlay } from './components/indicators/EMAOverlay'
import { VWAPOverlay } from './components/indicators/VWAPOverlay'
import { LevelOverlay } from './components/indicators/LevelOverlay'
import { StatusBar } from './components/ui/StatusBar'
import { IndicatorToggle } from './components/ui/IndicatorToggle'

export default function App() {
  const chartRef        = useRef(null)
  const [chart, setChart]               = useState(null)
  const [candleSeries, setCandleSeries] = useState(null)

  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const indicators        = useChartStore((s) => s.indicators)

  const { data: bars, isLoading, isError, error, dataUpdatedAt } = useAlpacaBars()

  const tfConfig = TIMEFRAME_CONFIG[selectedTimeframe]

  // Once the chart mounts, grab the exposed instances
  useEffect(() => {
    if (!chartRef.current) return
    const instance = chartRef.current
    // Poll briefly until chart instance is ready (forwardRef async init)
    const id = setInterval(() => {
      const c  = instance.chart?.()
      const cs = instance.candleSeries?.()
      if (c && cs) {
        setChart(c)
        setCandleSeries(cs)
        clearInterval(id)
      }
    }, 50)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-gray-100 overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-blue-400 font-mono font-bold tracking-widest text-sm">
            MAYDEN
          </span>
          {bars && <PriceDisplay bars={bars} />}
        </div>

        <div className="flex items-center gap-4">
          <TimeframeSelector />
          <div className="w-px h-4 bg-gray-700" />
          <IndicatorToggle />
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div className="px-4 py-1 border-b border-gray-900 shrink-0">
        <StatusBar lastUpdated={dataUpdatedAt} />
      </div>

      {/* ── Chart area ───────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500 font-mono text-sm">Loading QQQ…</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-2 max-w-md text-center px-8">
              <span className="text-red-400 font-mono text-sm font-bold">Data Error</span>
              <span className="text-gray-500 font-mono text-xs">
                {error?.message ?? 'Failed to load bars from Alpaca.'}
              </span>
              <span className="text-gray-600 font-mono text-xs mt-2">
                Check your .env file has valid Alpaca paper trading keys.
              </span>
            </div>
          </div>
        )}

        {/* Main chart */}
        <CandlestickChart ref={chartRef} bars={bars ?? []} />

        {/* Overlays — rendered after chart instance is ready */}
        {chart && candleSeries && bars && (
          <>
            <EMAOverlay
              chart={chart}
              bars={bars}
              visible={indicators.ema}
            />
            {tfConfig.showVWAP && (
              <VWAPOverlay
                chart={chart}
                bars={bars}
                visible={indicators.vwap}
              />
            )}
            <LevelOverlay
              candleSeries={candleSeries}
              bars={bars}
              showORB={tfConfig.showORB}
              visible={indicators.levels}
            />
          </>
        )}
      </div>
    </div>
  )
}
