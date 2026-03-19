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
import { useWeeklyBars } from './hooks/useWeeklyBars'
import { useLiveFeed } from './hooks/useLiveFeed'
import { useInfiniteHistory } from './hooks/useInfiniteHistory'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAlertChecker } from './hooks/useAlertChecker'
import { usePullToRefresh } from './hooks/usePullToRefresh'
import { useLongPress } from './hooks/useLongPress'
import { useURLState } from './hooks/useURLState'
import { useChartStore } from './store/useChartStore'
import { usePresetsStore } from './store/usePresetsStore'
import { useToast } from './store/useToastStore'
import { useAlertsStore } from './store/useAlertsStore'
import { useAnnotationsStore } from './store/useAnnotationsStore'
import { useReplayStore } from './store/useReplayStore'
import { TIMEFRAME_CONFIG, RSI_DIV_BULL_COLOR, RSI_DIV_BEAR_COLOR, EMA_CROSS_BULL_COLOR, EMA_CROSS_BEAR_COLOR } from './constants/chart'
import { atr, ema, vwapWithBands, rsi, macd, getDailyRangeStatus, detectRSIDivergences } from './utils/indicators'
import { captureSnapshot, copyToClipboard } from './utils/snapshot'
import { useEMACrosses } from './hooks/useEMACrosses'
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
import { GapOverlay } from './components/indicators/GapOverlay'
import { VolumeProfileOverlay } from './components/indicators/VolumeProfileOverlay'
import { AnnotationOverlay, useAnnotationMarkers } from './components/indicators/AnnotationOverlay'
import { StatusBar } from './components/ui/StatusBar'
import { DayTypeBanner } from './components/ui/DayTypeBanner'
import { ConfluenceBar } from './components/ui/ConfluenceBar'
import { MTFStrip } from './components/ui/MTFStrip'
import { IndicatorTabView } from './components/ui/IndicatorTabView'
import { CrosshairLegend } from './components/ui/CrosshairLegend'
import { ToastContainer } from './components/ui/ToastContainer'
import { OnboardingTour } from './components/ui/OnboardingTour'
import { WelcomeBanner } from './components/ui/WelcomeBanner'
import { AnnotationToolbar } from './components/ui/AnnotationToolbar'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Lazy-load on-demand overlays — not rendered until user opens them
const SettingsModal  = lazy(() => import('./components/ui/SettingsModal').then(m => ({ default: m.SettingsModal })))
const CommandPalette = lazy(() => import('./components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })))

/** Floating pill to exit fullscreen.
 *  Desktop: auto-fades after 3s, shows "ESC to exit".
 *  Mobile: always visible, shows "Tap to exit". */
function FullscreenExitPill({ onExit, isMobile }) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    // On desktop, auto-fade. On mobile, stay visible.
    if (isMobile) return
    timerRef.current = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timerRef.current)
  }, [isMobile])

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onExit() }}
      className="absolute top-3 right-3 z-20 px-3 py-1.5 text-[10px] font-mono font-semibold rounded-full border transition-opacity duration-300 touch-target"
      style={{
        opacity: isMobile ? 0.7 : (visible ? 0.8 : 0),
        pointerEvents: isMobile || visible ? 'auto' : 'none',
        backgroundColor: 'rgba(10,10,10,0.75)',
        borderColor: 'var(--border)',
        color: 'var(--text-muted)',
      }}
      onMouseEnter={!isMobile ? () => setVisible(true) : undefined}
      onMouseLeave={!isMobile ? () => {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setVisible(false), 2000)
      } : undefined}
    >
      {isMobile ? 'Tap to exit' : 'ESC to exit'}
    </button>
  )
}

/**
 * useDoubleTap — Detects double-tap on touch devices (300ms window).
 * Returns onTouchEnd handler. Does not interfere with single taps or scrolling.
 */
