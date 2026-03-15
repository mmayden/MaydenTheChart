/**
 * ChartView — Main chart page.
 *
 * Contains: Sidebar, candlestick chart with overlays, RSI/MACD tabs, status bar.
 * All chart-specific state and data hooks live here.
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import { useAlpacaBars } from '../hooks/useAlpacaBars'
import { useDailyBars } from '../hooks/useDailyBars'
import { useAlpacaSocket } from '../hooks/useAlpacaSocket'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useAlertChecker } from '../hooks/useAlertChecker'
import { useChartStore } from '../store/useChartStore'
import { usePresetsStore } from '../store/usePresetsStore'
import { TIMEFRAME_CONFIG } from '../constants/chart'
import { atr, getDailyRangeStatus } from '../utils/indicators'
import { getPreviousLevels, classifyDayType, groupBarsByDay } from '../utils/levels'

import { CandlestickChart } from '../components/chart/CandlestickChart'
import { PriceDisplay } from '../components/chart/PriceDisplay'
import { EMAOverlay } from '../components/indicators/EMAOverlay'
import { VWAPOverlay } from '../components/indicators/VWAPOverlay'
import { LevelOverlay } from '../components/indicators/LevelOverlay'
import { SROverlay } from '../components/indicators/SROverlay'
import { BollingerOverlay } from '../components/indicators/BollingerOverlay'
import { Sidebar } from '../components/layout/Sidebar'
import { StatusBar } from '../components/ui/StatusBar'
import { DayTypeBanner } from '../components/ui/DayTypeBanner'
import { IndicatorTabView } from '../components/ui/IndicatorTabView'
import { CrosshairLegend } from '../components/ui/CrosshairLegend'

export function ChartView() {
  const chartRef = useRef(null)
  const [chart, setChart]             = useState(null)
  const [candleSeries, setCandleSeries] = useState(null)

  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const selectedSymbol    = useChartStore((s) => s.selectedSymbol)
  const showEma           = useChartStore((s) => s.indicators.ema)
  const showVwap          = useChartStore((s) => s.indicators.vwap)
  const showRvol          = useChartStore((s) => s.indicators.rvol)
  const showLevels        = useChartStore((s) => s.indicators.levels)
  const showSr            = useChartStore((s) => s.indicators.sr)
  const showBollinger     = useChartStore((s) => s.indicators.bollinger)
  const theme             = useChartStore((s) => s.theme)

  const { data: bars, isLoading, isError, error, dataUpdatedAt, refetch } = useAlpacaBars()
  const { data: dailyBars } = useDailyBars()

  // Apply persisted preset on mount
  useEffect(() => {
    const { activePresetId, applyPreset } = usePresetsStore.getState()
    if (activePresetId) applyPreset(activePresetId)
  }, [])

  // Live WebSocket + keyboard shortcuts + alert checker
  useAlpacaSocket()
  useKeyboardShortcuts()
  useAlertChecker(bars, selectedTimeframe)

  const tfConfig = TIMEFRAME_CONFIG[selectedTimeframe]

  // Chart instance detection (polls for HMR resilience)
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

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* Sidebar */}
      <Sidebar atrGauge={atrGauge} />

      {/* Main chart area */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Chart sub-header: price + day type */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-800 shrink-0">
          {bars && <PriceDisplay bars={bars} byDay={byDay} />}
          <div className="ml-auto">
            <DayTypeBanner dayType={dayType} />
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative overflow-hidden min-h-0">

          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300"
              style={{ backgroundColor: bars ? 'rgba(10, 10, 10, 0.6)' : '#0a0a0a' }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Loading {selectedSymbol}…</span>
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
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-4 py-1.5 text-xs font-mono font-semibold rounded border border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800/50 transition-colors"
                >
                  Retry
                </button>
                <span className="text-gray-500 text-xs mt-1">
                  Check your .env has valid Alpaca paper trading keys.
                </span>
              </div>
            </div>
          )}

          <CandlestickChart ref={chartRef} bars={bars ?? []} theme={theme} dataUpdatedAt={dataUpdatedAt} showRvol={showRvol} />

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
              <SROverlay candleSeries={candleSeries} bars={bars} visible={showSr} />
              <BollingerOverlay chart={chart} bars={bars} visible={showBollinger} />
              <CrosshairLegend chart={chart} bars={bars} theme={theme} />
            </>
          )}
        </div>

        {/* Indicator tab strip (RSI / MACD) */}
        <IndicatorTabView bars={bars} />

        {/* Status bar */}
        <div className="flex items-center px-4 py-1.5 border-t border-gray-800 shrink-0">
          <StatusBar lastUpdated={dataUpdatedAt} />
        </div>

      </div>
    </div>
  )
}
