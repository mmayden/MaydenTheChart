# Lumpia — Session Memory

## Project Docs Location
All spec docs are in the ROOT (not .roo/): project.md, tasks.md, indicators.md, architecture.md

## Stack (locked)
- Vite 7 + @vitejs/plugin-react 4.7 (Vite 8 not yet compatible)
- lightweight-charts v5 (NOT v4 — v5 has native multi-pane)
- TanStack Query v5, Zustand v4, Axios, Tailwind CSS 3
- Vitest v3 for tests
- Node 22, npm 10

## Phase 1 Status (2026-03-13) — COMPLETE, committed
All Phase 1 files built and tested:
- src/utils/indicators.js — EMA, VWAP, ATR, RVOL, RSI, MACD — all return { series, signal }
- src/utils/levels.js — getPreviousLevels, getORBZone, getOpenOfDay, classifyDayType
- src/utils/validateEnv.js
- src/services/alpaca.js + queryClient.js
- src/hooks/useAlpacaBars.js
- src/store/useChartStore.js
- src/constants/chart.js — all colors (EMA colors locked), timeframe configs
- src/components/chart/CandlestickChart.jsx — lw-charts v5, forwardRef pattern
- src/components/indicators/EMAOverlay, VWAPOverlay, LevelOverlay
- src/components/ui/StatusBar, IndicatorToggle
- 33/33 unit tests passing, zero build errors

## Key Patterns
- Every indicator fn: returns { series: [{time,value}], signal: {value, bias, strength} }
- Chart overlays receive `chart` instance as prop (not ref), add their own series
- LevelOverlay uses candleSeries.createPriceLine() NOT separate series
- VWAP resets by comparing toDateString() of bar timestamps shifted to ET
- Timeframe gating: TIMEFRAME_CONFIG[tf].showVWAP / showORB control overlay visibility

## Next: Phase 2
Branch: feature/levels-vwap
- supportResistance.js (pivot clustering)
- DayTypeBanner component
- ATRGauge component
- MacroStatusBar component
- VWAPOverlay already built — just needs visibility testing

## MACD test note
Linear price series → MACD histogram converges to 0 (correct behavior).
Tests use quadratic/accelerating prices to test bullish bias.
