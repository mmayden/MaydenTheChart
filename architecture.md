# Architecture — Lumpia (Cheechart)

> Current as of Phase 12E infinite scroll (2026-03-16). Update this file whenever architecture changes.

---

## Design Principle

**The chart is the gravitational center. You never leave it.**

Single-page app with a panel-based layout. No routing. Tools slide out alongside
the chart — backtester, journal, watchlist, alerts — so you never lose context.
Same pattern as Bloomberg, VS Code, and Linear.

---

## Application Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  TopNav: Logo | 🔔 📋 📊 📓 | ⌘K | ⚙                          │
├────────┬──────────────────────────────────────────┬──────────────┤
│        │  Confluence Bar: 🟢 4/6 Bull — Trend +   │              │
│  Side  │  EMA aligned + VWAP above  ⚠ ATR 72%     │  Right Panel │
│  bar   ├──────────────────────────────────────────┤  (one at a   │
│        │  MTF Strip: 5m Bull | 4h Bear | 1D Neut  │   time)      │
│ Symbol ├──────────────────────────────────────────┤              │
│ TF     │                                          │ [Alerts]     │
│ Preset │          CHART (always visible)           │ [Watchlist]  │
│ Indic. │          + overlays (EMA, VWAP,           │ [Backtest]   │
│ ATR    │            levels, S/R, Bollinger)        │ [Journal]    │
│        ├──────────────────────────────────────────┤              │
│        │  RSI / MACD tab view (mini charts)       │              │
│        ├──────────────────────────────────────────┤              │
│        │  Status bar (WS/Polling + session stats) │              │
└────────┴──────────────────────────────────────────┴──────────────┘
```

**Mobile (<768px):** Sidebar becomes a hamburger drawer overlay. Right panels
become full-screen overlays. Chart fills the viewport.

---

## Data Flow

```
Data Provider (currently Alpaca REST — data.alpaca.markets)
      │
      ▼
api/bars.js (Vercel serverless)     ← rate-limited, SSRF-guarded, paginated
api/snapshot.js                     ← multi-symbol quotes for watchlist
api/ws-auth.js                     ← returns WS credentials (bearer token)
      │
      ▼
services/dataProvider.js            ← provider interface: fetchBars(), fetchSnapshot()
services/providers/alpaca.js        ← Alpaca adapter: normalization, timeframe mapping, WS protocol
      │
      ▼
hooks/useBars.js                    ← TanStack Query: caching, loading, refetch
hooks/useInfiniteHistory.js         ← scroll-back: fetch older bars, prepend to cache
hooks/useDailyBars.js               ← daily bars for ATR gauge
hooks/useMTFSignals.js              ← parallel fetch across 5m/15m/1h/4h/1D
      │
      ├──► utils/indicators.js      ← pure math: EMA, VWAP+bands, ATR, RSI, MACD, Bollinger, RVOL
      ├──► utils/levels.js          ← prev H/L, ORB zone, open of day, day type
      ├──► utils/supportResistance.js  ← pivot-based S/R detection
      ├──► utils/confluence.js      ← weighted synthesis of all signals → score/bias
      └──► utils/backtest.js        ← ORB, EMA-cross, VWAP Bounce strategies

