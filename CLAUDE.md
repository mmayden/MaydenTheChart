# Cheechart — Claude Session Instructions

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

## Stack (locked — Phase 12C upgrades complete)
- Vite 8 + React 19 + lightweight-charts **v5** (NOT v4)
- TanStack Query v5, Zustand v5, Axios, Tailwind CSS 4 (`@tailwindcss/postcss`), Vitest v3
- ESLint 9 + eslint-plugin-react-hooks (flat config, `eslint.config.js`)
- Husky 9 + lint-staged — pre-commit hooks run ESLint on staged files
- GitHub Actions CI — lint + test + audit + lockfile-lint + build on every push/PR to `main`
- JavaScript (not TypeScript — tests provide sufficient coverage at current scale)
- `feed: 'iex'` required on all Alpaca data fetches (free tier)
- **No react-router-dom** — single-page app, panel-based architecture
- Motion v12 (formerly Framer Motion) — AnimatePresence for content transitions (panels, modals)
- web-vitals — LCP/CLS/INP/FID/TTFB reporting to Sentry (lazy-loaded, only when Sentry DSN set)
- sharp (devDep) — OG image + PWA icon generation (`scripts/generate-og-image.js`, `scripts/generate-icons.js`)

## Data provider strategy
- **Current provider:** Alpaca Markets (free tier, IEX feed, 200 calls/min, 7yr history)
- **Architecture:** Data layer is abstracted behind a provider interface (Phase 12D complete)
  — providers can be swapped without touching chart/indicator code
- **Provider interface:** `fetchBars()`, `fetchSnapshot()`, `createSocket()` — 3 methods
  in `src/services/dataProvider.js`, with Alpaca adapter in `src/services/providers/alpaca.js`
- **Future options evaluated:** FMP ($19/mo best value), Polygon/Massive (best SIP data),
  Twelve Data (real-time free but WS costs $191+/mo), Finnhub (shallow intraday history)
- Indicators, backtester, confluence — zero provider coupling (pure math)
- **Infinite scroll:** `useInfiniteHistory` hook fetches older bars on-demand as user
  scrolls left. Per-timeframe `pageSize` and `maxBars` caps in `TIMEFRAME_CONFIG`
- **Data freshness strategy:** Three-tier refresh system ensures the chart always stays current:
  1. WebSocket live bars (real-time, market hours only)
  2. Safety-net REST polling every 2min even when WS is subscribed (guards against WS stalls on low-volume symbols or connection issues)
  3. Fallback REST polling every 60s (intraday) / 5min (daily) when WS is disconnected
  - `refetchOnWindowFocus: 'always'` — data refreshes immediately when user returns to the tab
  - `staleTime: 30s` — prevents redundant refetches from overlapping triggers

## Security rules
- All API endpoints must have rate limiting (in-memory per-instance, IP-based, TTL cleanup every 2min, 10K entry cap)
- All upstream `fetch()` calls must use `AbortSignal.timeout(10_000)` — never rely on Vercel's 30s hard limit
- Request IDs use `crypto.randomUUID()` — never `Math.random()` for any ID generation
- `ALPACA_DATA_URL` must be validated against `ALLOWED_DATA_HOSTS` via `new URL().hostname` exact match (SSRF guard)
- All user input from URL params, forms, and localStorage must be regex-validated before use
- `SYMBOL_RE` lives in `src/constants/patterns.js` — single source of truth for client-side symbol validation
  (server-side `api/*.js` files keep inline copies for zero-import serverless deploys — keep in sync)
- API errors must never leak upstream status codes, URLs, or stack traces to clients
- ErrorBoundary shows raw error messages only in `import.meta.env.DEV`
- Service worker `CACHE_NAME` is auto-versioned at build time (Vite plugin in `vite.config.js`)
- Bearer token in `ws-auth.js` is NOT a real secret (ships in client bundle) — rate limiting is the real gate
- All localStorage keys use `cheechart-` prefix (`cheechart-theme`, `cheechart-accent`, `cheechart-symbol`, `cheechart-roadmap-done`, `cheechart-roadmap-beginner`, etc.)
- CSP includes `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`, `upgrade-insecure-requests`
- Cross-origin isolation: `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Resource-Policy: same-origin`
- Dependabot auto-updates npm + GitHub Actions deps weekly (`.github/dependabot.yml`)

## Observability

