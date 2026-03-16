# Architecture — Cheechart (Lumpia)

> Current as of Phase 12B (2026-03-15). 274 tests passing, ESLint 0 errors.

---

## High-Level Layout

Single-page app. Chart is always visible. Tools live in slide-out right panels.

```
┌──────────────────────────────────────────────────────────────────────┐
│  TopNav: Logo │ panel toggles │ ⌘K │ ⚙                              │
├────────┬─────────────────────────────────────────────┬───────────────┤
│ Side   │  Sub-header: Price │ Confluence │ MTF │ Day │  RightPanel   │
│ bar    │  ─────────────────────────────────────────  │  (one at a    │
│        │  Chart (candlestick + overlays)             │   time)       │
│ symbol │  ─────────────────────────────────────────  │  alerts │     │
│ TF     │  Indicator tabs (RSI / MACD mini charts)    │  backtest │   │
│ indic. │  ─────────────────────────────────────────  │  journal │    │
│ preset │  Status bar (WS status + session stats)     │  watchlist    │
└────────┴─────────────────────────────────────────────┴───────────────┘
```

No router. URL state sync via query params only (`?s=QQQ&tf=5m&p=full&panel=backtest`).

---

## Data Flow

```
Alpaca REST API
      │
      ▼
api/bars.js (Vercel serverless)  ← rate-limited, input-validated, SSRF-guarded
api/snapshot.js                  ← multi-symbol snapshots for watchlist
api/ws-auth.js                   ← credential proxy for WebSocket auth
      │
      ▼
src/services/alpaca.js           ← axios client, calls /api/bars proxy
src/services/queryClient.js      ← TanStack Query client config
      │
      ▼
src/hooks/useAlpacaBars.js       ← TanStack Query: caching, loading, error, refetch
src/hooks/useDailyBars.js        ← daily bars for ATR(14) calculation
src/hooks/useMTFSignals.js       ← parallel fetch across 5m/15m/1h/4h/1D
src/hooks/useWatchlistQuotes.js  ← snapshot polling for watchlist panel
      │
      ├──► src/utils/indicators.js       ← pure math: EMA, VWAP+bands, ATR, RSI, MACD, Bollinger, RVOL
      ├──► src/utils/levels.js           ← prev H/L, ORB zone, open of day, day type
      ├──► src/utils/supportResistance.js ← pivot-based S/R detection + clustering
      ├──► src/utils/confluence.js        ← weighted signal synthesis (6 inputs → score)
      └──► src/utils/backtest.js         ← ORB breakout, EMA-cross, VWAP bounce strategies

Zustand Stores
  useChartStore     ── timeframe, symbol, indicators, activePanel, theme, accentId, wsStatus
  usePresetsStore   ── saved chart presets (indicator + timeframe combos), localStorage
  useAlertsStore    ── price level + candle streak alerts
  useJournalStore   ── trade journal entries, stats, localStorage
  useToastStore     ── toast notification queue

      ▼
App.jsx (single-page root)
      │
      ├──► components/layout/
      │         ├── TopNav.jsx         ← logo, panel toggles, ⌘K, settings gear
      │         ├── Sidebar.jsx        ← symbol input, TF selector, indicator toggles, presets, ATR gauge
      │         └── RightPanel.jsx     ← animated slide-out panel shell (spring physics)
      │
      ├──► components/chart/
      │         ├── CandlestickChart.jsx  ← lw-charts v5 main pane + volume histogram
      │         ├── PriceDisplay.jsx      ← live price + % change + daily range
      │         ├── SymbolInput.jsx       ← click-to-edit ticker with autocomplete
      │         └── TimeframeSelector.jsx ← 1m/5m/15m/1h/4h/1D buttons
      │
      ├──► components/indicators/
      │         ├── EMAOverlay.jsx       ← EMA 9/48/200 line series
      │         ├── VWAPOverlay.jsx      ← VWAP + 1σ/2σ bands
      │         ├── LevelOverlay.jsx     ← prev H/L, ORB zone, ODC line
      │         ├── SROverlay.jsx        ← S/R lines + swing markers
      │         └── BollingerOverlay.jsx ← Bollinger Bands (middle + upper/lower)
      │
      ├──► components/panels/ (lazy-loaded)
      │         ├── AlertsPanel.jsx     ← price level + candle streak alerts
      │         ├── BacktestPanel.jsx   ← ORB/EMA-cross/VWAP-bounce with equity curve
      │         ├── JournalPanel.jsx    ← trade log + analytics (by setup, streaks, ratings)
      │         └── WatchlistPanel.jsx  ← symbol list with live prices
      │
      └──► components/ui/
                ├── CommandPalette.jsx    ← ⌘K search (symbols, TF, indicators, presets, panels)
                ├── SettingsModal.jsx     ← themes, accent colors, shortcuts, sound alerts
                ├── ConfluenceBar.jsx     ← traffic-light setup quality readout
                ├── MTFStrip.jsx          ← multi-timeframe EMA alignment dots
                ├── IndicatorTabView.jsx  ← RSI/MACD toggle + mini charts
                ├── RSIMiniChart.jsx      ← RSI sub-chart (lw-charts v5 pane)
                ├── MACDMiniChart.jsx     ← MACD sub-chart (lw-charts v5 pane)
                ├── CrosshairLegend.jsx   ← OHLCV overlay on crosshair hover
                ├── StatusBar.jsx         ← WS status + session stats
                ├── ATRGauge.jsx          ← daily range fuel gauge
                ├── DayTypeBanner.jsx     ← Trend/Range/Chop live status
                ├── PresetSelector.jsx    ← 2×2 defaults + custom presets
                ├── IndicatorToggle.jsx   ← sidebar indicator on/off switches
                ├── ToastContainer.jsx    ← fixed bottom-right toast stack
                ├── OnboardingTour.jsx    ← 4-step tooltip tour
                ├── ErrorBoundary.jsx     ← React error boundary with fallback UI
                └── Logo.jsx             ← Boogaloo font logo

Alpaca WebSocket
      │
      ▼
src/services/websocket.js          ← connection lifecycle, auth, exponential backoff reconnect
      │
      ▼
src/hooks/useAlpacaSocket.js       ← market-hours gating, bar aggregation, TanStack cache injection
      │
      ▼
CandlestickChart.jsx               ← series.update() with incoming bar
```

