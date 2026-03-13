/**
 * App.jsx — Root layout and chart orchestration.
 *
 * Layout:
 *   ┌──────────┬──────────────────────────────────────────┐
 *   │          │  Header: price | macro | day type        │
 *   │ Sidebar  ├──────────────────────────────────────────┤
 *   │          │                                          │
 *   │ Symbol   │   Main chart (candles + EMA + VWAP)     │
 *   │ TF       │                                          │
 *   │ Inds     ├──────────────────────────────────────────┤
 *   │          │  [RSI] [MACD]  ← compact tab strip      │
 *   │ ATR      ├──────────────────────────────────────────┤
 *   └──────────┴──────────────────────────────────────────┘
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import { useAlpacaBars } from './hooks/useAlpacaBars'
import { useDailyBars } from './hooks/useDailyBars'
import { useChartStore } from './store/useChartStore'
import { TIMEFRAME_CONFIG, TIMEFRAME_ORDER } from './constants/chart'
import { atr, getDailyRangeStatus } from './utils/indicators'
import { getPreviousLevels, classifyDayType, groupBarsByDay } from './utils/levels'

import { CandlestickChart } from './components/chart/CandlestickChart'
import { TimeframeSelector } from './components/chart/TimeframeSelector'
import { PriceDisplay } from './components/chart/PriceDisplay'
import { EMAOverlay } from './components/indicators/EMAOverlay'
import { VWAPOverlay } from './components/indicators/VWAPOverlay'
import { LevelOverlay } from './components/indicators/LevelOverlay'
import { StatusBar } from './components/ui/StatusBar'
import { IndicatorToggle } from './components/ui/IndicatorToggle'
import { ATRGauge } from './components/ui/ATRGauge'
import { DayTypeBanner } from './components/ui/DayTypeBanner'
import { MacroStatusBar } from './components/ui/MacroStatusBar'
import { IndicatorTabView } from './components/ui/IndicatorTabView'

export default function App() {
  const chartRef = useRef(null)
  const [chart, setChart]               = useState(null)
  const [candleSeries, setCandleSeries] = useState(null)
  const [sidebarOpen, setSidebarOpen]   = useState(true)

  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const indicators        = useChartStore((s) => s.indicators)

  const { data: bars, isLoading, isError, error, dataUpdatedAt } = useAlpacaBars()
  const { data: dailyBars } = useDailyBars()

  const tfConfig = TIMEFRAME_CONFIG[selectedTimeframe]

  // ── Chart instance (polling until forwardRef is ready) ─────────────────────
  useEffect(() => {
    if (!chartRef.current) return
    const instance = chartRef.current
    const id = setInterval(() => {
      const c  = instance.chart?.()
      const cs = instance.candleSeries?.()
      if (c && cs) { setChart(c); setCandleSeries(cs); clearInterval(id) }
    }, 50)
    return () => clearInterval(id)
  }, [])

  // ── ATR gauge values ────────────────────────────────────────────────────────
  const atrGauge = useMemo(() => {
    if (!bars?.length) return null
    const { series: atrSeries } = atr(bars, 14)
    if (!atrSeries.length) return null
    const atr14 = atrSeries[atrSeries.length - 1].value
    const byDay = groupBarsByDay(bars)
    const days  = Array.from(byDay.keys()).sort()
    return getDailyRangeStatus(byDay.get(days[days.length - 1]) ?? [], atr14)
  }, [bars])

  // ── Day type classification ─────────────────────────────────────────────────
  const dayType = useMemo(() => {
    if (!bars?.length) return null
    const { prevHigh, prevLow } = getPreviousLevels(bars)
    if (!prevHigh || !prevLow) return null
    return classifyDayType(bars, prevHigh, prevLow)
  }, [bars])

  // ── Macro status ────────────────────────────────────────────────────────────
  const macro = useMemo(() => {
    if (!dailyBars || dailyBars.length < 50) return null
    const price = dailyBars[dailyBars.length - 1].close
    const sma   = (n) => dailyBars.slice(-n).reduce((s, b) => s + b.close, 0) / Math.min(n, dailyBars.length)
    return { price, sma50: sma(50), sma200: sma(Math.min(200, dailyBars.length)) }
  }, [dailyBars])

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100 overflow-hidden font-mono">

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside
        className="flex flex-col shrink-0 border-r border-gray-800 bg-[#0d1117] transition-all duration-200 overflow-hidden"
        style={{ width: sidebarOpen ? 192 : 40 }}
      >
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="flex items-center justify-center h-10 border-b border-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors shrink-0 text-xs"
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {sidebarOpen && (
          <div className="flex flex-col gap-5 px-3 py-4 overflow-y-auto flex-1">

            <div>
              <div className="text-[10px] tracking-widest text-gray-500 uppercase mb-1">Symbol</div>
              <div className="text-blue-400 font-bold text-lg tracking-wider">QQQ</div>
            </div>

            <div className="h-px bg-gray-800" />

            <div>
              <div className="text-[10px] tracking-widest text-gray-500 uppercase mb-2">Timeframe</div>
              <TimeframeSelector />
            </div>

            <div className="h-px bg-gray-800" />

            <div>
              <div className="text-[10px] tracking-widest text-gray-500 uppercase mb-2">Indicators</div>
              <IndicatorToggle />
            </div>

            {atrGauge && (
              <div className="mt-auto">
                <div className="h-px bg-gray-800 mb-4" />
                <ATRGauge
                  atrValue={atrGauge.atrValue}
                  rangeUsed={atrGauge.rangeUsed}
                  percentConsumed={atrGauge.percentConsumed}
                />
              </div>
            )}

          </div>
        )}
      </aside>

      {/* ══ MAIN AREA ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-center gap-4 px-4 py-2 border-b border-gray-800 shrink-0">
          <span className="text-blue-400 font-bold tracking-widest text-sm">MAYDEN</span>
          {bars && <PriceDisplay bars={bars} />}
          <div className="flex items-center gap-3 ml-auto">
            <MacroStatusBar price={macro?.price} sma50={macro?.sma50} sma200={macro?.sma200} />
            <DayTypeBanner dayType={dayType} />
          </div>
        </header>

        {/* ── Chart area ──────────────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden min-h-0">

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0a]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Loading QQQ…</span>
              </div>
            </div>
          )}

          {isError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0a]">
              <div className="flex flex-col items-center gap-2 max-w-md text-center px-8">
                <span className="text-red-400 text-sm font-bold">Data Error</span>
                <span className="text-gray-400 text-xs">
                  {error?.message ?? 'Failed to load bars from Alpaca.'}
                </span>
                <span className="text-gray-500 text-xs mt-2">
                  Check your .env has valid Alpaca paper trading keys.
                </span>
              </div>
            </div>
          )}

          <CandlestickChart ref={chartRef} bars={bars ?? []} />

          {chart && candleSeries && bars && (
            <>
              <EMAOverlay chart={chart} bars={bars} visible={indicators.ema} />
              {tfConfig.showVWAP && (
                <VWAPOverlay chart={chart} bars={bars} visible={indicators.vwap} />
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

        {/* ── Indicator tab strip (RSI / MACD) ────────────────────────────── */}
        <IndicatorTabView
          bars={bars}
          rsiEnabled={indicators.rsi}
          macdEnabled={indicators.macd}
        />

        {/* ── Status bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center px-4 py-1.5 border-t border-gray-800 shrink-0">
          <StatusBar lastUpdated={dataUpdatedAt} />
        </div>

      </div>
    </div>
  )
}
