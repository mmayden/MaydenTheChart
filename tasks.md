# Task List — Lumpia

> Living task board. Update status as work progresses.
> 🔲 not started | 🔄 in progress | ✅ done | ❌ blocked

---

## ✅ Completed Sprint — Project Bootstrap

### Setup & Infrastructure
- ✅ Vite 7 + React 18 scaffolded in Lumpia/ root (not a subdirectory)
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
- 🔲 `src/constants/chart.js` — all colors (EMA colors), timeframes, periods
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

## ✅ Phase 5 — Live WebSocket — COMPLETE

- ✅ `api/ws-auth.js` — serverless credential proxy (bearer token protected)
- ✅ `src/services/websocket.js` — Alpaca WebSocket manager (auth, subscribe, exponential backoff reconnect)
- ✅ `src/hooks/useAlpacaSocket.js` — market-hours gating, 1-min bar aggregation into selected timeframe, TanStack Query cache injection
- ✅ `src/store/useChartStore.js` — added `wsStatus`, `isMarketOpen` state
- ✅ `src/hooks/useAlpacaBars.js` — REST polling disabled when WS is streaming
- ✅ `src/components/ui/StatusBar.jsx` — Live/Connecting/Reconnecting/Market Closed states
- ✅ `src/App.jsx` — mounts `useAlpacaSocket()`
- ✅ `.env.example` + `.env` — `WS_AUTH_TOKEN` + `VITE_WS_AUTH_TOKEN`
- ✅ 45/45 tests passing, build clean

---

## ✅ Phase 6 — Deploy to Vercel — COMPLETE

- ✅ Create `vercel.json` — rewrites for API routes + SPA fallback
- ✅ `api/bars.js` — Vercel serverless function proxies Alpaca API (keys server-only)
- ✅ `src/services/alpaca.js` rewritten to call `/api/bars` proxy instead of direct Alpaca
- ✅ Removed `VITE_` prefix from all env vars — keys never reach browser bundle
- ✅ `vite.config.js` — dev proxy to `localhost:3000` for `vercel dev`
- ✅ Add env vars to Vercel dashboard (ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_DATA_URL)
- ✅ Deployed to Vercel — build succeeds, 4 successful deployments
- ✅ Custom domain `cheechart.space` added via CNAME → `cname.vercel-dns.com`
- ✅ SSL verified working (2026-03-14)

---

## ✅ Phase 7a — Multi-Symbol Support (Base) — COMPLETE

- ✅ Stripped QQQ-specific features, saved parameters to `qqq-specific-features.txt`
- ✅ Removed `MacroStatusBar` from UI (file kept for future re-integration)
- ✅ Removed macro status computation + `useDailyBars` import from `App.jsx`
- ✅ `src/components/chart/SymbolInput.jsx` — click-to-edit ticker input (Enter to submit, Escape to cancel, auto-uppercase)
- ✅ `src/services/websocket.js` — `getSymbol` callback replaces hardcoded `['QQQ']` subscription
- ✅ `src/components/ui/NotificationBell.jsx` — alert notifications use dynamic `selectedSymbol`
- ✅ `src/components/ui/SettingsModal.jsx` — subtitle changed to "Appearance"
- ✅ `src/index.css` — removed `.qqq-symbol` gradient CSS rule
- ✅ Loading message uses dynamic symbol
- ✅ 45/45 tests passing, build clean

---

## ✅ Phase 7a.1 — Symbol Autocomplete — COMPLETE

- ✅ `src/constants/chart.js` — `SYMBOL_SUGGESTIONS` array (~80 popular tickers, suggestion-only, not a restriction)
- ✅ `src/components/chart/SymbolInput.jsx` — autocomplete dropdown with:
  - Prefix-match filtering as user types
  - Usage frequency sorting (most-selected symbols first)
  - localStorage persistence (`cheechart-symbol-usage`)
  - Arrow key navigation + Enter to select
  - Bold matched prefix in suggestions
  - Max 8 visible suggestions
  - Alpaca validation still gates final submission
- ✅ 45/45 tests passing, build clean

---

## ✅ ATR Gauge Fix — Daily ATR(14) (2026-03-14)

- ✅ ATR gauge was computing ATR(14) from intraday bars (e.g. 14 five-minute candles) instead of 14 daily candles
- ✅ Re-added `useDailyBars` import to `App.jsx` — needed for ATR budget calculation (was removed in Phase 7a because macro status bar was the only consumer)
- ✅ `atrGauge` useMemo now uses `dailyBars` for ATR(14) and intraday `bars` for today's session range
- ✅ 45/45 tests passing, build clean

---

## ✅ Volume Bar Color Update (2026-03-14)

- ✅ Replaced RVOL-based volume coloring (gray/amber/red) with candle-direction coloring (green up / red down, semi-transparent)
- ✅ Removed `relativeVolume` import from CandlestickChart (math still available in `indicators.js` for backtester)
- ✅ Updated `VOLUME_UP_COLOR` / `VOLUME_DOWN_COLOR` constants (replaced `VOLUME_NORMAL_COLOR` / `VOLUME_RVOL_COLOR` / `VOLUME_HIGH_COLOR`)
- ✅ 45/45 tests passing, build clean