**Logging:** All client-side logging goes through `src/utils/logger.js`. Never use raw
`console.*` in `src/` — use `log.debug/info/warn/error(tag, message, ...args)` instead.
Dev builds get all levels; production gets warn + error only. Errors are auto-forwarded
to Sentry via `captureException`. Use `log.breadcrumb(category, message, data)` to add
Sentry breadcrumbs for user actions (symbol change, timeframe switch, etc.).

**Sentry (dynamic import):** `@sentry/react` (~50-100KB) is loaded via `await import()`
only when `VITE_SENTRY_DSN` is set. The module is cached in `_Sentry` and exposed via
`getSentry()` for lazy access by `logger.js`. This keeps the main bundle lean for users
without Sentry configured. Captures: unhandled errors (global), ErrorBoundary crashes
(via logger `captureException`), data fetch failures (via logger), WebSocket errors
(via logger). Includes `browserTracingIntegration` for performance monitoring and web
vitals (LCP, CLS, INP, FID, TTFB) via `web-vitals` library (also dynamic import).
Breadcrumbs track user navigation (symbol/timeframe changes).

**Sentry integration pattern:**
- `src/services/sentry.js` — `initSentry()` (async, dynamic import), `getSentry()` (lazy accessor), `reportWebVitals()`
- `src/utils/logger.js` — imports `getSentry()` (not `@sentry/react`), resolves Sentry lazily at each error/breadcrumb call
- `src/main.jsx` — `initSentry().then(() => reportWebVitals())` — chained async, non-blocking
- **Rule:** Never static-import `@sentry/react` anywhere except inside `sentry.js`'s dynamic import

**API request IDs:** All serverless functions (`api/*.js`) generate a short `x-request-id`
header on every response. Server-side `console.error` logs include `rid=<id>` for
correlation with Vercel function logs.

**Error surfacing:** Data fetch errors (bar/snapshot failures) are shown to users as
toast notifications instead of silent failures. ErrorBoundary provides reset/reload UI.

## Architecture

Single-page chart terminal at `/`. Educational roadmap at `/roadmap` (separate Vite entry).
Tools live in slide-out right panels. No router within the chart app.
URL state sync via query params only (?s=QQQ&tf=5m&p=full&panel=backtest).

```
/ (index.html)        → TopNav → Sidebar (left) → Chart (center) → RightPanel (right)
/roadmap (roadmap.html) → Standalone page — back link to /, own CSS (roadmap.css)
```

**Multi-page build:** Vite builds two HTML entry points (`index.html` + `roadmap.html`).
The roadmap page is fully independent — no chart code, no TanStack Query, no stores,
and its own standalone CSS (`roadmap.css`) with a fixed dark color scheme. It does NOT
inherit the main app's theme system (dark/terminal/lumpia) — the roadmap always renders
with its own colors regardless of chart app settings. Shares only self-hosted fonts.
Linked from TopNav Help menu and BottomNav "More" menu. Vercel rewrite routes `/roadmap`
to `/roadmap.html` before the SPA catch-all. Features: beginner path filter (Phases 1–8
toggle, persisted), estimated time per phase, "Mastered" badge on 100% phase completion,
legal disclaimer footer. Content peer-reviewed for accuracy (95%+ verified).

**Right panel system:** `activePanel` in useChartStore controls which panel is shown.
Values: `null | 'alerts' | 'backtest' | 'journal' | 'watchlist'`. Same panel = close,
different panel = switch. On mobile (<768px), panels render inside a draggable `BottomSheet`
component (snap points at 50%/90%, velocity-based dismiss). On desktop, side panel with
width transition.

**Color architecture — two-tier system:**

*Tier 1 — CSS custom properties* (`src/index.css`): All theme-varied colors flow from
25+ CSS variables per theme. Components use semantic CSS classes (`.btn-primary`,
`.bg-input`, `.border-theme`, `.text-accent`, etc.) or inline `var(--name)` references —
never hardcoded Tailwind color classes. Each panel button has its own `--{id}-color` and
`--{id}-active-bg` variables. The settings gear has `--settings-color` and `--settings-glow`.
Nav button hover animations are CSS-only keyframes in `src/index.css` (`.nav-btn-{id}` classes).

