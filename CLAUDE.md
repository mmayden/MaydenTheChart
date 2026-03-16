# Lumpia — Claude Session Instructions

## Start of every session
Read these files in order before doing anything else:
1. `project.md` — full project spec, architecture, competitive landscape, trading system
2. `tasks.md` — living task board, current sprint status
3. `indicators.md` — indicator math reference and code contracts

Then tell me where we left off based on what you read.

## Non-negotiable contract
Every indicator function in `src/utils/indicators.js` must return BOTH:
```js
{
  series: [{ time, value }],   // ready for lightweight-charts series.setData()
  signal: {                    // ready for backtester / confluenceScore()
    value:    number,
    bias:     'bull' | 'bear' | 'neutral',
    strength: 'strong' | 'moderate' | 'weak'
  }
}
```
The live chart and the backtester share identical math. Never duplicate indicator logic.

## Stack (locked — upgrades planned in Phase 12C)
- Vite 7→8 + React 18→19 + lightweight-charts **v5** (NOT v4)
- TanStack Query v5, Zustand v4→5, Axios, Tailwind CSS 3→4, Vitest v3
- ESLint 9 + eslint-plugin-react-hooks (flat config, `eslint.config.js`)
- JavaScript (not TypeScript — tests provide sufficient coverage at current scale)
- `feed: 'iex'` required on all Alpaca data fetches (free tier)
- **No react-router-dom** — single-page app, panel-based architecture
- Motion v12 (formerly Framer Motion) — AnimatePresence + spring physics for panels/modals

## Data provider strategy
- **Current provider:** Alpaca Markets (free tier, IEX feed, 200 calls/min, 7yr history)
- **Architecture:** Data layer will be abstracted behind a provider interface (Phase 12D)
  so providers can be swapped without touching chart/indicator code
- **Provider interface:** `fetchBars()`, `subscribe()`, `fetchSnapshot()` — 3 methods
- **Future options evaluated:** FMP ($19/mo best value), Polygon/Massive (best SIP data),
  Twelve Data (real-time free but WS costs $191+/mo), Finnhub (shallow intraday history)
- Indicators, backtester, confluence — zero provider coupling (pure math)

## Security rules
- All API endpoints must have rate limiting (in-memory per-instance, IP-based)
- `ALPACA_DATA_URL` must be validated against `ALLOWED_DATA_HOSTS` allowlist (SSRF guard)
- All user input from URL params, forms, and localStorage must be regex-validated before use
- API errors must never leak upstream status codes, URLs, or stack traces to clients
- ErrorBoundary shows raw error messages only in `import.meta.env.DEV`
- Service worker `CACHE_NAME` is auto-versioned at build time (Vite plugin in `vite.config.js`)
- Bearer token in `ws-auth.js` is NOT a real secret (ships in client bundle) — rate limiting is the real gate

## Architecture

Single-page app. Chart is always visible. Tools live in slide-out right panels.
URL state sync via query params only (?s=QQQ&tf=5m&p=full&panel=backtest).

```
TopNav → Sidebar (left) → Chart (center) → RightPanel (right, one at a time)
```

**Right panel system:** `activePanel` in useChartStore controls which panel is shown.
Values: `null | 'alerts' | 'backtest' | 'journal' | 'watchlist'`. Same panel = close,
different panel = switch. On mobile (<768px), panels become full-screen overlays.

**Color architecture:** All colors flow from CSS custom properties in `src/index.css`
(lines 60-151). Each theme defines 25+ variables. Components use semantic CSS classes
(`.btn-primary`, `.bg-input`, `.border-theme`, `.text-accent`, etc.) or inline
`var(--name)` references — never hardcoded Tailwind color classes. Each panel button
has its own `--{id}-color` and `--{id}-active-bg` variables. The settings gear has
`--settings-color` and `--settings-glow`. Nav button hover animations are CSS-only
keyframes in `src/index.css` (`.nav-btn-{id}` classes).

**Accent color system:** Users can pick from 6 accent presets per theme in Settings.
Presets defined in `src/constants/accents.js` (single source of truth), consumed by
both the store (`setAccentColor`) and the SettingsModal UI. Overrides 5 CSS variables
(`--accent`, `--accent-dim`, `--btn-primary`, `--btn-primary-hover`, `--focus-ring`)
via inline styles on `<html>`. Resets when theme changes. Persisted to `localStorage`.

**Animation system:** Motion v12 (`motion/react`) powers panel/modal transitions.
- RightPanel: spring physics slide-in/out (`AnimatePresence` with per-panel key)
- CommandPalette: scale+fade entrance/exit (`AnimatePresence` internal)
- SettingsModal: scale+fade entrance/exit (`AnimatePresence` in App.jsx)
- All animations respect `prefers-reduced-motion` via `useReducedMotion()` hook
- CSS-only: nav hover keyframes, skeleton shimmer, settings gear spin+glow

## Key file locations

### App Shell
- App shell (single-page): `src/App.jsx`
- Top navigation bar: `src/components/layout/TopNav.jsx`
- Left sidebar (chart controls): `src/components/layout/Sidebar.jsx`
- Right panel shell: `src/components/layout/RightPanel.jsx`
- URL state sync: `src/hooks/useURLState.js`