function useDoubleTap(onDoubleTap) {
  const lastTapRef = useRef(0)
  return useCallback((e) => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0
      onDoubleTap(e)
    } else {
      lastTapRef.current = now
    }
  }, [onDoubleTap])
}

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
  const showRsiDiv        = useChartStore((s) => s.indicators.rsiDiv)
  const showEmaCross      = useChartStore((s) => s.indicators.emaCross)
  const showGaps          = useChartStore((s) => s.indicators.gaps)
  const showVolProfile    = useChartStore((s) => s.indicators.volProfile)
  const annotationMode    = useChartStore((s) => s.annotationMode)
  const isFullscreen      = useChartStore((s) => s.isFullscreen)
  const toggleFullscreen  = useChartStore((s) => s.toggleFullscreen)

  const { data: liveBars, isLoading, isError, error, dataUpdatedAt, refetch } = useBars()
  const { data: dailyBars } = useDailyBars()
  const { data: weeklyBars } = useWeeklyBars(showGaps)

  // Replay mode — when active, chart shows sliced replay bars instead of live bars
  const isReplaying = useReplayStore((s) => s.isReplaying)
  const replayVisibleBars = useReplayStore((s) =>
    s.isReplaying ? s.replayBars.slice(0, s.currentStep + 1) : null,
  )
  const bars = isReplaying ? replayVisibleBars : liveBars

  // Sync URL params with store
  useURLState()
  const toast = useToast()

  // Clear accent CSS overrides when theme changes (each theme has its own default accent)
  useEffect(() => {
    const root = document.documentElement
    root.style.removeProperty('--accent')
    root.style.removeProperty('--accent-dim')
    root.style.removeProperty('--btn-primary')
    root.style.removeProperty('--btn-primary-hover')
    root.style.removeProperty('--focus-ring')
  }, [theme])

  // Nudge chart to remeasure when fullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('cheechart:layout-resize'))
    }, 50)
    return () => clearTimeout(timer)
  }, [isFullscreen])

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

  // Long-press on chart → create price alert (mobile)
  const chartContainerRef = useRef(null)
  const handleLongPress = useCallback(({ clientY }) => {
    const chartInstance = chartRef.current?.chart?.()
    const container = chartContainerRef.current
    if (!chartInstance || !container) return

    // Ignore presses in the volume zone (bottom 18% of chart)
    const rect = container.getBoundingClientRect()
    const yRatio = (clientY - rect.top) / rect.height
    if (yRatio > 0.82) return

    // Convert clientY to chart coordinate, then to price
    const y = clientY - rect.top
    const coordinate = chartInstance.priceScale('right').coordinateToPrice(y)
    if (coordinate == null || isNaN(coordinate) || coordinate <= 0) return

    const price = Math.round(coordinate * 100) / 100
    const { selectedSymbol: sym } = useChartStore.getState()
    const currentPrice = useAlertsStore.getState().currentPrice
    const condition = currentPrice && price > currentPrice ? 'above' : 'below'

    useAlertsStore.getState().addAlert({ type: 'price', price, condition })
    toast.add({
      message: `Alert: ${sym} ${condition} $${price.toFixed(2)}`,
      type: 'success',
      duration: 3000,
    })
  }, [toast])
  const longPressHandlers = useLongPress(handleLongPress)

  // Double-tap to toggle fullscreen (mobile — onDoubleClick doesn't fire reliably on touch)
  const handleDoubleTap = useDoubleTap(toggleFullscreen)

  // Chart click → create annotation when annotationMode is active
  const handleAnnotationClick = useCallback((e) => {
    const mode = useChartStore.getState().annotationMode
    if (!mode) return

    const chartInstance = chartRef.current?.chart?.()
    const container = chartContainerRef.current
    if (!chartInstance || !container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert pixel to price
    const price = chartInstance.priceScale('right').coordinateToPrice(y)
    if (price == null || isNaN(price) || price <= 0) return

    // Convert pixel to time
    const time = chartInstance.timeScale().coordinateToTime(x)
    if (time == null) return

    const roundedPrice = Math.round(price * 100) / 100
    const { selectedSymbol: sym } = useChartStore.getState()

    if (mode === 'text') {
      // Prompt for text (simple window.prompt — lightweight, no extra modal needed)
      const text = window.prompt('Annotation text:')
      if (!text) return
      useAnnotationsStore.getState().addAnnotation(sym, { type: 'text', time, price: roundedPrice, text })
    } else if (mode === 'arrow') {
      useAnnotationsStore.getState().addAnnotation(sym, { type: 'arrow', time, price: roundedPrice, direction: 'up' })
    } else if (mode === 'hline') {
      const text = window.prompt('Line label (optional):') ?? ''
      useAnnotationsStore.getState().addAnnotation(sym, { type: 'hline', price: roundedPrice, text })
    }

    // Exit annotation mode after placing
    useChartStore.getState().setAnnotationMode(mode)
    toast.add({ message: `${mode} annotation at $${roundedPrice.toFixed(2)}`, type: 'success', duration: 2000 })
  }, [toast])

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

  // Chart instance detection (polls until found, then stops)
  useEffect(() => {
    function check() {
      const c  = chartRef.current?.chart?.()
      const cs = chartRef.current?.candleSeries?.()
      if (c && cs) {
        setChart(c)
        setCandleSeries(cs)
        return true
      }
      return false
    }
    if (check()) return // already available
    const id = setInterval(() => {
      if (check()) clearInterval(id)
    }, 100)
    return () => clearInterval(id)
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

  // 4hr EMA cross detection (only fetches when toggle is on)
  const { data: emaCrosses } = useEMACrosses(showEmaCross)

  // RSI divergence markers — computed from current bars + RSI series
  const rsiDivMarkers = useMemo(() => {
    if (!showRsiDiv || !bars?.length) return []
    const rsiResult = rsi(bars)
    const divergences = detectRSIDivergences(bars, rsiResult.series)
    const validTimes = new Set(bars.map((b) => b.time))
    return divergences
      .filter((d) => validTimes.has(d.time))
      .map((d) => ({
        time:     d.time,
        position: d.type === 'bullish' ? 'belowBar' : 'aboveBar',
        color:    d.type === 'bullish' ? RSI_DIV_BULL_COLOR : RSI_DIV_BEAR_COLOR,
        shape:    d.type === 'bullish' ? 'arrowUp' : 'arrowDown',
        text:     d.type === 'bullish' ? 'Bull Div' : 'Bear Div',
      }))
  }, [bars, showRsiDiv])

  // EMA cross markers — map 4hr cross times to nearest bar in current timeframe
  const emaCrossMarkers = useMemo(() => {
    if (!showEmaCross || !emaCrosses?.length || !bars?.length) return []
    const barTimes = bars.map((b) => b.time)
    return emaCrosses
      .map((cross) => {
        // Find nearest bar time in current data
        let nearest = barTimes[0]
        let minDiff = Math.abs(cross.time - nearest)
        for (const t of barTimes) {
          const diff = Math.abs(cross.time - t)
          if (diff < minDiff) { minDiff = diff; nearest = t }
          if (t > cross.time) break // barTimes are sorted, stop early
        }
        // Only show if within 4 hours of actual cross time
        if (minDiff > 4 * 60 * 60) return null
        return {
          time:     nearest,
          position: cross.direction === 'bull' ? 'belowBar' : 'aboveBar',
          color:    cross.direction === 'bull' ? EMA_CROSS_BULL_COLOR : EMA_CROSS_BEAR_COLOR,
          shape:    cross.direction === 'bull' ? 'arrowUp' : 'arrowDown',
          text:     cross.direction === 'bull' ? '4h EMA ×' : '4h EMA ×',
        }
      })
      .filter(Boolean)
  }, [bars, emaCrosses, showEmaCross])

  // Annotation markers (user-drawn text/arrow markers)
  const annotationMarkers = useAnnotationMarkers(selectedSymbol, bars)

  // Combined extra markers for SROverlay (divergences + EMA crosses + annotations)
  const extraMarkers = useMemo(
    () => [...rsiDivMarkers, ...emaCrossMarkers, ...annotationMarkers],
    [rsiDivMarkers, emaCrossMarkers, annotationMarkers],
  )

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

      {/* Top navigation — hidden in fullscreen */}
      {!isFullscreen && <TopNav bars={bars} byDay={byDay} confluence={confluence} dayType={dayType} />}
      {!isFullscreen && <WelcomeBanner />}

      {/* Main content area: Sidebar + Chart + RightPanel */}
      <div className={`flex flex-1 min-h-0 overflow-hidden ${isMobile && !isFullscreen ? 'pb-[calc(48px+var(--safe-bottom))]' : ''}`}>

        {/* Sidebar — hidden in fullscreen */}
        {!isFullscreen && <Sidebar atrGauge={atrGauge} />}

        {/* Chart area */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Chart sub-header — desktop only (mobile uses TopNav for price/confluence/daytype) */}
          {!isFullscreen && !isMobile && (
            <div className="flex items-center gap-3 px-3 py-1.5 border-b border-theme shrink-0 min-w-0 landscape-compact">
              <div className="contents">
                {bars && <PriceDisplay bars={bars} byDay={byDay} />}
              </div>
              <div className="contents">
                <ConfluenceBar confluence={confluence} />
                <div className="hidden sm:block">
                  <MTFStrip />
                </div>
                <div className="ml-auto shrink-0">
                  <DayTypeBanner dayType={dayType} />
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div
            ref={chartContainerRef}
            className="flex-1 relative overflow-hidden min-h-0 chart-contain"
            onClick={annotationMode ? handleAnnotationClick : undefined}
            onDoubleClick={isMobile ? undefined : toggleFullscreen}
            style={annotationMode ? { cursor: 'crosshair' } : undefined}
            {...(isMobile ? { ...longPressHandlers, onTouchEnd: (e) => { longPressHandlers.onTouchEnd(e); handleDoubleTap(e) } } : {})}
          >

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

            <CandlestickChart ref={chartRef} bars={bars ?? []} theme={theme} dataUpdatedAt={dataUpdatedAt} showRvol={showRvol} />

            {/* Annotation toolbar — floating, top-left of chart */}
            {!isFullscreen && <AnnotationToolbar />}

            {/* Fullscreen exit pill — auto-fades after 2s */}
            {isFullscreen && <FullscreenExitPill onExit={toggleFullscreen} isMobile={isMobile} />}

            {chart && candleSeries && bars && (
              <>
                <EMAOverlay chart={chart} bars={bars} visible={showEma} />
                {tfConfig.showVWAP && (
                  <VWAPOverlay chart={chart} bars={bars} visible={showVwap} />
                )}
                <LevelOverlay
                  chart={chart}
                  candleSeries={candleSeries}
                  bars={bars}
                  byDay={byDay}
                  showORB={tfConfig.showORB}
                  visible={showLevels}
                />
                <SROverlay candleSeries={candleSeries} bars={bars} visible={showSr} extraMarkers={extraMarkers} />
                <BollingerOverlay chart={chart} bars={bars} visible={showBollinger} />
                <GapOverlay candleSeries={candleSeries} bars={bars} weeklyBars={weeklyBars} visible={showGaps} />
                <VolumeProfileOverlay candleSeries={candleSeries} bars={bars} visible={showVolProfile} />
                <AnnotationOverlay candleSeries={candleSeries} symbol={selectedSymbol} />
                <CrosshairLegend chart={chart} bars={bars} theme={theme} />
              </>
            )}
          </div>

          {/* Indicator tab strip (RSI / MACD) — hidden in fullscreen + landscape mobile */}
          {!isFullscreen && !isMobileLandscape && (
            <IndicatorTabView bars={bars} mainChart={chart} />
          )}

          {/* Status bar — hidden in fullscreen + mobile (dot moved to BottomNav) */}
          {!isFullscreen && !isMobile && (
            <div className="flex items-center px-3 py-1 border-t border-theme shrink-0 landscape-hide">
              <StatusBar lastUpdated={dataUpdatedAt} />
            </div>
          )}

        </div>

        {/* Right panel (slide-out, one at a time) — hidden in fullscreen */}
        {!isFullscreen && <RightPanel />}

      </div>

      {/* Bottom navigation — mobile only, hidden in fullscreen */}
      {isMobile && !isFullscreen && <BottomNav />}
    </div>
  )
}