*Tier 2 — chart.js constants* (`src/constants/chart.js`): All colors passed to the
lightweight-charts API (which needs hex strings, not CSS variables) are defined as named
exports in chart.js. This includes: `CANDLE_COLORS` (per-theme), `RSI_LINE_COLOR`,
`RSI_OB/MID/OS_COLOR`, `MACD_LINE_COLOR`, `MACD_SIGNAL_COLOR`, `MACD_HIST_UP/DOWN`,
`SR_RESISTANCE_RGB`, `SR_SUPPORT_RGB`, `SR_SWING_HIGH/LOW`, `BOLLINGER_*_COLOR`,
`EMA_COLORS`, `VWAP_*_COLOR`, `VOLUME_UP/DOWN_COLOR`, `SIGNAL_COLORS`.

**Rule:** HTML/React components use CSS variables. lightweight-charts API calls use
chart.js constants. Never hardcode hex values in component files.

**Data color system:** Universal trading/data colors (bull/bear, status, warnings) are
defined as CSS custom properties (`--color-bull`, `--color-bear`, `--color-warn`,
`--color-info`, `--color-neutral`, `--color-badge`) in `:root` and also registered as
Tailwind color tokens in `src/index.css` `@theme` block (`bull`, `bear`, `warn`, `info`, `neutral`,
`badge`). Components use `.text-bull`, `.bg-bear/20`, `.border-warn/40` etc. — never
hardcoded `text-green-400` or `text-red-400`.

**Accent color system:** Users can pick from 6 accent presets per theme in Settings.
Presets defined in `src/constants/accents.js` (single source of truth), consumed by
both the store (`setAccentColor`) and the SettingsModal UI. Overrides 5 CSS variables
(`--accent`, `--accent-dim`, `--btn-primary`, `--btn-primary-hover`, `--focus-ring`)
via inline styles on `<html>`. Resets when theme changes. Persisted to `localStorage`.

**Accessibility:**
- Global `:focus-visible` outline using `--focus-ring` CSS variable in `src/index.css`
  (keyboard-only — suppressed on mouse click via `:focus:not(:focus-visible)`)
- CommandPalette and SettingsModal have `role="dialog"` + `aria-modal="true"` + `aria-label`
- All panel toggle buttons (Alerts, Watchlist, Backtest, Journal) have `aria-label` + `aria-pressed`
- ConfluenceBar has `aria-expanded` and descriptive `aria-label` with score/bias/level
- Touch targets: 44px minimum on `pointer: coarse` devices via `.touch-target` class

**Confluence bar visual states:**
- Strong setups: glow `box-shadow`, brighter border, pulsing traffic light dot (`.confluence-pulse`)
- Score uses `text-sm tabular-nums` for prominence
- All visual emphasis respects `prefers-reduced-motion`

**Animation system:**
- **RightPanel (desktop):** Persistent wrapper with CSS `transition-[width,min-width]`.
  Border on inner content, not wrapper. Chart area resizes seamlessly.
- **RightPanel (mobile):** Renders inside `<BottomSheet>` — no width transitions,
  uses GPU-accelerated height transform. Backdrop handled by BottomSheet component.
- **Sidebar:** Simple `transition-all duration-200` on the `<aside>`. Original pattern.
- **Content transitions (Motion):** RightPanel uses `AnimatePresence` opacity fade for
  panel switching. CommandPalette and SettingsModal use scale+fade entrance/exit.
- **Design rule:** Never use Motion's mount/unmount (`AnimatePresence`) for elements that
  affect flex layout. Motion is only for content inside persistent containers.
- All animations respect `prefers-reduced-motion` via `useReducedMotion()` hook
- CSS-only: nav hover keyframes, skeleton shimmer, settings gear spin+glow, mini chart labels (`.mini-chart-label`)
- **Sidebar resize:** Emits `cheechart:layout-resize` event after transition;
  all chart instances call `chart.resize()` to match new container size.
- **Multi-pane sync:** RSI/MACD mini-charts are fully synced to the main chart:
  crosshair position (`subscribeCrosshairMove` → `setCrosshairPosition`) and
  visible time range (`subscribeVisibleLogicalRangeChange` → `setVisibleLogicalRange`).
  Scroll/zoom on the main chart drives all three panes as one unit.
  Mini-charts have `handleScroll/handleScale: false` (no independent interaction).
- **Infinite scroll:** `useInfiniteHistory` hook subscribes to `subscribeVisibleLogicalRangeChange`.
  When fewer than 50 bars are visible before the left edge, fetches an older page via provider.
  Bars are prepended to TanStack Query cache. CandlestickChart detects prepend and saves/restores
  visible time range to prevent viewport jump. Per-timeframe `pageSize` and `maxBars` caps in
  `TIMEFRAME_CONFIG`. "Loading..." pill appears at chart left edge during fetch.