### Chart & Indicators
- Indicator math: `src/utils/indicators.js`
- Level math: `src/utils/levels.js`
- S/R detection: `src/utils/supportResistance.js`
- Confluence score: `src/utils/confluence.js`
- Backtester engine: `src/utils/backtest.js`
- Constants (EMA colors etc): `src/constants/chart.js`
- Main chart: `src/components/chart/CandlestickChart.jsx`
- Symbol input + autocomplete: `src/components/chart/SymbolInput.jsx`
- Crosshair OHLCV legend: `src/components/ui/CrosshairLegend.jsx`
- RSI/MACD toggle + mini charts: `src/components/ui/IndicatorTabView.jsx` + `RSIMiniChart.jsx` + `MACDMiniChart.jsx`
- Bollinger Bands overlay: `src/components/indicators/BollingerOverlay.jsx`
- Sidebar indicator toggles (overlays only): `src/components/ui/IndicatorToggle.jsx`

### Synthesis Layer
- Confluence bar: `src/components/ui/ConfluenceBar.jsx` — setup quality readout
- MTF status strip: `src/components/ui/MTFStrip.jsx` — multi-timeframe EMA alignment
- MTF signals hook: `src/hooks/useMTFSignals.js` — fetches bars across 5m/15m/1h/4h/1D

### Stores
- Primary UI state: `src/store/useChartStore.js` (timeframe, symbol, indicators, activePanel, theme, accentId)
- Preset store: `src/store/usePresetsStore.js`
- Alert store: `src/store/useAlertsStore.js`
- Trade journal store: `src/store/useJournalStore.js`
- Toast store: `src/store/useToastStore.js`

### Hooks
- Keyboard shortcuts (1-6, [/], Cmd+K, Cmd+Shift+S, panel toggles): `src/hooks/useKeyboardShortcuts.js`
- Viewport persistence: `src/hooks/useViewportPersistence.js`
- WebSocket live feed: `src/hooks/useAlpacaSocket.js` + `src/services/websocket.js`
- Alert checker: `src/hooks/useAlertChecker.js`
- Daily bars hook: `src/hooks/useDailyBars.js`
- MTF signals: `src/hooks/useMTFSignals.js`
- Watchlist quotes: `src/hooks/useWatchlistQuotes.js`
- Swipe gestures (touch devices): `src/hooks/useSwipeGesture.js`

### Right Panels (slide-out, one at a time)
- Alerts panel: `src/components/panels/AlertsPanel.jsx`
- Backtest panel: `src/components/panels/BacktestPanel.jsx`
- Journal panel: `src/components/panels/JournalPanel.jsx`
- Watchlist panel: `src/components/panels/WatchlistPanel.jsx`

### UI Components
- Preset selector UI: `src/components/ui/PresetSelector.jsx`
- Default preset definitions: `src/constants/presets.js`
- Accent color presets (per-theme): `src/constants/accents.js`
- Command palette (Cmd+K): `src/components/ui/CommandPalette.jsx`
- Settings modal (themes + accent colors + shortcuts + sound alerts): `src/components/ui/SettingsModal.jsx`
- Error boundary: `src/components/ui/ErrorBoundary.jsx`
- Logo: `src/components/ui/Logo.jsx`
- Toast notifications: `src/components/ui/ToastContainer.jsx`
- Status bar (WS/polling + session stats): `src/components/ui/StatusBar.jsx`
- ATR gauge: `src/components/ui/ATRGauge.jsx`
- Day type banner: `src/components/ui/DayTypeBanner.jsx`
- Onboarding tour: `src/components/ui/OnboardingTour.jsx`

### Utilities
- Shared timezone utils: `src/utils/timezone.js`
- Bar normalizer: `src/utils/normalizeBar.js`
- localStorage schema validation: `src/utils/validate.js`
- Chart snapshot capture + export: `src/utils/snapshot.js`

### Services
- Sentry error tracking (conditional): `src/services/sentry.js`

### PWA
- Manifest: `public/manifest.json`
- Service worker (source, build-time processed): `src/sw.js`
- Self-hosted fonts: `public/fonts/boogaloo-regular.woff2`, `public/fonts/inter-800.woff2`
- Icons: `public/icons/icon-192.png`, `public/icons/icon-512.png`

### Tooling
- ESLint config (flat): `eslint.config.js`
- Vite config + SW versioning plugin: `vite.config.js`

### Docs
- Project spec + architecture: `project.md`
- Task board: `tasks.md`
- Indicator math reference: `indicators.md`
- Competitive research + vision: `brainstorming.md`
- Health audit template: `audit.md`

## Production infrastructure rules
- Static assets (`/assets/*`): `Cache-Control: public, max-age=31536000, immutable` (Vite content-hashes filenames)
- HTML (`/`): `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- API endpoints: per-endpoint cache (bars 30s, snapshot 15s, ws-auth no-store)
- Fonts must be self-hosted (no external CDN dependency) — `public/fonts/`
- Service worker `CACHE_NAME` must be auto-versioned via build hash (not manual bump)
- `prefers-reduced-motion: reduce` must be respected for all animations
- Open Graph meta tags required in `index.html` for social sharing previews
- Error tracking via Sentry free tier (5K errors/month, session replay)
