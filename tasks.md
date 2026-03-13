# Task List — Loompia

> Living task board. Update status as work progresses.
> 🔲 not started | 🔄 in progress | ✅ done | ❌ blocked

---

## ✅ Completed Sprint — Project Bootstrap

### Setup & Infrastructure
- ✅ Vite 7 + React 18 scaffolded in Loompia/ root (not a subdirectory)
- ✅ All deps installed — lightweight-charts v5, axios, zustand, @tanstack/react-query v5, vitest v3
- ✅ Zero vulnerabilities
- ✅ `.env.example` committed, `.env` in `.gitignore`
- ✅ First commit on `main` — 36 files
- ✅ `.env` with real Alpaca keys — configured
- 🔲 Create `develop` branch + push to GitHub (do after app is verified working)

---

## ✅ Phase 1 — Core Chart + Essential Levels — COMPLETE

**Committed on `main`** — 33/33 tests passing, `npm run build` clean

### Step 1 — Data layer first (verify bars in console BEFORE touching the chart)
- 🔲 `src/utils/validateEnv.js` — validate all VITE_* vars on startup, throw clear errors
- 🔲 `src/services/alpaca.js` — axios instance, auth headers, base URLs from env
- 🔲 `src/services/queryClient.js` — TanStack Query client, staleTime 30s, retry 1
- 🔲 `src/hooks/useAlpacaBars.js` — TanStack Query hook, fetches bars by timeframe
- 🔲 **Verify**: `console.log(bars)` in App.jsx confirms real QQQ data before any chart work
- 🔲 `src/store/useChartStore.js` — Zustand store: timeframe, symbol, indicator toggles
- 🔲 `src/constants/chart.js` — all colors (Nick's EMA colors), timeframes, periods
- 🔲 `src/utils/indicators.js` — EMA math function (+ vitest unit tests)
- 🔲 `src/utils/levels.js` — calculates prev day H/L, open of day from bar data
- 🔲 **RUN: `npm run test`** — all indicator math tests pass before building UI

### Step 2 — Chart Components
- 🔲 `src/components/chart/CandlestickChart.jsx` — lightweight-charts **v5** init
- 🔲 `src/components/chart/ChartContainer.jsx` — responsive layout wrapper
- 🔲 `src/components/chart/TimeframeSelector.jsx` — 1m/5m/15m/1h/4h/1D buttons (reads/writes Zustand)
- 🔲 `src/components/chart/PriceDisplay.jsx` — live price + % change
- 🔲 `src/components/indicators/EMAOverlay.jsx` — EMA 9 (blue), EMA 48 (green), EMA 200 (white)
- 🔲 `src/components/indicators/LevelOverlay.jsx` — prev day H/L horizontal lines, open of day line
- 🔲 `src/components/ui/StatusBar.jsx` — market open/closed status, last updated time
- 🔲 `src/App.jsx` + `src/main.jsx` — wire QueryClientProvider + ZustandProvider + chart
- 🔲 Dark terminal styling — background #0a0a0a, grid lines #1f2937

### Tests & Verification
- 🔲 **RUN: `npm run test`** — all unit tests green
- 🔲 Chart loads with QQQ candlestick data
- 🔲 Prev day H/L lines visible and correctly priced
- 🔲 EMA 9/48/200 render in correct colors
- 🔲 Timeframe switcher reloads data correctly
- 🔲 Loading and error states display correctly
- 🔲 **RUN: `npm run build`** — zero errors before committing

- 🔲 **COMMIT:** `feat(chart): phase 1 core chart with prev H/L levels and EMA stack`
- 🔲 **PR:** `feature/core-chart` → `develop`

---

## ✅ Phase 2 — ORB Zone + VWAP Bands + RVOL — COMPLETE

**Built during Phase 1** — all math and components were implemented together.

- ✅ VWAP + 1σ/2σ bands in `indicators.js` + `VWAPOverlay.jsx`
- ✅ ORB zone in `levels.js` + `LevelOverlay.jsx`
- ✅ RVOL highlighting in `indicators.js` + `CandlestickChart.jsx` (amber ≥1.5x, red ≥2.0x)
- ✅ Indicator toggles in Zustand store + `IndicatorToggle.jsx`

---

## ✅ Phase 3 — RSI, MACD, ATR Gauge, Day Type Banner — COMPLETE

**Committed on `main`**

- ✅ RSI(14), MACD(12,26,9), ATR(14) math in `indicators.js`
- ✅ Day type classification in `levels.js`
- ✅ RSI pane + MACD pane with tab view
- ✅ ATR gauge (fuel gauge style, theme-aware)
- ✅ Day type banner (Trend/Range/Chop)

---

## ✅ Phase 4 — S/R Levels + Macro Status Bar — COMPLETE

- ✅ `src/utils/supportResistance.js` — pivot point algorithm, clustering, swing detection
- ✅ `src/utils/supportResistance.test.js` — 12 unit tests passing
- ✅ `src/components/indicators/SROverlay.jsx` — S/R lines (green=support, red=resistance, opacity=strength) + swing markers
- ✅ `src/components/ui/MacroStatusBar.jsx` — QQQ vs 50MA/200MA, bull/bear/neutral pill
- ✅ S/R toggle added to Zustand store + IndicatorToggle
- ✅ 45/45 tests passing, build clean

---

## 🔲 Phase 5 — Live WebSocket

**Branch:** `feature/live-data`

- 🔲 `src/services/websocket.js` — Alpaca WebSocket, auth, reconnect logic
- 🔲 `src/hooks/useAlpacaSocket.js` — subscribe to QQQ bars, emit to chart
- 🔲 Update chart in real time as new bars arrive
- 🔲 Handle market open / market close gracefully
- 🔲 Show "Market Closed" state outside trading hours
- 🔲 **RUN: `npm run build`** — zero errors

- 🔲 **COMMIT:** `feat(data): live WebSocket bar feed`
- 🔲 **PR:** `feature/live-data` → `develop`

---

## 🔲 Phase 6 — Deploy to Vercel

**Branch:** `feature/deploy`

- 🔲 Create `vercel.json`
- 🔲 `npm run build && npm run preview` — verify production build locally
- 🔲 Add env vars to Vercel dashboard
- 🔲 Deploy: `vercel --prod`
- 🔲 Verify live URL works
- 🔲 Merge `develop` → `main`
- 🔲 **COMMIT:** `chore(deploy): vercel config and production deployment`

---

## 🔲 Phase 7 — Stretch Goals

- 🔲 `src/utils/backtest.js` — replay historical days using same indicator math, output win rate / R:R / by day type
- 🔲 Weekly gap tracking panel (unfilled QQQ weekly gaps with distance from current price)
- 🔲 Volume profile (horizontal bars at each price level)
- ✅ Price alert system (browser notification on level hit) — **DONE**: price-level + candle-streak alerts
- 🔲 Multi-symbol watchlist (NVDA, TSLA, SPY alongside QQQ)
- 🔲 Bollinger Bands overlay
- 🔲 RSI divergence detection (auto-annotation)

---

## ❌ Blocked / Needs Input

> Nothing blocked yet.

---

## ✅ Completed

### Alert System (2026-03-13)
- ✅ `src/store/useAlertsStore.js` — Zustand store: addAlert / removeAlert / markTriggered, typed alerts
- ✅ `src/components/ui/NotificationBell.jsx` — bell icon in header (left of Bear/Bull Trend pill)
  - Price Level tab: fires when price crosses above/below a set price
  - Candle Streak tab: fires when N consecutive same-color candles close (e.g. 6 green, 8 red, or either)
  - Live streak readout in form shows current streak count + direction
  - Browser Notification API with permission request on first alert
  - Alert list filtered by active tab; delete always visible; hit alerts show ✓
  - `barsLengthAtCreation` guard: streak alerts only fire on NEW bars, not existing data

### Branding + UI Polish — Session 5 (2026-03-13)
- ✅ Renamed project: `MaydenTheChart` → `Loompia` everywhere (package.json, docs, notifications, comments)
- ✅ `src/components/ui/Logo.jsx` — Boogaloo Filipino-poster font logo replacing plain MAYDEN text
- ✅ `index.html` — Boogaloo font loaded via Google Fonts, page title updated
- ✅ `src/components/ui/SettingsModal.jsx` — gear icon in header opens centered settings modal
- ✅ `src/store/useChartStore.js` — `theme` state persisted to localStorage, defaults to `'dark'`
- ✅ `src/index.css` — CSS custom property theme system (`[data-theme="dark"]` / `[data-theme="loompia"]`)
- ✅ **Dark theme** — unchanged terminal black (#0a0a0a), blue accents
- ✅ **Loompia theme** — near-black (#080808) with ember-orange accent (#C85818), warm stone text (#D0C8B8)
- ✅ `CandlestickChart`: theme-aware candle colors (terracotta red + forest green in loompia); fixed init-time color bug via `themeRef`
- ✅ `ATRGauge`: theme-aware red/yellow/green colors; bolded label + taller gauge bar
- ✅ Sidebar section labels (SYMBOL / TIMEFRAME / INDICATORS): bumped to `text-gray-300 font-semibold`
- ✅ TimeframeSelector + IndicatorToggle buttons: `font-semibold text-gray-300` for inactive state

### Phase 4 + UI Polish — Session 6 (2026-03-13)
- ✅ `src/utils/supportResistance.js` — pivot-based S/R detection with clustering
- ✅ `src/utils/supportResistance.test.js` — 12 unit tests (swing points, clustering, full pipeline)
- ✅ `src/components/indicators/SROverlay.jsx` — S/R lines + swing high/low arrow markers
- ✅ `sr` toggle added to Zustand store + IndicatorToggle
- ✅ Indicator toggle labels: warm cream color (#e8e0d0 on, #d1ccc4 off) matching timeframe/symbol style
- ✅ QQQ symbol: Inter 800 golden gradient (modern, clean)
- ✅ `index.html`: Inter font loaded from Google Fonts
- ✅ SROverlay crash fix: marker time validation against bar times + try/catch guard

### Data / Chart Fixes (2026-03-13)
- ✅ `useAlpacaBars`: `todayKey` in queryKey → cache invalidates at day boundary
- ✅ `useAlpacaBars`: `refetchInterval` 60s intraday / 5min daily → chart stays live
- ✅ `CandlestickChart`: `tickMarkFormatter` → x-axis tick marks display ET (not UTC)
- ✅ `CandlestickChart`: `localization.timeFormatter` → crosshair tooltip in ET
- ✅ `CandlestickChart`: VOL label overlaid above volume bars
- ✅ `App.jsx`: chart polling uses `chartRef.current` directly (not a captured snapshot) → overlays re-attach correctly after any chart re-creation / HMR