**Level overlay system:**
- **PDH/PDL** — gold dashed (`#eab308`), full-width price lines, labeled "PDH"/"PDL"
- **ODC** — slate dashed (`#94a3b8`), LineSeries scoped to today's session only, labeled "ODC"
- **ORB** — indigo dotted (`#6366f1`), labeled "ORB H"/"ORB L", intraday only (`showORB` in TIMEFRAME_CONFIG)
- **S/R** — red resistance (above price) / green support (below price), dotted, opacity scales with strength
  - Labels always show strength: "R ×1", "S ×2", etc.
  - Strictly filtered: resistance > current price, support < current price (no cross-labels)
  - Max 5 per type, sorted by strength (strongest survive the cap)
  - Swing high/low markers (▼/▲ arrows) at detected pivot bars

**Chart visual tuning (Webull-inspired):**
- Grid: dotted style (`LineStyle.Dotted`), subtle color (`#141a23`) — data pops, grid fades
- Crosshair: magnet mode (`CrosshairMode.Magnet`) — snaps to nearest OHLC value for precision
- Crosshair: dashed (`LineStyle.Dashed`), label bg `#1f2937`
- Axis borders hidden (`borderVisible: false`) on both time and price scales
- `barSpacing: 8`, `minBarSpacing: 2`, `rightOffset: 5` — proportional bars at every zoom level
- `shiftVisibleRangeOnNewBar: true` — live bars scroll smoothly into view
- Kinetic scroll: `kineticScroll: { touch: true, mouse: true }` — momentum/inertia on drag-release
- Scroll handling: `vertTouchDrag: false` prevents accidental vertical scroll on mobile pan
- Scale handling: `axisDoubleClickReset: true` — double-click axis to reset zoom
- Right price scale: `alignLabels: true`, `scaleMargins: { top: 0.05, bottom: 0.05 }`
- Volume: 55% alpha, `scaleMargins: { top: 0.82 }` — doesn't compete with candles
- Mini charts (RSI/MACD): 90px desktop / 70px mobile, vertical grid hidden, horizontal dotted, no axis borders
- Shared mini chart config: `src/components/ui/miniChartConfig.js`
- Layout font: 11px, text `#9ca3af` for axis labels
- CrosshairLegend: 10px font, 85% opaque bg, positioned (6,6)

**Mobile architecture (M1–M5 overhaul):**
- **Breakpoint strategy:** `useIsMobile()` (max-width 767px) is the primary gate. All mobile
  changes are gated behind this hook or `md:` Tailwind breakpoints. Desktop is zero-regression.
- **Bottom navigation:** `BottomNav.jsx` (mobile only, `md:hidden`). Fixed bottom bar with
  scrollable timeframe pills, panel toggles, sidebar hamburger. 48px + safe-area-bottom.
  Translucent `backdrop-filter: blur(12px)`.
- **Bottom sheets:** `BottomSheet.jsx` replaces full-screen panel overlays on mobile.
  Drag handle, snap points (50%/90%), velocity-based dismiss. GPU-accelerated (transform only).
  `RightPanel.jsx` conditionally renders `<BottomSheet>` when `useIsMobile()`.
- **Safe areas:** `viewport-fit=cover` in `index.html`. CSS vars `--safe-*` from
  `env(safe-area-inset-*)`. Utility classes `.pt-safe`/`.pb-safe`/`.pl-safe`/`.pr-safe`.
  TopNav uses `pl-safe pr-safe`, sidebar uses `pb-safe`.
- **Viewport height:** `.h-screen-safe` uses `100dvh` with `100vh` fallback.
- **Landscape:** `@media (orientation: landscape) and (max-height: 500px)` —
  `.landscape-hide` (status bar), `.landscape-compact` (sub-header). Mini charts hidden
  in mobile landscape. Orientation change fires `cheechart:layout-resize`.
- **Responsive fonts:** CSS vars `--text-xs`/`--text-sm`/`--text-base` using `clamp()`.
- **Performance:** `.chart-contain` (`contain: layout style`) on chart wrapper.
  `.bottom-sheet` has `contain: layout style`. All animations use transform/opacity only.
