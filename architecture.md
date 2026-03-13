# Architecture — MaydenTheChart

---

## Data Flow

```
Alpaca REST API
      │
      ▼
services/alpaca.js          ← axios client, auth headers, error handling
      │
      ▼
hooks/useAlpacaBars.js      ← TanStack Query: caching, loading, error, refetch
      │
      ├──► utils/indicators.js    ← pure math: EMA, VWAP+bands, ATR, RSI, MACD
      ├──► utils/levels.js        ← prev H/L, ORB zone, open of day
      └──► utils/supportResistance.js

Zustand Store (useChartStore)
  selectedTimeframe ─────────────────────────────────► useAlpacaBars (queryKey)
  selectedSymbol    ─────────────────────────────────► useAlpacaBars (queryKey)
  indicator toggles ─────────────────────────────────► conditional rendering

      ▼
App.jsx                     ← root layout, providers
      │
      ├──► components/chart/
      │         ├── CandlestickChart.jsx    ← lw-charts v5 main pane
      │         ├── TimeframeSelector.jsx   ← reads/writes Zustand timeframe
      │         └── PriceDisplay.jsx        ← live price + % change
      │
      ├──► components/indicators/
      │         ├── EMAOverlay.jsx          ← EMA 9/48/200 line series
      │         ├── VWAPOverlay.jsx         ← VWAP + 1σ/2σ bands
      │         ├── LevelOverlay.jsx        ← prev H/L, ORB zone, ODC line
      │         ├── RSIChart.jsx            ← v5 pane (attached to main chart)
      │         └── MACDChart.jsx           ← v5 pane (attached below RSI)
      │
      └──► components/ui/
                ├── ATRGauge.jsx            ← daily range meter
                ├── DayTypeBanner.jsx       ← Trend/Range/Chop live status
                ├── MacroStatusBar.jsx      ← 50MA/200MA alignment
                ├── IndicatorToggle.jsx     ← show/hide controls
                └── StatusBar.jsx          ← market open/closed, last update

Alpaca WebSocket
      │
      ▼
services/websocket.js       ← connection lifecycle, auth, reconnect
      │
      ▼
hooks/useAlpacaSocket.js    ← subscribe to QQQ, update chart ref
      │
      ▼
CandlestickChart.jsx        ← series.update() with incoming bar
```

---

## lightweight-charts v5 — Key Differences from v4

**Multi-pane is now native in v5** — this is the primary reason we chose v5.

```js
// v5 pattern: create main chart, attach panes to it
import { createChart } from 'lightweight-charts'

const chart = createChart(container, options)

// Main price pane (auto-created)
const candleSeries = chart.addCandlestickSeries()

// RSI pane — attached to same chart instance
const rsiPane = chart.addPane()  // or chart.addLineSeries({ pane: 1 })
const rsiSeries = chart.addLineSeries({ pane: 1 })

// MACD pane — second sub-pane
const macdSeries = chart.addLineSeries({ pane: 2 })
```

Crosshair automatically syncs across all panes in the same chart instance.
No manual sync needed — this is one of v5's biggest improvements over v4.

---

## Component Responsibilities

### `App.jsx`
- Wraps everything in `QueryClientProvider` (TanStack) and any context providers
- Root layout: header, main chart area, bottom panels
- Does NOT own chart rendering directly — delegates to components

### `CandlestickChart.jsx`
- Creates and owns the lightweight-charts v5 `IChartApi` instance
- Manages chart cleanup on unmount (`return () => chart.remove()`)
- Exposes chart ref so overlay components can attach series to it
- Handles responsive resizing via `ResizeObserver`

### `useAlpacaBars.js` (TanStack Query)
- Accepts `symbol` and `timeframe` from Zustand store as queryKey parts
- Returns `{ data, isLoading, isError, error, refetch }`
- Caches for 30s, background refetches every 60s during market hours

### `useChartStore.js` (Zustand)
```js
import { create } from 'zustand'

export const useChartStore = create((set) => ({
  timeframe: '5Min',
  symbol: 'QQQ',
  indicators: {
    ema: true,
    vwap: true,
    levels: true,  // prev H/L, ORB, ODC
    rsi: true,
    macd: true,
  },
  setTimeframe: (tf) => set({ timeframe: tf }),
  setSymbol: (sym) => set({ symbol: sym }),
  toggleIndicator: (key) => set((state) => ({
    indicators: { ...state.indicators, [key]: !state.indicators[key] }
  })),
}))
```

---

## lightweight-charts v5 Integration Pattern

```jsx
import { createChart } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

function CandlestickChart({ bars }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current) return

    chartRef.current = createChart(containerRef.current, {
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: { borderColor: '#374151', timeVisible: true },
    })

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    // Cleanup on unmount — CRITICAL to prevent memory leaks
    return () => {
      chartRef.current.remove()
      chartRef.current = null
    }
  }, [])

  // Update data when bars change
  useEffect(() => {
    if (!seriesRef.current || !bars?.length) return
    seriesRef.current.setData(bars)
    chartRef.current.timeScale().fitContent()
  }, [bars])

  return <div ref={containerRef} style={{ width: '100%', height: '500px' }} />
}
```

---

## Color System

All colors defined in `src/constants/chart.js`. Nick's exact EMA colors are non-negotiable.

```js
export const COLORS = {
  // UI
  background: '#0a0a0a',
  surface: '#111111',
  border: '#1f2937',
  text: '#d1d5db',
  textMuted: '#6b7280',

  // Candles
  bullish: '#22c55e',
  bearish: '#ef4444',

  // Nick's EMA stack — do not change these colors
  ema9:   '#3b82f6',   // blue
  ema48:  '#22c55e',   // green
  ema200: '#e5e7eb',   // white

  // VWAP system
  vwap:        '#06b6d4',   // cyan
  vwapBand1:   '#0891b2',   // darker cyan
  vwapBand2:   '#0e7490',   // even darker

  // Levels
  prevHigh:    '#fbbf24',   // gold/amber
  prevLow:     '#fbbf24',   // gold/amber
  orbZone:     '#1e3a5f',   // dark blue (semi-transparent)
  openOfDay:   '#94a3b8',   // light gray

  // S/R
  support:     '#22c55e',
  resistance:  '#ef4444',

  // Subcharts
  rsi:         '#a78bfa',   // violet
  macdLine:    '#3b82f6',   // blue
  macdSignal:  '#f97316',   // orange
  macdHistPos: '#22c55e',
  macdHistNeg: '#ef4444',
}
```

---

## Styling Approach

Dark terminal theme throughout. Tailwind utility classes for layout and spacing.
Chart colors defined in `constants/chart.js` and passed to lightweight-charts config.

Key layout structure:
```
┌─────────────────────────────────────────────────┐
│ MacroStatusBar (fixed top strip)                │
├──────────────────────────┬──────────────────────┤
│                          │ ATR Gauge            │
│   Main Chart             │ Day Type Banner      │
│   (candlestick +         │ Price Display        │
│    all overlays)         │ Indicator Toggles    │
│                          │                      │
├──────────────────────────┴──────────────────────┤
│ RSI Pane                                        │
├─────────────────────────────────────────────────┤
│ MACD Pane                                       │
├─────────────────────────────────────────────────┤
│ TimeframeSelector | StatusBar                   │
└─────────────────────────────────────────────────┘
```

---

## Vercel Deployment

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

Add env vars in Vercel dashboard under Project Settings → Environment Variables.
Reference variable names in vercel.json, never actual values.

```bash
# Test production build locally before deploying
npm run build && npm run preview
```