WebSocket (provider-agnostic shell, currently Alpaca wss://stream.data.alpaca.markets/v2/iex)
      │
      ▼
services/websocket.js               ← connection lifecycle, auth via ws-auth proxy,
      │                                exponential backoff reconnect (max 10, 1s-30s)
      │                                delegates protocol to providers/alpaca.js
      ▼
hooks/useLiveFeed.js                ← market-hours gating (9:30-4 ET, weekdays),
      │                                1-min bar aggregation into selected timeframe,
      ▼                                injects into TanStack Query cache

Infinite scroll (on-demand history loading):
hooks/useInfiniteHistory.js         ← subscribes to chart timeScale visible range
      │                                when user scrolls near left edge (barsBefore < 50),
      │                                fetches older page via fetchBars(), deduplicates,
      ▼                                prepends to TanStack Query cache
CandlestickChart.jsx                ← detects prepend, saves/restores visible range
                                       to prevent viewport jump after setData()

App.jsx
      │
      ├──► components/layout/TopNav.jsx         ← Logo, panel toggles, Cmd+K, settings
      ├──► components/layout/Sidebar.jsx        ← symbol, timeframe, presets, indicators, ATR
      ├──► components/layout/RightPanel.jsx     ← persistent wrapper + AnimatePresence content
      │
      ├──► components/chart/
      │         ├── CandlestickChart.jsx        ← lw-charts v5 main pane + volume
      │         ├── SymbolInput.jsx             ← click-to-edit with autocomplete
      │         ├── PriceDisplay.jsx            ← live price + % change
      │         └── TimeframeSelector.jsx       ← 1m/5m/15m/1h/4h/1D buttons
      │
      ├──► components/indicators/
      │         ├── EMAOverlay.jsx              ← EMA 9/48/200 line series
      │         ├── VWAPOverlay.jsx             ← VWAP + 1σ/2σ bands
      │         ├── LevelOverlay.jsx            ← prev H/L, ORB zone, ODC (session-scoped)
      │         ├── SROverlay.jsx               ← S/R lines + swing high/low markers
      │         └── BollingerOverlay.jsx        ← Bollinger Bands (middle + upper/lower)
      │
      ├──► components/panels/
      │         ├── AlertsPanel.jsx             ← price-level + candle-streak alerts
      │         ├── WatchlistPanel.jsx          ← symbols + live prices + daily % change
      │         ├── BacktestPanel.jsx           ← 3 strategies, equity curve, day type breakdown
      │         └── JournalPanel.jsx            ← trade log, analytics, streaks, filters
      │
      └──► components/ui/
                ├── ConfluenceBar.jsx           ← traffic light pill + expandable breakdown
                ├── MTFStrip.jsx                ← multi-timeframe EMA alignment dots
                ├── IndicatorTabView.jsx        ← RSI/MACD mini chart containers (labeled)
                ├── RSIMiniChart.jsx            ← RSI subchart (separate lw-charts instance, autoSize)
                ├── MACDMiniChart.jsx           ← MACD subchart (separate lw-charts instance, autoSize)
                ├── CrosshairLegend.jsx         ← OHLCV on hover (ref-based, no re-renders)
                ├── ATRGauge.jsx                ← daily range meter (fuel gauge)
                ├── DayTypeBanner.jsx           ← Trend/Range/Chop live classification
                ├── IndicatorToggle.jsx         ← sidebar show/hide toggles (all indicators incl RSI/MACD)
                ├── PresetSelector.jsx          ← preset grid (4 defaults + custom)
                ├── CommandPalette.jsx           ← Cmd+K search (symbols, TFs, indicators, panels)
                ├── SettingsModal.jsx            ← themes, accent colors, shortcuts, sound
                ├── StatusBar.jsx               ← WS/Polling status + session stats
                ├── ToastContainer.jsx          ← bottom-right notifications
                ├── ErrorBoundary.jsx           ← React error boundary (prod-safe)
                ├── OnboardingTour.jsx          ← 4-step first-visit tooltip tour
                └── Logo.jsx                    ← Boogaloo font logo with BETA badge
```

---

## State Management

```
Server state (TanStack Query v5):
  - Historical bars (per symbol + timeframe, queryKey includes todayKey)
  - Infinite scroll prepends older bars to same cache key via setQueryData()
  - Daily bars (for ATR gauge)
  - MTF signals (5 parallel queries across timeframes)
  - Watchlist snapshots (30s auto-refresh when panel open)
  - placeholderData: keepPreviousData (prevents flash during TF switches)

Client state (Zustand — useChartStore):
  - selectedTimeframe, selectedSymbol
  - indicators: { ema, vwap, rvol, rsi, macd, levels, sr, bollinger }
  - activePanel: null | 'alerts' | 'backtest' | 'journal' | 'watchlist'
  - theme: 'dark' | 'lumpia' | 'terminal'
  - accentId: string (per-theme accent color preset)
  - sidebarOpen, soundAlerts
  - wsStatus, isMarketOpen

Client state (Zustand — usePresetsStore):
  - activePresetId, presets[] (localStorage persisted)
  - applyPreset, saveCurrentAsPreset, renamePreset, deletePreset, markModified

Client state (Zustand — useAlertsStore):
  - alerts[] (price-level + candle-streak), triggered state

Client state (Zustand — useJournalStore):
  - entries[] + CRUD + stats (localStorage persisted)

Client state (Zustand — useToastStore):
  - Toast queue (add/remove/auto-dismiss, max 5 visible)

Component state (useState — local only):
  - Hover, animation, tooltip position
  - Backtest config params (local to BacktestPanel)
  - Modal/palette open state
```

---

## Right Panel System

`activePanel` in useChartStore controls which panel is shown.
Values: `null | 'alerts' | 'backtest' | 'journal' | 'watchlist'`.

- Same panel button = close
- Different panel button = switch
- Keyboard: A/B/J/W toggle, Esc closes
- URL state: `?panel=backtest`
- Mobile: full-screen overlay (translateX slide), desktop: inline flex (width transition)

**Layout architecture:** RightPanel.jsx uses a persistent wrapper `<div>` that is
always in the DOM. The wrapper transitions `width`, `min-width`, and `transform`
via CSS (`transition-[transform,width,min-width] duration-300`). This means the
chart area's `flex-1` resizes smoothly in lockstep — no jump, no pause.

Inside the wrapper, `AnimatePresence mode="wait"` handles panel switching with
an opacity fade (150ms). Panel components are lazy-loaded with a skeleton fallback.

**Why not Motion for the wrapper:** Motion's `AnimatePresence` mounts/unmounts
elements. When a flex child is removed from the DOM, the remaining flex siblings
snap to fill the space instantly. CSS transitions on a persistent element avoid
this — the width shrinks gradually, and the chart resizes frame-by-frame.

---

## Color Architecture

All colors flow from CSS custom properties in `src/index.css`.
Each theme defines 25+ variables. Components use:

- Semantic CSS classes: `.btn-primary`, `.bg-input`, `.border-theme`, `.text-accent`
- Inline `var(--name)` references
- Never hardcoded Tailwind color classes

**Per-panel icon colors:** Each panel button has `--{id}-color` and `--{id}-active-bg`
variables with unique values per theme (alerts amber, watchlist teal, backtest purple,
journal coral/red).

**Accent color system:** 6 presets per theme defined in `src/constants/accents.js`.
Overrides 5 CSS variables (`--accent`, `--accent-dim`, `--btn-primary`,
`--btn-primary-hover`, `--focus-ring`) via inline styles on `<html>`.
Persisted to localStorage. Resets when theme changes.

**Chart colors:** EMA 9 blue (#3b82f6), EMA 48 green (#22c55e), EMA 200 white (#e5e7eb).
These are non-negotiable. Defined in `src/constants/chart.js`.

---

## Animation System

Two-tier approach: CSS transitions for layout, Motion v12 for content.

**Layout transitions (CSS — persistent DOM elements):**
- **RightPanel wrapper:** `transition-[transform,width,min-width] duration-300` —
  chart area resizes smoothly as panel opens/closes
- **Sidebar:** `transition-all duration-200` — simple CSS width transition

**Content transitions (Motion — mount/unmount):**
- **RightPanel content:** `AnimatePresence mode="wait"` opacity fade between panels
- **CommandPalette:** scale+fade entrance/exit
- **SettingsModal:** scale+fade entrance/exit

**Design rule:** Never use Motion's mount/unmount for elements that participate in
flex layout. When an `AnimatePresence` child unmounts, flex siblings snap instantly
to fill the space — causing the "close, pause, jump" effect. CSS transitions on
persistent wrappers avoid this entirely.

All Motion animations respect `prefers-reduced-motion` via `useReducedMotion()` hook.

**CSS-only animations:**
- Nav button hover keyframes (bell ring, watchlist bounce, backtest EKG, journal tilt, search zoom, settings spin+glow)
- Skeleton shimmer (`.skeleton-shimmer`)
- Crosshair legend fade

---

## Security Model

```
Browser ──► /api/bars.js ──► Alpaca REST (keys server-only)
Browser ──► /api/snapshot.js ──► Alpaca REST (keys server-only)
Browser ──► /api/ws-auth.js ──► returns WS credentials (bearer token gate)

API keys never reach the browser bundle (no VITE_ prefix).
```

- Rate limiting: ws-auth 5/IP/min, bars 60/IP/min, snapshot 30/IP/min
- SSRF guard: `ALPACA_DATA_URL` validated against host allowlist
- Input validation: symbol regex, timeframe allowlist, date format, limit bounds
- localStorage: schema-validated on load (presets, journal, watchlist, symbol usage)
- CSP + HSTS + X-Frame-Options in `vercel.json`
- ErrorBoundary hides raw errors in production

---

## Build & Bundle

```
Vite 8 → dist/
  ├── index.html
  ├── sw.js (auto-versioned CACHE_NAME via Vite plugin)
  ├── assets/
  │   ├── index-[hash].js        (~314KB main bundle)
  │   ├── lw-charts-[hash].js    (161KB lightweight-charts)
  │   ├── motion-[hash].js       (92KB motion library)
  │   ├── vendor-api-[hash].js   (69KB axios + tanstack + zustand)
  │   ├── dataProvider-[hash].js (1KB provider abstraction)
  │   └── 6 lazy chunks          (panels, settings, command palette)
  └── fonts/
      ├── boogaloo-regular.woff2 (10KB)
      └── inter-800.woff2        (24KB)
```

**Cache strategy:**
- Static assets (`/assets/*`, `/fonts/*`): `immutable, max-age=31536000`
- HTML: `s-maxage=60, stale-while-revalidate=300`
- API: per-endpoint (bars 30s, snapshot 15s, ws-auth no-store)
- Service worker: network-first, API bypassed, versioned via build hash

---

## lightweight-charts v5 Integration

All chart instances use `autoSize: true` (v5 built-in) for automatic container tracking.

```jsx
// CandlestickChart.jsx pattern (simplified)
const chart = createChart(container, { autoSize: true, layout, grid, crosshair, timeScale })
const candleSeries = chart.addCandlestickSeries({ upColor, downColor, ... })

// Volume as histogram on same pane
candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0, bottom: 0.3 } })
const volumeSeries = chart.addHistogramSeries({ priceScaleId: 'volume' })

// Overlays attach series to the same chart instance
// EMAOverlay, VWAPOverlay, etc. receive chartRef and add their own series

// RSI/MACD are separate chart instances in RSIMiniChart/MACDMiniChart
// (not v5 panes — separate instances for independent sizing)
// Each has a corner label (RSI purple, MACD blue) for identification
```

**TimeScale options:** `timeVisible`, `allowShiftVisibleRangeOnWhitespaceReplacement`
(prevents scroll jump when bars are prepended via infinite scroll).

Crosshair data is read via `subscribeCrosshairMove` and rendered in
`CrosshairLegend.jsx` using direct DOM manipulation (ref-based, zero React re-renders).

---

## Key Patterns

**Indicator contract:** Every function in `indicators.js` returns `{ series, signal }`.
Series feeds the chart, signal feeds the backtester and confluence score.
Same math, no duplication.

**Computed once, shared via props:** `groupBarsByDay()` runs once in App.jsx,
passed as `byDay` prop to LevelOverlay and other consumers.

**Narrowed Zustand selectors:** App.jsx subscribes to individual fields,
not the entire store. Prevents unnecessary re-renders.

**Code splitting:** 6 components loaded via `React.lazy()` — the 4 right panels,
SettingsModal, and CommandPalette. RightPanel wraps them in `Suspense` with
a skeleton fallback.

**Infinite scroll pattern:** `useInfiniteHistory` subscribes to the chart's
`subscribeVisibleLogicalRangeChange`. When fewer than 50 logical bars are before
the left edge, it fetches an older page of bars via `fetchBars()` (debounced 200ms,
gated with `isFetching` ref + 500ms cooldown). Older bars are deduplicated by
timestamp and prepended to the TanStack Query cache via `setQueryData()`.
`CandlestickChart` detects the prepend (bars grew at front, same tail), saves
the visible time range before `setData()`, and restores it after — preventing
viewport jump. Per-timeframe `pageSize` and `maxBars` caps in `TIMEFRAME_CONFIG`
prevent API spam and OOM. WebSocket live feed (appending newest bars) and infinite
scroll (prepending oldest bars) coexist without conflict on the same cache key.
