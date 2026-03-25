/**
 * App.jsx — Single-page chart terminal.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  TopNav: Logo | panel toggles | ⌘K | ⚙                      │
 *   ├────────┬──────────────────────────────────────┬──────────────┤
 *   │ Side   │  Chart + overlays + RSI/MACD + status│  RightPanel  │
 *   │ bar    │                                      │  (one at a   │
 *   │        │                                      │   time)      │
 *   └────────┴──────────────────────────────────────┴──────────────┘
 *
 * No router. Chart always visible. Tools live in slide-out right panels.
 */

import { useRef, useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { useBars } from './hooks/useBars'
import { useDailyBars } from './hooks/useDailyBars'
import { useLiveFeed } from './hooks/useLiveFeed'
import { useInfiniteHistory } from './hooks/useInfiniteHistory'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAlertChecker } from './hooks/useAlertChecker'
import { usePullToRefresh } from './hooks/usePullToRefresh'
import { useURLState } from './hooks/useURLState'
import { useChartStore } from './store/useChartStore'
import { usePresetsStore } from './store/usePresetsStore'
import { useToast } from './store/useToastStore'
import { TIMEFRAME_CONFIG } from './constants/chart'
import { atr, ema, vwapWithBands, rsi, macd, getDailyRangeStatus } from './utils/indicators'
import { captureSnapshot, copyToClipboard } from './utils/snapshot'
import { getPreviousLevels, classifyDayType, groupBarsByDay } from './utils/levels'
import { confluenceScore } from './utils/confluence'