- **Pull-to-refresh:** `usePullToRefresh` hook — touch-only, 60px threshold, shows spinner.
- **Haptic feedback:** `navigator.vibrate(200)` on alert triggers (feature-detected).

## Key file locations

### App Shell
- App shell (single-page): `src/App.jsx`
- Top navigation bar: `src/components/layout/TopNav.jsx`
- Left sidebar (chart controls): `src/components/layout/Sidebar.jsx`
- Right panel shell: `src/components/layout/RightPanel.jsx` (side panel desktop, bottom sheet mobile)
- Bottom navigation (mobile only): `src/components/layout/BottomNav.jsx` — timeframe pills + panel toggles
- Bottom sheet (mobile panels): `src/components/ui/BottomSheet.jsx` — draggable, snap points, velocity dismiss
- URL state sync: `src/hooks/useURLState.js`

### Chart & Indicators
- Indicator math: `src/utils/indicators.js`
- Level math: `src/utils/levels.js`
- S/R detection: `src/utils/supportResistance.js`
- Confluence score: `src/utils/confluence.js`
- Backtester engine: `src/utils/backtest.js`
- Constants (EMA colors etc): `src/constants/chart.js`
- Main chart: `src/components/chart/CandlestickChart.jsx`
- Live price + % change header: `src/components/chart/PriceDisplay.jsx`
- Symbol input + autocomplete: `src/components/chart/SymbolInput.jsx`
- Timeframe button group: `src/components/chart/TimeframeSelector.jsx`
- Crosshair OHLCV legend: `src/components/ui/CrosshairLegend.jsx`
- RSI/MACD mini charts: `src/components/ui/IndicatorTabView.jsx` (container + HTML labels) + `RSIMiniChart.jsx` + `MACDMiniChart.jsx` + `miniChartConfig.js` (shared opts)
- Sidebar indicator toggles (all indicators): `src/components/ui/IndicatorToggle.jsx`

### Indicator Overlays
- EMA 9/48/200 line series: `src/components/indicators/EMAOverlay.jsx`
- VWAP + σ band series: `src/components/indicators/VWAPOverlay.jsx`
- Prev H/L, ORB zone, ODC: `src/components/indicators/LevelOverlay.jsx`
- S/R lines + swing markers: `src/components/indicators/SROverlay.jsx`
- Bollinger Bands: `src/components/indicators/BollingerOverlay.jsx`

### Synthesis Layer
- Confluence bar: `src/components/ui/ConfluenceBar.jsx` — setup quality readout (glow + pulse on strong setups)
- MTF status strip: `src/components/ui/MTFStrip.jsx` — multi-timeframe EMA alignment
- MTF signals hook: `src/hooks/useMTFSignals.js` — fetches bars across 5m/15m/1h/4h/1D

### Stores
- Primary UI state: `src/store/useChartStore.js` (timeframe, symbol, indicators, activePanel, theme, accentId)
- Preset store: `src/store/usePresetsStore.js`
- Alert store: `src/store/useAlertsStore.js`
- Trade journal store: `src/store/useJournalStore.js`
- Toast store: `src/store/useToastStore.js`

### Data Layer (provider-abstracted)
- Provider interface: `src/services/dataProvider.js` — `fetchBars()`, `fetchSnapshot()`, `getProviderName()`
- Alpaca adapter: `src/services/providers/alpaca.js` — normalization, timeframe mapping, WS protocol
- WebSocket manager: `src/services/websocket.js` — connection lifecycle, reconnect (provider-agnostic shell)
- Query client config: `src/services/queryClient.js` — staleTime 30s, refetchOnWindowFocus 'always', retry 1
- Bar normalizer: `src/utils/normalizeBar.js` — Alpaca `{t,o,h,l,c,v}` → `{time,open,high,low,close,volume}`

### Hooks
- Historical bars: `src/hooks/useBars.js` (TanStack Query, provider-agnostic)
- Infinite scroll-back: `src/hooks/useInfiniteHistory.js` — fetch older bars on scroll, prepend to cache
- WebSocket live feed: `src/hooks/useLiveFeed.js` — market-hours gating, bar aggregation, cache injection
- Keyboard shortcuts (1-6, [/], Cmd+K, Cmd+Shift+S, panel toggles): `src/hooks/useKeyboardShortcuts.js`
- Viewport persistence: `src/hooks/useViewportPersistence.js`
- Alert checker: `src/hooks/useAlertChecker.js`
- Daily bars hook: `src/hooks/useDailyBars.js`
- MTF signals: `src/hooks/useMTFSignals.js`
- Watchlist quotes: `src/hooks/useWatchlistQuotes.js`
- Swipe gestures (touch devices): `src/hooks/useSwipeGesture.js`
- Media queries (reactive): `src/hooks/useMediaQuery.js` — `useIsMobile()`, `useIsTablet()`, `useIsLandscape()`
- Pull-to-refresh (mobile): `src/hooks/usePullToRefresh.js` — touch gesture, threshold-based trigger