---

## ✅ ODC Line Fix — Session-Scoped (2026-03-14)

- ✅ ODC (Open of Day Candle) line was rendering as a full-width `createPriceLine`, bleeding across all visible days
- ✅ `src/utils/levels.js` — `getOpenOfDay()` now returns `{ price, startTime, endTime }` instead of just the price number
- ✅ `src/components/indicators/LevelOverlay.jsx` — ODC now rendered as a `LineSeries` with two data points (session start → end), scoped to today only
- ✅ `LevelOverlay` accepts new `chart` prop for series creation; `App.jsx` passes it
- ✅ `indicators.md` — updated ODC section with rendering details and code signature
- ✅ Build clean

---

## ✅ Indicator Deep Assessment — 6 Fixes (2026-03-14)

- ✅ VWAP: use ET timezone for day reset instead of browser local time
- ✅ ATR: percentage-based strength thresholds for multi-symbol support
- ✅ RVOL: incorporate candle direction (close vs open) into bias signal
- ✅ MACD: renamed return fields (`signal`→`signalLine`, `signalObj`→`signal`) per contract
- ✅ `levels.js`: accept optional `byDay` param to eliminate redundant `groupBarsByDay()` calls
- ✅ `App.jsx` / `LevelOverlay.jsx`: pre-compute `byDay` once, share across all consumers
- ✅ New: 32 unit tests for `levels.js` (groupBarsByDay, getPreviousLevels, getOpenOfDay, getORBZone, classifyDayType)
- ✅ ODC color changed from near-white (#f3f4f6) to amber dashed (#f59e0b) — distinct from EMA 200
- ✅ 77/77 tests passing, build clean

---

## ✅ QOL — Crosshair Legend + Toasts + Viewport Persistence (2026-03-14)

- ✅ `src/components/ui/CrosshairLegend.jsx` — OHLCV data overlay on crosshair hover (ref-based DOM updates, no React re-renders per mouse move)
- ✅ `src/hooks/useToast.js` — Zustand toast store (add/remove, auto-dismiss, max 5 visible)
- ✅ `src/components/ui/ToastContainer.jsx` — fixed bottom-right toast renderer with slide-in animation
- ✅ `src/hooks/useViewportPersistence.js` — preserves zoom/scroll across live data updates, only fitContent on symbol/TF change
- ✅ `CandlestickChart.jsx` — integrated viewport persistence (conditional fitContent)
- ✅ `SymbolInput.jsx` — toast on symbol change (success/error)
- ✅ `App.jsx` — smooth loading overlay (semi-transparent when previous data exists), wired CrosshairLegend + ToastContainer
- ✅ `feature-ideas.md` — keyboard shortcuts idea documented
- ✅ 77/77 tests passing, build clean

---

## ✅ Keyboard Shortcut Stability Fix (2026-03-15)

- ✅ `src/hooks/useKeyboardShortcuts.js` — debounced rapid keypresses (150ms) to prevent chart blackout from spamming 1-6 keys
- ✅ Added `cancelQueries()` before `invalidateQueries()` to abort stale in-flight fetches during rapid switching
- ✅ Cleanup: `clearTimeout` on unmount to prevent memory leaks
- ✅ `src/hooks/useAlpacaBars.js` — added `placeholderData: keepPreviousData` so chart shows previous timeframe's data while new data loads (prevents flash to black)
- ✅ Build clean

---

## ✅ Code Health Audit (2026-03-15)

- ✅ 77/77 tests passing — no stale or broken tests
- ✅ Bug fix: ResizeObserver null guard in `CandlestickChart.jsx`, `IndicatorTabView.jsx` (RSI + MACD mini charts) — prevents crash on fast unmount
- ✅ Bug fix: `useToast.js` toast IDs changed from `Date.now()` to `crypto.randomUUID()` — prevents collision on rapid toast creation
- ✅ Smell fix: deduplicated 3 identical `normalizeBar` functions into shared `src/utils/normalizeBar.js`
- ✅ Smell fix: `LevelOverlay` now accepts `byDay` prop from App.jsx — eliminates redundant `groupBarsByDay()` call
- ✅ Smell fix: `SettingsModal` now closes on Escape key (was backdrop-click only)
- ✅ 77/77 tests, build clean

---

## ✅ Phase 8 — Saved Chart Presets — COMPLETE

**Committed on `main`** — 169/169 tests passing, build clean

- ✅ `src/constants/presets.js` — 4 default presets (Clean, Full, Scalp, Swing)
- ✅ `src/store/usePresetsStore.js` — Zustand store with applyPreset, saveCurrentAsPreset, renamePreset, deletePreset, markModified, localStorage persistence
- ✅ `src/components/ui/PresetSelector.jsx` — 2×2 pill grid for defaults, expandable custom list, "Save current" inline flow, rename/delete on hover
- ✅ `src/store/usePresetsStore.test.js` — 21 unit tests (apply, save, rename, delete, localStorage round-trip, markModified)
- ✅ Preset switching applies correct indicator states + timeframe, toast notification
- ✅ Custom presets survive page refresh via localStorage
- ✅ Default presets cannot be deleted or renamed
- ✅ Manual indicator/timeframe changes call `markModified()` — shows "Custom (modified)" state

---

## ✅ QOL Fixes — RVOL, Preset Sync, API Pagination (2026-03-15)

- ✅ RVOL toggle wired up — volume bars highlight amber (≥1.5x) and red (≥2x) when RVOL is enabled
- ✅ RSI/MACD tab toggles call `markModified()` — preset system correctly tracks manual changes
- ✅ Timeframe selector calls `markModified()` — prevents silent snap-back when re-clicking preset
- ✅ VWAP toggle disabled + dimmed on non-intraday TFs (1h/4h/1D) with tooltip
- ✅ `api/bars.js` pagination — follows Alpaca `next_page_token` for complete data (fixes 4h truncation)
- ✅ `api/bars.js` symbol regex accepts dotted tickers (e.g. `BRK.B`)
- ✅ 169/169 tests passing, build clean

---

## ✅ Phase 9 — Multi-View + Stretch Goals — COMPLETE

**192/192 tests passing, build clean**

### Architecture
- ✅ Multi-view routing (react-router-dom): ChartView (`/`) + DashboardView (`/dashboard`)
- ✅ `src/App.jsx` rewritten from 288-line monolith to 55-line router shell
- ✅ `src/components/layout/TopNav.jsx` — shared navigation (Logo, Chart/Dashboard links, Cmd+K, Bell, Settings)
- ✅ `src/components/layout/Sidebar.jsx` — extracted chart controls, mobile drawer overlay
- ✅ `src/hooks/useURLState.js` — bidirectional URL sync (?s=QQQ&tf=5m&p=full)

### Command Palette + Alerts
- ✅ `src/components/ui/CommandPalette.jsx` — Cmd+K search (symbols, timeframes, indicators, presets, navigation)
- ✅ `src/components/panels/AlertsPanel.jsx` — right slide-out panel (replaces old dropdown)
- ✅ Keyboard shortcuts expanded: [/] cycle presets, Cmd+K palette
- ✅ Settings modal: added Shortcuts tab (keyboard reference)

### New Indicators
- ✅ Bollinger Bands (`bollingerBands()` in indicators.js + `BollingerOverlay.jsx`)
- ✅ RSI divergence detection (`detectRSIDivergences()` — helper, not wired to UI yet)
- ✅ `bollinger: false` added to all default presets

### Dashboard
- ✅ `src/utils/backtest.js` — ORB breakout + EMA-cross strategies, same indicator math
- ✅ `src/components/dashboard/BacktestCard.jsx` — strategy selector, stats grid, trade table
- ✅ `src/components/dashboard/TradeJournal.jsx` — trade logging with setup/result/notes/rating
- ✅ `src/components/dashboard/WatchlistCard.jsx` — symbol watchlist (localStorage)
- ✅ `src/store/useJournalStore.js` — CRUD + stats, localStorage persistence

### Mobile Responsive
- ✅ Sidebar: fixed drawer overlay on <768px, collapsible on desktop
- ✅ TopNav: hamburger menu on mobile (chart view only)
- ✅ Responsive grid layouts on dashboard cards

### Quality Audit Fixes
- ✅ Fixed z-index collision (AlertsPanel backdrop z-[45] vs Sidebar z-40)
- ✅ Fixed TradeJournal stats reactivity (was using getState(), now computed from entries)
- ✅ Added useJournalStore.test.js (8 tests)
- ✅ Updated CLAUDE.md, project.md, tasks.md, indicators.md

---

## ✅ Phase 10A — Architecture Consolidation (Single-Page Panel System) — COMPLETE

**197/197 tests passing, build clean**

- ✅ `src/store/useChartStore.js` — `activePanel` state replaces `alertsPanelOpen` (`null | 'alerts' | 'backtest' | 'journal' | 'watchlist'`), `setActivePanel()` toggle, `closePanel()`
- ✅ `src/components/layout/RightPanel.jsx` — generic slide-out panel shell (desktop 340px, mobile full-screen overlay)
- ✅ `src/components/panels/BacktestPanel.jsx` — ORB/EMA-cross backtester in panel format
- ✅ `src/components/panels/JournalPanel.jsx` — trade journal CRUD in panel format
- ✅ `src/components/panels/WatchlistPanel.jsx` — symbol watchlist in panel format
- ✅ `src/components/panels/AlertsPanel.jsx` — refactored: content-only, RightPanel handles chrome
- ✅ `src/App.jsx` — single-page: inlined ChartView, wired RightPanel alongside chart
- ✅ `src/main.jsx` — removed BrowserRouter wrapper
- ✅ `src/components/layout/TopNav.jsx` — panel toggle icons (backtest/journal/watchlist/alerts) replace Chart/Dashboard nav tabs
- ✅ `src/components/ui/CommandPalette.jsx` — "Panel" commands replace "Navigate", removed react-router-dom
- ✅ `src/hooks/useKeyboardShortcuts.js` — A/B/J/W panel toggles, Esc closes active panel
- ✅ `src/hooks/useURLState.js` — `?panel=backtest` param, removed pathname handling
- ✅ `src/components/ui/SettingsModal.jsx` — Panels shortcuts section added
- ✅ `src/store/useChartStore.test.js` — 5 new activePanel tests
- ✅ Deleted: `src/views/ChartView.jsx`, `src/views/DashboardView.jsx`, `src/views/` directory
- ✅ `npm uninstall react-router-dom` — dependency removed

---

## ✅ Phase 10B — Synthesis Layer ("Damn Factor") — COMPLETE

**225/225 tests passing, build clean**

### Confluence Score
- ✅ `src/utils/confluence.js` — weighted score (Day Type 3x, EMA Stack 3x, VWAP 2x, ATR 2x, RSI 1x, MACD 1x)
- ✅ Returns: `{ score, bias, level, reasons[], warnings[] }`
- ✅ `src/utils/confluence.test.js` — 19 unit tests (all bull, all bear, mixed, chop, range, ATR warnings, RSI extremes, EMA stack, MACD, partial data, null values, score bounds)
- ✅ `src/components/ui/ConfluenceBar.jsx` — traffic light pill + expandable dropdown breakdown
- ✅ Positioned in chart sub-header between PriceDisplay and DayTypeBanner

### Multi-Timeframe Status Strip
- ✅ `src/components/ui/MTFStrip.jsx` — colored dot pills for 5m/15m/1h/4h/1D EMA alignment
- ✅ `src/hooks/useMTFSignals.js` — TanStack Query parallel fetch across 5 timeframes, 2min staleTime
- ✅ Green = full bull stack (9>48>200), Red = full bear, Yellow = partial, Gray = mixed

### Backtester Upgrade
- ✅ `backtestVWAPBounce()` — VWAP touch + bounce strategy with optional day type filter
- ✅ `enrichTradesWithDayType()` — retroactively classifies trades by day type
- ✅ `statsByDayType()` — breakdown stats grouped by trend-bull/bear/chop/range
- ✅ `equityCurve()` — cumulative P&L series for visualization
- ✅ BacktestPanel: 3 strategies (ORB/EMA Cross/VWAP Bounce), SVG equity curve, collapsible day type breakdown
- ✅ 9 new backtest tests (VWAP Bounce shape/stats, equityCurve, statsByDayType, enrichTrades)

---

## ✅ Phase 10C — Panel Content Upgrades — COMPLETE

**225/225 tests passing, build clean**

### Watchlist with Live Prices
- ✅ `api/snapshot.js` — Vercel serverless proxy for Alpaca snapshots endpoint (multi-symbol, validates input, computes change/changePct)
- ✅ `src/hooks/useWatchlistQuotes.js` — TanStack Query hook, 30s auto-refresh, only active when watchlist panel open
- ✅ WatchlistPanel: symbol + live price + daily % change (green/red), click to switch chart, loading spinner

### Journal Analytics
- ✅ Win rate by setup type (clickable to filter entries)
- ✅ Current/longest streak tracking
- ✅ Rating correlation (win rate per rating level 1-5)
- ✅ Filter tabs: All/Win/Loss + setup type filter
- 🔲 Heat calendar deferred to Phase 11 (nice-to-have, not critical)

### QOL Enhancements
- ✅ Sound alerts: Web Audio API ping (880Hz A5, 300ms decay), off by default, toggle in Settings → Appearance
- ✅ `soundAlerts` preference in useChartStore (localStorage persisted)
- ✅ Session stats in status bar: "Today: Nt NW NL" from journal entries for current day

---

## ✅ Phase 11 — Polish + Mobile + Security Hardening — COMPLETE

**257/257 tests passing, build clean. Main bundle 226KB + 164KB lightweight-charts + 81KB vendor-api (6 lazy chunks).**

### 11A — Security Hardening + Code Splitting
- ✅ `src/utils/validate.js` — localStorage schema validation (presets, journal, watchlist, symbol usage)
- ✅ `src/utils/validate.test.js` — 29 unit tests
- ✅ Wired validators into `usePresetsStore`, `useJournalStore`, `WatchlistPanel`, `SymbolInput`
- ✅ API error sanitization: `api/bars.js` + `api/snapshot.js` never leak upstream status codes
- ✅ Notification API feature detection guard in `useAlertChecker.js`
- ✅ Code splitting: `React.lazy()` for 4 right panels + SettingsModal + CommandPalette
- ✅ Vite `manualChunks`: lightweight-charts (164KB) + vendor-api (81KB) in separate chunks
- ✅ `vercel.json` CSP updated: `worker-src 'self'; manifest-src 'self'; img-src 'self' data: blob:`

### 11B — CSS Theme Refactor + Touch + Snapshot
- ✅ Eliminated 33 `!important` CSS overrides → 16 semantic utility classes (`.border-theme`, `.text-theme-muted`, etc.)
- ✅ Touch targets: `@media (pointer: coarse)` 44px minimum on all interactive elements
- ✅ `src/hooks/useSwipeGesture.js` — horizontal swipe detection, wired in App.jsx (right=open sidebar, left=close)
- ✅ `src/utils/snapshot.js` — chart screenshot with watermark + clipboard/download
- ✅ Cmd+Shift+S keyboard shortcut → `cheechart:snapshot` custom event
- ✅ "Chart Snapshot" command in CommandPalette, shortcut in SettingsModal

### 11C — PWA + Onboarding
- ✅ `public/manifest.json` — PWA manifest (standalone display, theme #0a0a0a)
- ✅ `public/sw.js` — network-first service worker (API bypasses cache, static assets cached)
- ✅ `public/icons/icon-192.png`, `icon-512.png` — placeholder icons
- ✅ `index.html` — manifest link, theme-color meta, apple-touch-icon
- ✅ `src/main.jsx` — service worker registration on load
- ✅ `vercel.json` — rewrite exceptions for sw.js, manifest.json, icons
- ✅ `src/components/ui/OnboardingTour.jsx` — 4-step tooltip tour (Day Type → ATR → Presets → Cmd+K)
- ✅ `data-tour` attributes on DayTypeBanner, Sidebar (presets + ATR), TopNav (Cmd+K)

### UX Polish — Per-Panel Colors + Nav Animations (2026-03-15)
- ✅ Per-panel icon colors: unique CSS custom property per button across all 3 themes
  - Dark: alerts `#e5a54b`, watchlist `#5bc0be`, backtest `#a78bfa`, journal `#f87171`, cmd-palette `#a78bfa`
  - Terminal: alerts `#b8a040`, watchlist `#68c0a8`, backtest `#88a0d0`, journal `#c8a050`, cmd-palette `#9080c0`
  - Lumpia: alerts `#c8a040`, watchlist `#70b8a0`, backtest `#e07050`, journal `#88b870`, cmd-palette `#a88098`
- ✅ Settings gear unique color per theme: dark `#22d3ee` (cyan), terminal `#58d8b0` (mint), lumpia `#e8c088` (warm gold)
- ✅ Replaced remaining hardcoded Tailwind classes: `bg-blue-600` → `.btn-primary`, `bg-[#0a0a0a]` → `.bg-input`, `accent-blue-500` → `accentColor: var(--accent)`, `border-gray-500` → `.border-theme-mid`
- ✅ Panel button order: alerts → watchlist → backtest → journal
- ✅ Nav hover micro-animations (CSS-only keyframes, all pop 1.25-1.4x):
  - Bell: shakes 24° at 1.3x scale
  - Watchlist: bounces up with translateY oscillation
  - Backtest: EKG double-tap pulse to 1.4x
  - Journal: tilts open 12° from left spine at 1.25x
  - Search: bouncy spring zoom to 1.3x
  - Settings gear: 60° spin + themed glow drop-shadow
- ✅ Sound alerts default to ON for new users (localStorage check flipped: `!== 'false'`)

---

## ✅ Comprehensive Audit — Security + Testing + Architecture + Build (2026-03-15)

**274/274 tests passing, build clean, ESLint 0 errors**

### Security Hardening
- ✅ Rate limiting on all 3 API endpoints: `ws-auth` 5/IP/min, `bars` 60/IP/min, `snapshot` 30/IP/min (in-memory, best-effort per serverless instance)
- ✅ SSRF guard: `ALPACA_DATA_URL` validated against `ALLOWED_DATA_HOSTS` allowlist in `bars.js` + `snapshot.js`
- ✅ Symbol regex validation: `useURLState.js` URL param `?s=` now validated against `/^[A-Z]{1,10}(\.[A-Z]{1,2})?$/`
- ✅ Symbol regex validation: `WatchlistPanel.jsx` `addSymbol()` rejects invalid input
- ✅ ISO date regex anchored with `$` in `bars.js` — no trailing garbage; fixed to allow optional milliseconds (`.000`) since `Date.toISOString()` always includes them
- ✅ ErrorBoundary shows generic message in production, raw error only in dev
- ✅ Service worker cache versioned (`cheechart-v2`) — invalidates stale caches on deploy
- ✅ `ws-auth.js` documents credential exposure risk (bearer token ships in client bundle)
- ✅ Alpaca paper API key rotated

### Testing Improvements
- ✅ `src/utils/timezone.test.js` — 17 new tests: DST spring forward/fall back boundaries, midnight edge cases, market open/close times
- ✅ `backtest.test.js` deterministic: replaced `Math.random()` volume with modular formula
- ✅ Removed `if (totalTrades > 0)` empty assertion guards — tests now validate bounds unconditionally

### Code Quality
- ✅ ESLint added: `eslint.config.js` with `@eslint/js` + `eslint-plugin-react-hooks` — 0 errors, 4 minor warnings (unused vars in test files only)
- ✅ `vwapWithBands()` now returns `.series` per CLAUDE.md `{series, signal}` contract (`.vwap` kept for backward compat)
- ✅ Chart polling interval (`App.jsx`) stops after chart found instead of running forever at 100ms
- ✅ Fixed ref-during-render in `CandlestickChart.jsx` (themeRef wrapped in useEffect)
- ✅ Fixed setState-in-effect in `useViewportPersistence.js` (refactored to useMemo)
- ✅ Fixed missing `byDayProp` dependency in `LevelOverlay.jsx` useEffect
- ✅ Removed dead code: `getRect()` in OnboardingTour, unused `rsi` import in backtest.js, unused `todayKey` in levels.js
- ✅ Fixed unused `theme` param in CrosshairLegend (renamed to `_theme`)
- ✅ Suppressed dev-gated console.log in websocket.js with eslint-disable

### Architecture Assessment (no changes needed)
- ✅ Clean separation of concerns: pure utils, idiomatic Zustand selectors, proper TanStack Query v5
- ✅ No class components (except ErrorBoundary — required by React), no anti-patterns
- ✅ All cleanup (intervals, listeners, observers, WS) verified correct — no memory leaks
- ✅ 0 npm vulnerabilities, all dependencies current

---

## 📌 Deferred — Mobile Polish (low priority)

> **Pin:** Mobile UX works but is not the focus. Touch targets + swipe gestures are in place.
> Revisit after core desktop features are complete (Phase 12+).

- 🔲 Mobile-specific layout testing + QA pass across iOS Safari / Chrome Android
- 🔲 Panel transitions/animations for mobile overlays
- 🔲 Responsive chart sub-header (confluence bar + MTF strip overflow on narrow screens)
- 🔲 Onboarding tour mobile variant (currently welcome toast only)
- 🔲 Real PWA icons (replace placeholder 1x1 PNGs with branded 192/512 icons)
- 🔲 Lighthouse PWA audit pass

---

## ✅ Phase 12A — Production Hardening — COMPLETE

**274/274 tests passing, build clean, ESLint 0 errors**

- ✅ Static asset cache headers: `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` and `/fonts/*` in `vercel.json`
- ✅ HTML cache header: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` for `/` in `vercel.json`
- ✅ Self-host fonts: Boogaloo (10KB) + Inter 800 (24KB) woff2 in `public/fonts/`, `@font-face` in `src/index.css`, removed Google Fonts `<link>` tags + CSP origins
- ✅ Auto-version service worker: Vite plugin (`serviceWorkerVersion()` in `vite.config.js`) reads `src/sw.js`, injects `cheechart-{hash}` into `CACHE_NAME`, writes to `dist/sw.js`
- ✅ Open Graph + Twitter Card meta tags in `index.html` (`og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`)
- ✅ `prefers-reduced-motion: reduce` media query — disables all nav hover animations, gear spin, panel slides, crosshair fade, button transitions
- ✅ Sentry free tier integration: `@sentry/react` with conditional init via `VITE_SENTRY_DSN` env var (no-op without it), session replay on error only

---

## ✅ Phase 12B — UX Sharpening — COMPLETE

**274/274 tests passing, build clean, ESLint 0 errors**

- ✅ Added Motion v12 library (`motion` package, 125KB lazy chunk)
- ✅ RightPanel: persistent wrapper with CSS width transitions + `AnimatePresence` opacity fade for panel switching
- ✅ Command palette scale+fade entrance/exit animation (`AnimatePresence` internal)
- ✅ Settings modal scale+fade entrance animation (`motion.div` backdrop + card)
- ✅ Skeleton loading states: `.skeleton-shimmer` CSS + `PanelSkeleton` component (Suspense fallback in RightPanel)
- ✅ Accent color customization: 6 presets per theme in `src/constants/accents.js`, Settings UI with color dots, localStorage persistence, overrides 5 CSS variables
- ✅ All animations respect `prefers-reduced-motion` via `useReducedMotion()` hook
- ✅ ESLint config updated: root config files get node globals, `motion` namespace JSX usage suppressed

---

## ✅ Code Quality Audit — React Patterns + Security + Theme Consistency (2026-03-16)

**298/298 tests passing, build clean, ESLint 0 errors**

### Correctness Fixes
- ✅ BollingerOverlay: split series creation (once) from visibility toggle (no more teardown/rebuild on show/hide)
- ✅ EMAOverlay + VWAPOverlay: removed redundant dual visibility effects (data update and visibility are now separate concerns)
- ✅ SymbolInput: fixed stale closure — reads `selectedSymbol` from store at call time via `useChartStore.getState()`
- ✅ App.jsx: chart instance polling runs once on mount, not re-triggered on every `dataUpdatedAt` change
- ✅ SSRF guard: `startsWith()` replaced with `new URL().hostname` exact match in `bars.js` + `snapshot.js`

### Performance Fixes
- ✅ CommandPalette: pre-computed `flatIndexMap` replaces render-time counter mutation (`flatIdx++`)
- ✅ CrosshairLegend: `Map` for O(1) bar lookup per mouse move (was O(n) `.find()` on every crosshair event)
- ✅ Rate limiters: TTL cleanup sweep every 2 minutes + 10K entry cap across all 3 API endpoints (`bars`, `snapshot`, `ws-auth`)

### Theme Consistency (14 files migrated)
- ✅ Added semantic data color system: CSS variables (`--color-bull/bear/warn/info/neutral/badge`) + Tailwind tokens
- ✅ Migrated 30+ hardcoded Tailwind color classes (`text-green-400`, `text-red-400`, `bg-red-500`, etc.) to semantic `.text-bull`, `.text-bear`, `.bg-badge` classes
- ✅ Files updated: StatusBar, TopNav, PriceDisplay, JournalPanel, BacktestPanel, WatchlistPanel, AlertsPanel, ConfluenceBar, SymbolInput, PresetSelector, App.jsx, index.css, tailwind.config.js
- ✅ Removed dead CSS: `.alerts-panel-enter` / `.alerts-panel-enter-active` (Motion replaced these)

### Layout + UX Fixes (2026-03-16)
- ✅ RightPanel: reverted from Motion mount/unmount to persistent wrapper div with CSS `transition-[transform,width,min-width]` — chart resizes seamlessly instead of close-pause-jump
- ✅ Sidebar: reverted to original clean form (pre-audit `dca2cad`) with `transition-all duration-200`
- ✅ All charts switched to `autoSize: true` (lw-charts v5 built-in, replaces manual ResizeObserver)
- ✅ RSI/MACD toggles moved back to sidebar IndicatorToggle (they're indicators, not a separate category)
- ✅ Removed separate RSI/MACD tab button strip below chart
- ✅ RSI/MACD labels via lw-charts watermark (auto-aligned inside plotting area)
- ✅ Mini chart price scales `minimumWidth: 60` for right-edge alignment with main chart
- ✅ Created `bugs.md` tracker and `left-bar-problems.md` audit doc
- 🔲 **BUG-001:** Chart area doesn't expand when sidebar closes — needs DevTools diagnosis (parked)

---

## 🔲 Phase 12C — Dependency Upgrades

> **Goal:** Modernize the stack. All upgrades are incremental version bumps, not rewrites.
> Rationale: security patches (React 19), ecosystem compatibility (Zustand 5 drops
> use-sync-external-store), faster builds (Tailwind 4 Oxide engine), future-proofing.

- 🔲 Zustand 4 → 5.0.11 — use `createWithEqualityFn` if using shallow, update persist middleware, devtools import path
- 🔲 React 18 → 19.2.4 — `useEffectEvent` for WebSocket/chart stale closures, React Compiler opt-in, DoS mitigations
- 🔲 Vite 7 → 8 — version bump, verify build
- 🔲 Tailwind 3 → 4.2.1 — run `npx @tailwindcss/upgrade`, switch to `@tailwindcss/vite` plugin, configure dark mode as `darkMode: 'selector'` (we use `[data-theme]` attributes), verify class renames, remove `tailwind.config.js` (config moves to CSS `@theme`)
- 🔲 Verify: 274+ tests passing, build clean, ESLint 0 errors after all upgrades

---

## 🔲 Phase 12D — Data Provider Abstraction

> **Goal:** Decouple the app from Alpaca so data sources can be swapped via config.
> Keep Alpaca as the only implementation for now.

- 🔲 Create `src/services/dataProvider.js` — provider interface: `fetchBars()`, `subscribe()`, `fetchSnapshot()`
- 🔲 Create `src/services/providers/alpaca.js` — extract existing Alpaca logic into adapter
- 🔲 Rename hooks: `useAlpacaBars` → `useBars`, `useAlpacaSocket` → `useLiveFeed`
- 🔲 Abstract WebSocket layer: extract Alpaca-specific protocol into adapter, generic reconnect + aggregation stays in shared layer
- 🔲 Make serverless proxies provider-aware (env var selects provider, URL builder adapts)
- 🔲 Update `TIMEFRAME_CONFIG` to use adapter pattern for provider-specific timeframe strings

---

## 🔲 Phase 12E — Infinite Scroll

> **Goal:** TradingView/Webull-style endless chart history. Scroll left to load older data on demand.
> Uses lightweight-charts v5 `subscribeVisibleLogicalRangeChange` + `barsInLogicalRange` API.

- 🔲 Create `src/hooks/useInfiniteHistory.js` — core scroll-back logic
  - Subscribe to `subscribeVisibleLogicalRangeChange` on chart timeScale
  - When `barsBefore < 50`, calculate older date range and fetch via provider
  - Deduplicate by timestamp, prepend to existing bars array
  - Save/restore scroll position to prevent viewport jump after `setData()`
  - Debounce scroll trigger (200ms), gate with `isFetching` flag
- 🔲 Enable `enableConflation: true` on chart timeScale options (optimizes rendering for large datasets)
- 🔲 Add per-timeframe page sizes to `TIMEFRAME_CONFIG`: 1m=390 bars/page, 5m=390, 15m=260, 1h=150, 4h=180, 1D=252
- 🔲 IndexedDB cache via Dexie.js — cache fetched bar ranges per symbol+timeframe, instant on revisit
- 🔲 Max bars cap per timeframe: 50K for 1m, 100K for 5m+, unlimited for 1D
- 🔲 "Loading more..." indicator at left edge of chart while fetching
- 🔲 Update `useViewportPersistence.js` — don't `fitContent()` after scroll-back loads
- 🔲 Update all overlay components to handle growing bars array (no architecture change needed — `bars` prop is already single source of truth)

---

## 🔲 Phase 12F — Future Differentiators

- 🔲 Screener — scan watchlist for active setups
- 🔲 Trade replay — step through historical days bar-by-bar with simulated trades
- 🔲 Chart annotations — notes/arrows on chart, saved per symbol
- 🔲 Weekly gap tracking panel
- 🔲 Volume profile (horizontal bars)
- 🔲 RSI divergence chart markers (math exists)
- 🔲 Alert sets per preset
- 🔲 Cloud sync / preset export
- 🔲 4hr EMA cross annotations

---

## ❌ Blocked / Needs Input

> Nothing blocked yet.

---

## ✅ Completed

### Phase 5 — Live WebSocket (2026-03-14)
- ✅ `api/ws-auth.js` — serverless credential proxy, bearer token auth
- ✅ `src/services/websocket.js` — Alpaca WS connection manager: auth → subscribe → reconnect (exp. backoff, max 10 retries, 1s–30s + jitter)
- ✅ `src/hooks/useAlpacaSocket.js` — market-hours gating (9:30–4 ET, weekdays), 1-min bar aggregation into any timeframe via bucket math, injects into TanStack Query cache (`queryClient.setQueryData`)
- ✅ `src/store/useChartStore.js` — `wsStatus` + `isMarketOpen` state
- ✅ `src/hooks/useAlpacaBars.js` — REST polling disabled when `wsStatus === 'subscribed'`
- ✅ `src/components/ui/StatusBar.jsx` — Live (green) / Connecting (yellow) / Reconnecting (red) / Market Closed (gray)
- ✅ `.env` — `WS_AUTH_TOKEN` + `VITE_WS_AUTH_TOKEN` added
- ✅ Note: Vercel dashboard needs `WS_AUTH_TOKEN` + `VITE_WS_AUTH_TOKEN` env vars for production

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
- ✅ Renamed project: `MaydenTheChart` → `Lumpia` everywhere (package.json, docs, notifications, comments)
- ✅ `src/components/ui/Logo.jsx` — Boogaloo Filipino-poster font logo replacing plain MAYDEN text
- ✅ `index.html` — Boogaloo font loaded via Google Fonts, page title updated
- ✅ `src/components/ui/SettingsModal.jsx` — gear icon in header opens centered settings modal
- ✅ `src/store/useChartStore.js` — `theme` state persisted to localStorage, defaults to `'dark'`
- ✅ `src/index.css` — CSS custom property theme system (`[data-theme="dark"]` / `[data-theme="lumpia"]` / `[data-theme="terminal"]`)
- ✅ **Dark theme** — unchanged terminal black (#0a0a0a), blue accents
- ✅ **Lumpia theme** — near-black (#080808) with ember-orange accent (#C85818), warm stone text (#D0C8B8)
- ✅ **Terminal theme** — deep black (#060806) with sage green text (#a8d8a8), vivid green accent (#50d050)
- ✅ Preset delete: two-click confirmation with red-tinted pill capsule, cancel button
- ✅ Preset manage buttons: pill capsule border (theme-aware), always visible, larger hit targets
- ✅ Hover feedback on all preset buttons (default pills, saved presets, "Save current") via `hover:brightness-125`
- ✅ `CandlestickChart`: theme-aware candle colors (terracotta red + forest green in lumpia); fixed init-time color bug via `themeRef`
- ✅ `ATRGauge`: theme-aware red/yellow/green colors; bolded label + taller gauge bar
- ✅ Sidebar section labels (SYMBOL / TIMEFRAME / INDICATORS): bumped to `text-gray-300 font-semibold`
- ✅ TimeframeSelector + IndicatorToggle buttons: `font-semibold text-gray-300` for inactive state

### Vercel Deployment + Security — Session 7 (2026-03-13)
- ✅ `vercel.json` — build config, rewrites, cache headers
- ✅ `api/bars.js` — serverless proxy for Alpaca API (keys never leave server)
- ✅ `src/services/alpaca.js` — rewritten to use `/api/bars` proxy
- ✅ Removed VITE_ prefix from all env vars (ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_DATA_URL)
- ✅ `vite.config.js` — dev proxy /api → localhost:3000
- ✅ Verified zero API keys in production bundle (`grep -c` on dist/assets/*.js = 0)
- ✅ Deployed to Vercel, custom domain cheechart.space configured
- 🔄 SSL cert propagation for cheechart.space (was in progress)

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

### Multi-Symbol Base — Session 9 (2026-03-14)
- ✅ Stripped all QQQ-specific hardcoding to prepare for multi-symbol support
- ✅ Saved QQQ-specific feature parameters to `qqq-specific-features.txt` for future reference
- ✅ Removed `MacroStatusBar` from header (Minervini-style macro filter — QQQ-specific)
- ✅ Removed macro status computation + `useDailyBars` import from App.jsx
- ✅ `src/components/chart/SymbolInput.jsx` — click-to-edit ticker input in sidebar (Enter submits, Escape cancels, auto-uppercase, max 10 chars)
- ✅ `src/services/websocket.js` — new `getSymbol` callback replaces hardcoded `['QQQ']` subscription
- ✅ `src/hooks/useAlpacaSocket.js` — passes store's `selectedSymbol` via `getSymbol`
- ✅ `src/components/ui/NotificationBell.jsx` — alert notifications use dynamic symbol from store
- ✅ `src/components/ui/SettingsModal.jsx` — subtitle changed from "Cheechart QQQ Terminal" to "Appearance"
- ✅ `src/index.css` — removed `.qqq-symbol` gradient text CSS rule
- ✅ `src/App.jsx` — loading message uses dynamic symbol; removed unused `TIMEFRAME_ORDER` import
- ✅ 45/45 tests passing, build clean