import { TopNav } from './components/layout/TopNav'
import { Sidebar } from './components/layout/Sidebar'
import { RightPanel } from './components/layout/RightPanel'
import { BottomNav } from './components/layout/BottomNav'
import { useIsMobile, useIsLandscape } from './hooks/useMediaQuery'
import { CandlestickChart } from './components/chart/CandlestickChart'
import { PriceDisplay } from './components/chart/PriceDisplay'
import { EMAOverlay } from './components/indicators/EMAOverlay'
import { VWAPOverlay } from './components/indicators/VWAPOverlay'
import { LevelOverlay } from './components/indicators/LevelOverlay'
import { SROverlay } from './components/indicators/SROverlay'
import { BollingerOverlay } from './components/indicators/BollingerOverlay'
import { StatusBar } from './components/ui/StatusBar'
import { DayTypeBanner } from './components/ui/DayTypeBanner'
import { ConfluenceBar } from './components/ui/ConfluenceBar'
import { MTFStrip } from './components/ui/MTFStrip'
import { IndicatorTabView } from './components/ui/IndicatorTabView'
import { CrosshairLegend } from './components/ui/CrosshairLegend'
import { ToastContainer } from './components/ui/ToastContainer'
import { OnboardingTour } from './components/ui/OnboardingTour'
import { WelcomeBanner } from './components/ui/WelcomeBanner'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Lazy-load on-demand overlays — not rendered until user opens them
const SettingsModal  = lazy(() => import('./components/ui/SettingsModal').then(m => ({ default: m.SettingsModal })))
const CommandPalette = lazy(() => import('./components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })))

export default function App() {
  const chartRef = useRef(null)
  const [chart, setChart]             = useState(null)
  const [candleSeries, setCandleSeries] = useState(null)
  const isMobile    = useIsMobile()
  const isLandscape = useIsLandscape()
  const isMobileLandscape = isMobile && isLandscape

  const theme             = useChartStore((s) => s.theme)
  const settingsOpen      = useChartStore((s) => s.settingsOpen)
  const setSettingsOpen   = useChartStore((s) => s.setSettingsOpen)
  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const selectedSymbol    = useChartStore((s) => s.selectedSymbol)
  const showEma           = useChartStore((s) => s.indicators.ema)
  const showVwap          = useChartStore((s) => s.indicators.vwap)
  const showRvol          = useChartStore((s) => s.indicators.rvol)
  const showLevels        = useChartStore((s) => s.indicators.levels)
  const showSr            = useChartStore((s) => s.indicators.sr)
  const showBollinger     = useChartStore((s) => s.indicators.bollinger)

  const { data: bars, isLoading, isError, error, dataUpdatedAt, refetch, isPlaceholderData } = useBars()
  const { data: dailyBars } = useDailyBars()

  // Transition guard: when TanStack Query is serving stale keepPreviousData
  // (e.g. during a timeframe switch), overlays should not re-render with
  // mismatched data. Only pass bars to overlays when data is fresh.
  const stableBars = isPlaceholderData ? null : bars

  // Sync URL params with store
  useURLState()
  const toast = useToast()

  // Apply persisted preset on mount
  useEffect(() => {
    const { activePresetId, applyPreset } = usePresetsStore.getState()
    if (activePresetId) applyPreset(activePresetId)
  }, [])

  // Surface data fetch errors as user-visible toasts
  useEffect(() => {
    if (isError && error) {
      const msg = error?.response?.data?.error || error?.message || 'Failed to load market data'
      toast.add({ message: msg, type: 'error', duration: 6000 })
    }
  }, [isError, error]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live WebSocket + keyboard shortcuts + alert checker + infinite scroll
  useLiveFeed()
  const { isLoadingHistory } = useInfiniteHistory(chart, bars)
  useKeyboardShortcuts()
  useAlertChecker(bars, selectedTimeframe)

  // Pull-to-refresh on mobile
  const { pullProgress, isRefreshing } = usePullToRefresh({ onRefresh: refetch })


  // Orientation change — nudge chart to remeasure after rotation
  useEffect(() => {
    let timer
    function handleOrientation() {
      timer = setTimeout(() => {
        window.dispatchEvent(new Event('cheechart:layout-resize'))
      }, 200)
    }
    window.addEventListener('orientationchange', handleOrientation)
    return () => {
      window.removeEventListener('orientationchange', handleOrientation)
      clearTimeout(timer)
    }
  }, [])

  // Refs for snapshot context (avoids stale closure / declaration-order issues)
  const snapshotCtxRef = useRef({ confluence: null, dayType: null })

  // Chart snapshot — listen for cheechart:snapshot custom event
  useEffect(() => {
    async function handleSnapshot() {
      const chartInstance = chartRef.current?.chart?.()
      if (!chartInstance) {
        toast.add({ message: 'Chart not ready', type: 'warning' })
        return
      }
      try {
        const canvas = chartInstance.takeScreenshot()
        const { selectedSymbol: sym, selectedTimeframe: tf } = useChartStore.getState()
        const { confluence: conf, dayType: dt } = snapshotCtxRef.current
        const blob = await captureSnapshot(canvas, {
          symbol: sym,
          timeframe: tf,
          confluenceScore: conf?.score,
          confluenceBias: conf?.bias,
          dayType: dt?.label,
        })
        if (!blob) {
          toast.add({ message: 'Snapshot failed', type: 'error' })
          return
        }
        const method = await copyToClipboard(blob, `cheechart-${sym}-${tf}.png`)
        toast.add({
          message: method === 'clipboard' ? 'Snapshot copied to clipboard' : 'Snapshot downloaded',
          type: 'success',
        })
      } catch {
        toast.add({ message: 'Snapshot failed', type: 'error' })
      }
    }
    window.addEventListener('cheechart:snapshot', handleSnapshot)
    return () => window.removeEventListener('cheechart:snapshot', handleSnapshot)
  }, [toast])

  const tfConfig = TIMEFRAME_CONFIG[selectedTimeframe]

  // Detect chart instance via callback ref — called once after CandlestickChart mounts.
  // Replaces the old setInterval polling approach for immediate, deterministic detection.
  const chartCallbackRef = useCallback((handle) => {
    if (!handle) return
    chartRef.current = handle
    const c  = handle.chart?.()
    const cs = handle.candleSeries?.()
    if (c && cs) {
      setChart(c)
      setCandleSeries(cs)
    }
  }, [])

  // Pre-compute groupBarsByDay once
  const byDay = useMemo(() => {
    if (!bars?.length) return null
    return groupBarsByDay(bars)
  }, [bars])

  // ATR gauge
  const atrGauge = useMemo(() => {
    if (!dailyBars?.length || !byDay) return null
    const { series: atrSeries } = atr(dailyBars, 14)
    if (!atrSeries.length) return null
    const atr14 = atrSeries[atrSeries.length - 1].value
    const days  = Array.from(byDay.keys()).sort()
    return getDailyRangeStatus(byDay.get(days[days.length - 1]) ?? [], atr14)
  }, [dailyBars, byDay])

  // Day type classification
  const dayType = useMemo(() => {
    if (!byDay) return null
    const { prevHigh, prevLow } = getPreviousLevels(bars, byDay)
    if (!prevHigh || !prevLow) return null
    return classifyDayType(bars, prevHigh, prevLow, byDay)
  }, [bars, byDay])

  // Confluence score — synthesize all indicator signals
  const confluence = useMemo(() => {
    if (!bars?.length) return null
    const ema9Signal  = ema(bars, 9).signal
    const ema48Signal = ema(bars, 48).signal
    const ema200Signal = ema(bars, 200).signal
    const vwapSignal  = vwapWithBands(bars).signal
    const rsiSignal   = rsi(bars).signal
    const macdSignal  = macd(bars).signal
    return confluenceScore({ dayType, ema9Signal, ema48Signal, ema200Signal, vwapSignal, atrGauge, rsiSignal, macdSignal })
  }, [bars, dayType, atrGauge])

  // Keep snapshot ref in sync with latest computed values
  useEffect(() => {
    snapshotCtxRef.current = { confluence, dayType }
  }, [confluence, dayType])

  return (
    <div
      data-theme={theme}
      className="flex flex-col h-screen-safe overflow-hidden font-mono pt-safe"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Shared overlays (lazy-loaded) */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
          <CommandPalette />
        </Suspense>
      </ErrorBoundary>
      <ToastContainer />
      <OnboardingTour />

      {/* Top navigation */}
      <TopNav />
      <WelcomeBanner />

      {/* Main content area: Sidebar + Chart + RightPanel */}
      <div className={`flex flex-1 min-h-0 overflow-hidden ${isMobile ? 'pb-[calc(48px+var(--safe-bottom))]' : ''}`}>

        {/* Sidebar */}
        <Sidebar atrGauge={atrGauge} />

        {/* Chart area */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Chart sub-header: price + day type */}
          <div className={`${isMobile ? 'flex flex-col gap-0.5 px-2 py-1' : 'flex items-center gap-3 px-3 py-1.5'} border-b border-theme shrink-0 min-w-0 landscape-compact`}>
            {/* Row 1: Price (full width on mobile) */}
            <div className={isMobile ? '' : 'contents'}>
              {bars && <PriceDisplay bars={bars} byDay={byDay} compact={isMobile} />}
            </div>
            {/* Row 2 on mobile / same row on desktop: confluence + day type */}
            <div className={isMobile ? 'flex items-center gap-2 min-w-0' : 'contents'}>
              <ConfluenceBar confluence={confluence} />
              {!isMobile && (
                <div className="hidden sm:block">
                  <MTFStrip />
                </div>
              )}
              <div className="ml-auto shrink-0">
                <DayTypeBanner dayType={dayType} />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 relative overflow-hidden min-h-0 chart-contain">

            {/* Pull-to-refresh indicator (mobile) */}
            {(pullProgress > 0 || isRefreshing) && (
              <div
                className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none"
                style={{
                  top: 8,
                  opacity: isRefreshing ? 1 : pullProgress,
                  transform: `translateX(-50%) scale(${0.5 + pullProgress * 0.5})`,
                  transition: isRefreshing ? 'none' : 'opacity 0.1s',
                }}
              >
                <div
                  className={`w-6 h-6 border-2 border-accent border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
                  style={!isRefreshing ? { transform: `rotate(${pullProgress * 360}deg)` } : undefined}
                />
              </div>
            )}

            {isLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300"
                style={{ backgroundColor: bars ? 'color-mix(in srgb, var(--bg-base) 85%, transparent)' : 'var(--bg-base)' }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-theme-muted text-sm">Loading {selectedSymbol}…</span>
                </div>
              </div>
            )}

            {isError && (
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'var(--bg-base)' }}>
                <div className="flex flex-col items-center gap-2 max-w-md text-center px-8">
                  <span className="text-sm font-bold text-bear">Data Error</span>
                  <span className="text-theme-muted text-xs">
                    {error?.message ?? 'Failed to load bars from Alpaca.'}
                  </span>
                  <button
                    onClick={() => refetch()}
                    className="mt-3 px-4 py-1.5 text-xs font-mono font-semibold rounded border border-theme-mid text-theme hover:border-theme-mid hover:bg-theme-hover transition-colors"
                  >
                    Retry
                  </button>
                  <span className="text-theme-muted text-xs mt-1">
                    Check your .env has valid Alpaca paper trading keys.
                  </span>
                </div>
              </div>
            )}

            {isLoadingHistory && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-theme-muted font-mono pointer-events-none"
                style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 85%, transparent)' }}>
                <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            )}

            <CandlestickChart ref={chartCallbackRef} bars={bars ?? []} theme={theme} dataUpdatedAt={dataUpdatedAt} showRvol={showRvol} />

            {chart && candleSeries && stableBars && (
              <>
                <EMAOverlay chart={chart} bars={stableBars} visible={showEma} />
                {tfConfig.showVWAP && (
                  <VWAPOverlay chart={chart} bars={stableBars} visible={showVwap} />
                )}
                <LevelOverlay
                  chart={chart}
                  candleSeries={candleSeries}
                  bars={stableBars}
                  byDay={byDay}
                  showORB={tfConfig.showORB}
                  visible={showLevels}
                />
                <SROverlay candleSeries={candleSeries} bars={stableBars} visible={showSr} />
                <BollingerOverlay chart={chart} bars={stableBars} visible={showBollinger} />
                <CrosshairLegend chart={chart} bars={stableBars} />
              </>
            )}
          </div>

          {/* Indicator tab strip (RSI / MACD) — hidden in landscape mobile */}
          {!isMobileLandscape && (
            <IndicatorTabView bars={stableBars} mainChart={chart} />
          )}

          {/* Status bar — hidden in landscape mobile to maximize chart */}
          <div className="flex items-center px-3 py-1 border-t border-theme shrink-0 landscape-hide">
            <StatusBar lastUpdated={dataUpdatedAt} />
          </div>

        </div>

        {/* Right panel (slide-out, one at a time) */}
        <RightPanel />

      </div>

      {/* Bottom navigation — mobile only */}
      {isMobile && <BottomNav />}
    </div>
  )
}