### Right Panels (slide-out on desktop, bottom sheet on mobile)
- Alerts panel: `src/components/panels/AlertsPanel.jsx`
- Backtest panel: `src/components/panels/BacktestPanel.jsx`
- Journal panel: `src/components/panels/JournalPanel.jsx`
- Watchlist panel: `src/components/panels/WatchlistPanel.jsx`

### Standalone Pages (separate Vite entry points)
- Roadmap HTML entry: `roadmap.html` — `/roadmap` route, own OG/SEO meta tags
- Roadmap JS entry: `src/roadmap-main.jsx` — minimal shell (back link, no stores/query/theme sync)
- Roadmap CSS: `src/roadmap.css` — standalone stylesheet with fixed dark color scheme (not shared with main app)
- Roadmap component: `src/components/pages/RoadmapPage.jsx` — 16-phase interactive learning tracker with progress persistence, beginner filter, mastered badges
- Roadmap data (86 topics): `src/constants/roadmap.js` — phases, nodes, concepts, resources, tips, estimated times per phase

### UI Components
- Preset selector UI: `src/components/ui/PresetSelector.jsx`
- Default preset definitions: `src/constants/presets.js`
- Accent color presets (per-theme): `src/constants/accents.js`
- Command palette (Cmd+K): `src/components/ui/CommandPalette.jsx`
- Settings modal (3 themes + 6 accent presets/theme + shortcuts + sound alerts): `src/components/ui/SettingsModal.jsx`
- Error boundary: `src/components/ui/ErrorBoundary.jsx`
- Logo: `src/components/ui/Logo.jsx`
- Toast notifications: `src/components/ui/ToastContainer.jsx`
- Status bar (WS/polling + session stats + Stripe donate link): `src/components/ui/StatusBar.jsx`
- Welcome banner (first-visit, dismissible): `src/components/ui/WelcomeBanner.jsx`
- ATR gauge: `src/components/ui/ATRGauge.jsx`
- Day type banner: `src/components/ui/DayTypeBanner.jsx`
- Onboarding tour (first-visit + manual restart via Help menu): `src/components/ui/OnboardingTour.jsx`

### Utilities
- Structured logger: `src/utils/logger.js` — level-gated (`debug`/`info`/`warn`/`error`), lazy Sentry forwarding via `getSentry()`
- Shared timezone utils: `src/utils/timezone.js`
- localStorage schema validation: `src/utils/validate.js`
- Chart snapshot capture + export (confluence watermark): `src/utils/snapshot.js`

### Services
- Data provider: `src/services/dataProvider.js` — provider-abstracted data fetching
- Alpaca provider adapter: `src/services/providers/alpaca.js`
- Sentry (dynamic import): `src/services/sentry.js` — async `initSentry()`, `getSentry()` lazy accessor, `reportWebVitals()`

### PWA & SEO
- Manifest: `public/manifest.json`
- Service worker (source, build-time processed): `src/sw.js`
- Self-hosted fonts: `public/fonts/boogaloo-regular.woff2`, `public/fonts/inter-800.woff2`
- Icons: `public/icons/icon-192.png`, `public/icons/icon-512.png` (branded, generated by `scripts/generate-icons.js`)
- OG image: `public/og-image.png` (1200x630, generated by `scripts/generate-og-image.js`)
- SEO: `public/robots.txt`, `public/sitemap.xml`, `<link rel="canonical">` in `index.html`

### Constants
- Chart constants (all indicator/chart colors + timeframes): `src/constants/chart.js`
  - EMA colors, VWAP colors, level colors (PDH/PDL gold, ODC slate, ORB indigo), volume colors, chart bg/grid
  - RVOL highlight colors (`RVOL_AMBER` ≥1.5x, `RVOL_HOT` ≥2.0x) — used by memoized RVOL map in CandlestickChart
  - Candle colors per theme (`CANDLE_COLORS`), RSI colors, MACD colors, S/R colors (red resistance, green support)
  - Bollinger colors, confluence/signal colors, alert sound config
  - Timeframe config (lookback, page size, max bars), symbol suggestions
