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
import { useAlpacaSocket } from './hooks/useAlpacaSocket'
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
import { SROverlay } from './components/indicators/SROverlay'
import { StatusBar } from './components/ui/StatusBar'
import { IndicatorToggle } from './components/ui/IndicatorToggle'
import { ATRGauge } from './components/ui/ATRGauge'
import { DayTypeBanner } from './components/ui/DayTypeBanner'
import { MacroStatusBar } from './components/ui/MacroStatusBar'
import { IndicatorTabView } from './components/ui/IndicatorTabView'
import { NotificationBell } from './components/ui/NotificationBell'
import Logo from './components/ui/Logo'
import { SettingsModal } from './components/ui/SettingsModal'

export default function App() {
  const chartRef = useRef(null)
  const [chart, setChart]               = useState(null)
  const [candleSeries, setCandleSeries] = useState(null)
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const indicators        = useChartStore((s) => s.indicators)
  const theme             = useChartStore((s) => s.theme)

  const { data: bars, isLoading, isError, error, dataUpdatedAt } = useAlpacaBars()
  const { data: dailyBars } = useDailyBars()

  // Live WebSocket — connects during market hours, injects bars into TanStack cache
  useAlpacaSocket()

  const tfConfig = TIMEFRAME_CONFIG[selectedTimeframe]

  // ── Chart instance detection ────────────────────────────────────────────────
  // Polls chartRef continuously so it re-detects the chart if it ever
  // destroys and recreates (e.g. Vite HMR, future dynamic remounts).
  // Uses functional setters so it only triggers re-renders on actual changes.
  useEffect(() => {
    let lastChart = null
    const id = setInterval(() => {
      const c  = chartRef.current?.chart?.()
      const cs = chartRef.current?.candleSeries?.()
      if (c && cs && c !== lastChart) {
        lastChart = c
        setChart(c)
        setCandleSeries(cs)
      }
    }, 100)
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
    <div
      data-theme={theme}
      className="flex h-screen overflow-hidden font-mono"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside
        className="flex flex-col shrink-0 border-r border-gray-800 transition-all duration-200 overflow-hidden"
        style={{ width: sidebarOpen ? 192 : 40, backgroundColor: 'var(--bg-surface)' }}
      >
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="flex items-center justify-center h-10 border-b border-gray-800 text-gray-300 hover:text-gray-300 hover:bg-gray-800 transition-colors shrink-0 text-xs font-semibold"
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {sidebarOpen && (
          <div className="flex flex-col gap-5 px-3 py-4 overflow-y-auto flex-1">

            <div>
              <div className="text-[10px] tracking-widest text-gray-300 font-semibold uppercase mb-1">Symbol</div>
              <div
                className="qqq-symbol"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  background: theme === 'dark'
                    ? 'linear-gradient(160deg, #60B4F5 0%, #3090D4 45%, #0B6AB8 100%)'
                    : 'linear-gradient(160deg, #F5D060 0%, #D4A830 45%, #B8860B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: theme === 'dark'
                    ? 'drop-shadow(0 1px 2px rgba(11,106,184,0.3))'
                    : 'drop-shadow(0 1px 2px rgba(184,134,11,0.3))',
                }}
              >QQQ</div>
            </div>

            <div className="h-px bg-gray-800" />

            <div>
              <div className="text-[10px] tracking-widest text-gray-300 font-semibold uppercase mb-2">Timeframe</div>
              <TimeframeSelector />
            </div>

            <div className="h-px bg-gray-800" />

            <div>
              <div className="text-[10px] tracking-widest text-gray-300 font-semibold uppercase mb-2">Indicators</div>
              <IndicatorToggle />
            </div>

            {atrGauge && (
              <div className="mt-auto">
                <div className="h-px bg-gray-800 mb-4" />
                <ATRGauge
                  atrValue={atrGauge.atrValue}
                  rangeUsed={atrGauge.rangeUsed}
                  percentConsumed={atrGauge.percentConsumed}
                  theme={theme}
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
          <Logo />
          {bars && <PriceDisplay bars={bars} />}
          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell bars={bars} timeframe={selectedTimeframe} />
            <MacroStatusBar price={macro?.price} sma50={macro?.sma50} sma200={macro?.sma200} />
            <DayTypeBanner dayType={dayType} />
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
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

          <CandlestickChart ref={chartRef} bars={bars ?? []} theme={theme} />

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
              <SROverlay
                candleSeries={candleSeries}
                bars={bars}
                visible={indicators.sr}
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