---

## Key Architecture Patterns

### State Management Boundaries

| State Type | Tool | Location |
|---|---|---|
| Server/async data | TanStack Query v5 | `useAlpacaBars`, `useDailyBars`, `useMTFSignals`, `useWatchlistQuotes` |
| UI state | Zustand | `useChartStore` (TF, symbol, indicators, panel, theme) |
| Domain state | Zustand | `usePresetsStore`, `useAlertsStore`, `useJournalStore` |
| Ephemeral UI | useState | Component-local (form inputs, hover states, tab selection) |
| Notifications | Zustand | `useToastStore` |

### Right Panel System

`activePanel` in `useChartStore` controls which panel is shown.
Values: `null | 'alerts' | 'backtest' | 'journal' | 'watchlist'`.
Same panel toggle = close, different panel = switch.
On mobile (<768px), panels become full-screen overlays with backdrop.
Panels are lazy-loaded via `React.lazy()` — only loaded when first opened.

### Color Architecture

All colors flow from CSS custom properties in `src/index.css` (3 theme definitions).
Components use semantic CSS classes (`.btn-primary`, `.bg-input`, `.border-theme`, `.text-accent`)
or inline `var(--name)` references — never hardcoded Tailwind color classes.

**Accent color system:** 6 presets per theme defined in `src/constants/accents.js`.
Overrides 5 CSS variables via inline styles on `<html>`. Persisted to `localStorage`.

### Animation System

Motion v12 (`motion/react`) powers panel/modal transitions:
- RightPanel: spring physics slide-in/out (stiffness 400, damping 35)
- CommandPalette: scale+fade entrance/exit
- SettingsModal: scale+fade entrance/exit
- All respect `prefers-reduced-motion` via `useReducedMotion()` hook
- CSS-only: nav hover keyframes, skeleton shimmer, settings gear spin+glow

### Indicator Contract

Every indicator function returns `{ series, signal }`:
```js
{
  series: [{ time, value }],   // ready for lightweight-charts series.setData()
  signal: {
    value:    number,
    bias:     'bull' | 'bear' | 'neutral',
    strength: 'strong' | 'moderate' | 'weak'
  }
}
```
Documented deviations: `vwapWithBands()` (5 band series), `macd()` (3 chart series).

### Code Splitting

Lazy-loaded chunks (only loaded on demand):
- 4 right panels (AlertsPanel, BacktestPanel, JournalPanel, WatchlistPanel)
- SettingsModal
- CommandPalette

Manual Vite chunks:
- `lightweight-charts` (164KB)
- `vendor-api` (axios + TanStack Query, 81KB)
- `motion` (125KB)

### Security Layers

1. **Serverless proxies** — API keys never reach browser (`api/bars.js`, `api/snapshot.js`, `api/ws-auth.js`)
2. **Rate limiting** — per-IP in-memory limits on all 3 endpoints
3. **SSRF guard** — `ALPACA_DATA_URL` validated against host allowlist
4. **Input validation** — symbol regex, timeframe allowlist, date format, limit bounds
5. **CSP headers** — configured in `vercel.json`
6. **Error sanitization** — API errors never leak upstream details to client

---

## lightweight-charts v5 Integration

Multi-pane is native in v5 — the primary reason we chose v5 over v4.
Crosshair automatically syncs across all panes (no manual sync needed).

```js
const chart = createChart(container, options)
const candleSeries = chart.addCandlestickSeries()

// RSI/MACD as separate chart instances in IndicatorTabView
// (user toggles between them via tab strip)
```

`CandlestickChart.jsx` uses `forwardRef` + `useImperativeHandle` to expose
`chart()` and `candleSeries()` accessors to parent (`App.jsx`), which passes
them to overlay components for series attachment.

---

## Production Infrastructure

| Asset | Cache-Control |
|---|---|
| `/assets/*` (JS/CSS) | `public, max-age=31536000, immutable` (content-hashed) |
| `/fonts/*` | `public, max-age=31536000, immutable` |
| `/` (HTML) | `public, s-maxage=60, stale-while-revalidate=300` |
| API endpoints | per-endpoint (bars 30s, snapshot 15s, ws-auth no-store) |

- Fonts self-hosted in `public/fonts/` (Boogaloo 10KB + Inter 800 24KB)
- Service worker cache auto-versioned at build time (Vite plugin in `vite.config.js`)
- Error tracking via Sentry free tier (conditional on `VITE_SENTRY_DSN` env var)
- PWA manifest + icons in `public/`

---

## Deployment (Vercel)

```bash
# Test production build locally
npm run build && npm run preview

# Deploy (auto-deploys from git push)
vercel --prod
```

Env vars configured in Vercel dashboard (Project Settings → Environment Variables):
- `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, `ALPACA_DATA_URL` (server-only, no VITE_ prefix)
- `WS_AUTH_TOKEN`, `VITE_WS_AUTH_TOKEN` (WebSocket auth)
- `VITE_SENTRY_DSN` (optional, error tracking)