- Shared validation patterns (SYMBOL_RE): `src/constants/patterns.js`
- Default preset definitions: `src/constants/presets.js`
- Accent color presets (per-theme): `src/constants/accents.js`
- Trading roadmap data (16 phases, 86 topics, est. times): `src/constants/roadmap.js`

### Tooling
- ESLint config (flat): `eslint.config.js`
- Pre-commit hooks: `.husky/pre-commit` → `lint-staged` (ESLint on staged files)
- CI pipeline: `.github/workflows/ci.yml` — lint + test + build on push/PR
- Vite config + SW versioning plugin + MPA input (index + roadmap): `vite.config.js`
- PostCSS config (`@tailwindcss/postcss`): `postcss.config.js`
- Tailwind theme tokens: `src/index.css` `@theme` block (no `tailwind.config.js` — TW4)
- OG image generator: `scripts/generate-og-image.js` — outputs `public/og-image.png` (requires sharp devDep)
- PWA icon generator: `scripts/generate-icons.js` — outputs `public/icons/icon-{192,512}.png` (requires sharp devDep)

### Docs
- Project spec + architecture: `project.md`
- Task board: `tasks.md`
- Indicator math reference: `indicators.md`
- Security standards: `security.md`
- Growth & traction strategy: `growth.md` (gitignored — local only)
- Internal docs (gitignored): `brainstorming.md`, `audit.md`, `bugs.md`, `left-bar-problems.md`, etc.

## Developer workflow
- **Pre-commit:** `husky` + `lint-staged` runs `eslint --max-warnings=0` on staged `src/` and `api/` files
- **CI:** GitHub Actions runs `npm run lint` → `npx vitest run` → `npm audit --audit-level=high` → `lockfile-lint` → `npm run build` on every push/PR to `main`
- **Scripts:** `npm run lint` (check), `npm run lint:fix` (auto-fix), `npm test` (watch), `npx vitest run` (single-run)
- **Quality gate:** No ESLint warnings allowed in commits (enforced by lint-staged `--max-warnings=0`)

## Production infrastructure rules
- Static assets (`/assets/*`): `Cache-Control: public, max-age=31536000, immutable` (Vite content-hashes filenames)
- HTML (`/`): `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- API endpoints: per-endpoint cache (bars 30s, snapshot 15s, ws-auth no-store)
- Fonts must be self-hosted (no external CDN dependency) — `public/fonts/`
- Service worker `CACHE_NAME` must be auto-versioned via build hash (not manual bump)
- `prefers-reduced-motion: reduce` must be respected for all animations
- Open Graph meta tags required in `index.html` for social sharing previews
- Error tracking via Sentry free tier (5K errors/month, session replay)

## Known issues (from 2026-03-18 deep assessment, updated 2026-03-24)

### High — RESOLVED
- ~~`BottomSheet` CSS missing `safe-area-inset-bottom`~~ — fixed: `padding-bottom: env(safe-area-inset-bottom)` added
- ~~`usePullToRefresh.js` dependency array~~ — fixed: replaced state deps with refs, effect now stable
- ~~Preset switching crashes~~ — fixed (2026-03-24): overlay effects wrapped in try/catch + `disposedRef`, mini chart crosshair handlers read live ref, CandlestickChart prepend null guard added
- ~~API request IDs use `Math.random()`~~ — fixed (2026-03-24): switched to `crypto.randomUUID()`
- ~~No explicit fetch timeout on API proxy calls~~ — fixed (2026-03-24): `AbortSignal.timeout(10_000)` on all upstream fetches
- ~~Security headers not reaching root path~~ — fixed (2026-03-24): `/(.*)`  → `/:path*` in vercel.json

### Medium — RESOLVED
- ~~`CandlestickChart.jsx`: `relativeVolume(bars)` not in `useMemo`~~ — fixed (2026-03-24): memoized, RVOL constants moved to `chart.js`
- ~~Sentry imported unconditionally (~50-100KB)~~ — fixed (2026-03-24): dynamic import, logger uses lazy `getSentry()`

### Medium — address when touching related code
- Zero test coverage on mobile components (BottomNav, BottomSheet, useMediaQuery, usePullToRefresh)
- No localStorage schema migration system — new fields on journal/presets silently lost on old data
