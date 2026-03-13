/**
 * App.jsx — Root layout and chart orchestration.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────┐
 *   │ MacroStatusBar — QQQ vs 50MA/200MA + DayTypeBanner  │
 *   ├──────────────────────────────────────────────────────┤
 *   │ Header: symbol | price | % change | timeframe | toggles │
 *   ├──────────────────────────────────────────────────────┤
 *   │                                                      │
 *   │   Main chart (candles + EMA + VWAP + Levels)        │
 *   │   ── RSI pane ──────────────────────────────────    │
 *   │   ── MACD pane ─────────────────────────────────    │
 *   │                                                      │
 *   ├──────────────────────────────────────────────────────┤
 *   │ ATRGauge | StatusBar                                 │
 *   └──────────────────────────────────────────────────────┘
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import { useAlpacaBars } from './hooks/useAlpacaBars'
import { useDailyBars } from './hooks/useDailyBars'
import { useChartStore } from './store/useChartStore'
import { TIMEFRAME_CONFIG } from './constants/chart'
import { atr, getDailyRangeStatus, ema } from './utils/indicators'
import { getPreviousLevels, classifyDayType, groupBarsByDay } from './utils/levels'

import { CandlestickChart } from './components/chart/CandlestickChart'
import { TimeframeSelector } from './components/chart/TimeframeSelector'
import { PriceDisplay } from './components/chart/PriceDisplay'
import { EMAOverlay } from './components/indicators/EMAOverlay'
import { VWAPOverlay } from './components/indicators/VWAPOverlay'
import { LevelOverlay } from './components/indicators/LevelOverlay'
import { RSIChart } from './components/indicators/RSIChart'
import { MACDChart } from './components/indicators/MACDChart'
import { StatusBar } from './components/ui/StatusBar'
import { IndicatorToggle } from './components/ui/IndicatorToggle'
import { ATRGauge } from './components/ui/ATRGauge'
import { DayTypeBanner } from './components/ui/DayTypeBanner'
import { MacroStatusBar } from './components/ui/MacroStatusBar'

export default function App() {
  const chartRef   = useRef(null)
  const [chart, setChart]               = useState(null)
  const [candleSeries, setCandleSeries] = useState(null)

  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const indicators        = useChartStore((s) => s.indicators)

  const { data: bars,      isLoading, isError, error, dataUpdatedAt } = useAlpacaBars()
  const { data: dailyBars } = useDailyBars()

  const tfConfig = TIMEFRAME_CONFIG[selectedTimeframe]

  // ── Chart instance (polling until forwardRef is ready) ─────────────────────
  useEffect(() => {
    if (!chartRef.current) return
    const instance = chartRef.current
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

  // ── ATR gauge values ────────────────────────────────────────────────────────
  const atrGauge = useMemo(() => {
    if (!bars || bars.length === 0) return null

    const { series: atrSeries } = atr(bars, 14)
    if (!atrSeries.length) return null

    const atr14 = atrSeries[atrSeries.length - 1].value

    // Today's bars only
    const byDay    = groupBarsByDay(bars)
    const days     = Array.from(byDay.keys()).sort()
    const todayKey = days[days.length - 1]
    const todayBars = byDay.get(todayKey) ?? []

    return getDailyRangeStatus(todayBars, atr14)
  }, [bars])

  // ── Day type classification ─────────────────────────────────────────────────
  const dayType = useMemo(() => {
    if (!bars || bars.length === 0) return null
    const { prevHigh, prevLow } = getPreviousLevels(bars)
    if (!prevHigh || !prevLow) return null
    return classifyDayType(bars, prevHigh, prevLow)
  }, [bars])

  // ── Macro status (50MA / 200MA from daily bars) ─────────────────────────────
  const macro = useMemo(() => {
    if (!dailyBars || dailyBars.length < 50) return null

    const price = dailyBars[dailyBars.length - 1].close

    const sma = (n) => {
      const slice = dailyBars.slice(-n)
      return slice.reduce((s, b) => s + b.close, 0) / slice.length
    }

    return { price, sma50: sma(50), sma200: sma(Math.min(200, dailyBars.length)) }
  }, [dailyBars])

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-gray-100 overflow-hidden">

      {/* ── Top info strip: macro + day type ─────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-900 shrink-0">
        <MacroStatusBar
          price={macro?.price}
          sma50={macro?.sma50}
          sma200={macro?.sma200}
        />
        <DayTypeBanner dayType={dayType} />
      </div>

      {/* ── Main header ──────────────────────────────────────────────────── */}
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

      {/* ── Chart area ───────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500 font-mono text-sm">Loading QQQ…</span>
            </div>
          </div>
        )}

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

        <CandlestickChart ref={chartRef} bars={bars ?? []} />

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
            <RSIChart
              chart={chart}
              bars={bars}
              visible={indicators.rsi}
            />
            <MACDChart
              chart={chart}
              bars={bars}
              visible={indicators.macd}
            />
          </>
        )}
      </div>

      {/* ── Bottom status strip ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-900 shrink-0">
        <StatusBar lastUpdated={dataUpdatedAt} />
        {atrGauge && (
          <ATRGauge
            atrValue={atrGauge.atrValue}
            rangeUsed={atrGauge.rangeUsed}
            percentConsumed={atrGauge.percentConsumed}
          />
        )}
      </div>
    </div>
  )
}
