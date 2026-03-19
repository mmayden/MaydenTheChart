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
- GitHub Actions CI — lint + test (with coverage) + build on every push/PR to `main`
- JavaScript (not TypeScript — tests provide sufficient coverage at current scale)
- `feed: 'iex'` required on all Alpaca data fetches (free tier)
- **No react-router-dom** — single-page app, panel-based architecture
- Motion v12 (formerly Framer Motion) — AnimatePresence for content transitions (panels, modals)
- web-vitals — LCP/CLS/INP/FID/TTFB reporting to Sentry (lazy-loaded, only when Sentry DSN set)
- sharp (devDep) — OG image + PWA icon generation (`scripts/generate-og-image.js`, `scripts/generate-icons.js`)
- Testing: jsdom + @testing-library/react (component/hook tests), `src/test-setup.js` provides global React for JSX transforms

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
- Rate limiting is in shared `api/_rateLimit.js` — `createRateLimiter(max, window)` + `extractIP(req)` + `requestId()`
- All API endpoints use the shared rate limiter (TTL cleanup every 2min, 10K entry cap, emergency 20% purge)
- `ALPACA_DATA_URL` must be validated against `ALLOWED_DATA_HOSTS` via `new URL().hostname` exact match (SSRF guard)
- All user input from URL params, forms, and localStorage must be regex-validated before use
- `SYMBOL_RE` lives in `src/constants/patterns.js` — single source of truth for client-side symbol validation
  (server-side `api/*.js` files keep inline copies for zero-import serverless deploys — keep in sync)
- API errors must never leak upstream status codes, URLs, or stack traces to clients
- ErrorBoundary shows raw error messages only in `import.meta.env.DEV`
- Service worker `CACHE_NAME` is auto-versioned at build time (Vite plugin in `vite.config.js`)
- Bearer token in `ws-auth.js` is NOT a real secret (ships in client bundle) — rate limiting is the real gate
- All localStorage keys use `cheechart-` prefix (`cheechart-theme`, `cheechart-accent`, `cheechart-symbol`, etc.)
- Backup import: 5MB file size gate, magic marker + version check, every field through validators, `__proto__`/`constructor`/`prototype` key rejection, array caps, no eval/innerHTML, first-char sanity check
- Preset share links: base64url decode in try/catch, strict fixed-schema validation, unknown keys dropped, processed once per page load

## Observability

**Logging:** All client-side logging goes through `src/utils/logger.js`. Never use raw
`console.*` in `src/` — use `log.debug/info/warn/error(tag, message, ...args)` instead.
Dev builds get all levels; production gets warn + error only. Errors are auto-forwarded
to Sentry via `captureException`. Use `log.breadcrumb(category, message, data)` to add
Sentry breadcrumbs for user actions (symbol change, timeframe switch, etc.).

**Sentry:** Conditional on `VITE_SENTRY_DSN`. Dynamically imported — `@sentry/react`
is loaded via `import()` only when DSN is set (zero bundle cost otherwise). Logger
accesses Sentry via `getSentry()` from `sentry.js`. Captures: unhandled errors (global),
ErrorBoundary crashes (explicit `captureException`), data fetch failures (via logger),
WebSocket errors (via logger). Includes `browserTracingIntegration` for performance
monitoring and web vitals (LCP, CLS, INP, FID, TTFB) via `web-vitals` library.
Breadcrumbs track user navigation (symbol/timeframe changes).

**API request IDs:** All serverless functions (`api/*.js`) generate a `x-request-id`
header via `crypto.randomUUID()`. Server-side `console.error` logs include `rid=<id>`
for correlation with Vercel function logs. All proxy fetch calls have 15s
`AbortSignal.timeout()` to fail fast.

**Error surfacing:** Data fetch errors (bar/snapshot failures) are shown to users as
toast notifications instead of silent failures. ErrorBoundary provides reset/reload UI.

## Architecture

Single-page app. Chart is always visible. Tools live in slide-out right panels.
URL state sync via query params only (?s=QQQ&tf=5m&p=full&panel=backtest).

```
TopNav → Sidebar (left) → Chart (center) → RightPanel (right, one at a time)
```

**Right panel system:** `activePanel` in useChartStore controls which panel is shown.
Values: `null | 'alerts' | 'backtest' | 'journal' | 'watchlist' | 'screener' | 'replay'`. Same panel = close,
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
`EMA_COLORS`, `VWAP_*_COLOR`, `VOLUME_UP/DOWN_COLOR`, `SIGNAL_COLORS`,
`RSI_DIV_BULL/BEAR_COLOR`, `EMA_CROSS_BULL/BEAR_COLOR`,
`VP_BULL/BEAR/POC_COLOR`, `VP_VA/OUTSIDE_OPACITY`, `VP_MAX_WIDTH_FRACTION`,
`ATR_GAUGE_COLORS` (per-theme red/yellow/green), `DAY_TYPE_COLORS` (per-type hex).

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
- **Focus traps:** `useFocusTrap` hook on both modals — Tab/Shift+Tab cycles within the dialog,
  focus restores to the previously-focused element on close
- All panel toggle buttons (Alerts, Watchlist, Backtest, Journal, Screener) have `aria-label` + `aria-pressed`
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
- `barSpacing: 8`, `minBarSpacing: 2`, `rightOffset: 5`, `fixRightEdge: true` — proportional bars, snapped to data boundary
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
  `.landscape-hide` (desktop status bar), `.landscape-compact` (desktop sub-header). Mini charts
  hidden in mobile landscape. Orientation change fires `cheechart:layout-resize`.
- **Responsive fonts:** CSS vars `--text-xs`/`--text-sm`/`--text-base` using `clamp()`.
- **Performance:** `.chart-contain` (`contain: layout style`) on chart wrapper.
  `.bottom-sheet` has `contain: layout style`. All animations use transform/opacity only.
- **Pull-to-refresh:** `usePullToRefresh` hook — touch-only, 60px threshold, shows spinner.
- **Haptic feedback:** `navigator.vibrate(200)` on alert triggers (feature-detected).
- **Tabbed sub-indicator (Phase 15A):** `IndicatorTabView` renders one indicator at a time
  on mobile with inline tab labels (no separate row). Desktop: stacked. Value overlay shows
  current indicator reading as HTML label, updates on crosshair move. Swipe-down dismisses.
- **Full-screen chart (Phase 15B):** `isFullscreen` in useChartStore. Double-click (desktop)
  or double-tap (mobile) to enter. Hides all chrome. Exit: ESC key, exit pill (persistent
  "Tap to exit" on mobile, auto-fading on desktop), or double-tap again.
- **Long-press alerts (Phase 15C):** 500ms long-press → haptic → price from touch Y →
  alert created via `useAlertsStore` + success toast. Ignores volume zone (bottom 18%).
- **Mobile layout optimization (Phase 15D):** Status bar removed on mobile (connection dot
  in BottomNav hamburger). Price/confluence/day type merged into TopNav. Sub-header eliminated.
  ~78px vertical space reclaimed (chart gets 69% of iPhone 14 screen, up from 60%).

**Trade Replay (Phase 12F):**
- Right panel (`'replay'`). User picks a date, fetches 5m bars, steps bar-by-bar.
- `useReplayStore` manages: `isReplaying`, `replayBars`, `currentStep`, `speed` (1/2/5/10x),
  `isPlaying`, `trades[]`, `openPosition`. Actions: `startReplay`, `stepForward/Back`,
  `placeBuy`, `placeSell`, `togglePlay`. Computed: `getVisibleBars()`, `getRunningPnL()`, `getStats()`.
- When `isReplaying`, `App.jsx` passes `replayBars.slice(0, currentStep + 1)` to chart
  instead of live bars. Live feed continues but chart shows replay data.
- Transport: play/pause (Space), step (arrows), speed pills. Simulated buy/sell with P&L.
- Keyboard shortcut: `R` toggles replay panel.

**Chart Annotations (Phase 12F):**
- `useAnnotationsStore` persists to `cheechart-annotations` in localStorage, keyed by symbol.
- Three types: `'text'` (circle marker with label), `'arrow'` (arrowUp/arrowDown marker),
  `'hline'` (price line via `candleSeries.createPriceLine()`).
- `annotationMode` in `useChartStore`: `null | 'text' | 'arrow' | 'hline'`. When set, chart
  container gets `cursor: crosshair` and clicks create annotations at the clicked time/price.
- Text/arrow markers merge into SROverlay via `extraMarkers` pipeline (same as divergences/EMA crosses).
- `AnnotationToolbar` floats top-left of chart with 3 tool buttons + count + clear.
- Keyboard: `N` cycles modes (text → arrow → hline → off), `Escape` exits annotation mode.

**Volume Profile (Phase 12F):**
- `volumeProfile(bars, numBins = 70)` in `src/utils/volumeProfile.js` — pure math.
- `VolumeProfilePrimitive` in `src/primitives/VolumeProfilePrimitive.js` — lightweight-charts v5
  `ISeriesPrimitive` with canvas drawing. Draws in `drawBackground()` (candles render on top).
- `VolumeProfileOverlay` in `src/components/indicators/VolumeProfileOverlay.jsx` — React overlay.
- Horizontal bars from right edge leftward, width ∝ volume/POC. POC = amber, VA = 35% opacity,
  outside VA = 15%. Bull volume = blue, bear volume = red, split within each row.
- Toggle: `volProfile` in store/sidebar (off by default — power-user feature).
- Does NOT affect price scale auto-scaling (`autoscaleInfo()` returns null).

**Weekly Gap Tracking (Phase 12F):**
- `detectWeeklyGaps()` + `checkGapFills()` in `src/utils/gaps.js` (15 tests).
- `useWeeklyBars` hook fetches 1yr weekly bars (10min stale, only when `gaps` toggle is on).
- `GapOverlay` renders unfilled gaps as price line pairs (top/bottom of gap zone).
- Gap up = green semi-transparent, gap down = red semi-transparent. Labels show fill %.
- Toggle: `gaps` in store/sidebar (off by default, on in Full/Swing presets).

## Key file locations

### App Shell
- App shell (single-page): `src/App.jsx`
- Top navigation bar: `src/components/layout/TopNav.jsx` — on mobile, also renders PriceDisplay + ConfluenceBar + DayTypeBanner (props: bars, byDay, confluence, dayType)
- Left sidebar (chart controls): `src/components/layout/Sidebar.jsx`
- Right panel shell: `src/components/layout/RightPanel.jsx` (side panel desktop, bottom sheet mobile)
- Bottom navigation (mobile only): `src/components/layout/BottomNav.jsx` — timeframe pills + panel toggles + connection status dot
- Bottom sheet (mobile panels): `src/components/ui/BottomSheet.jsx` — draggable, snap points, velocity dismiss
- URL state sync: `src/hooks/useURLState.js`

### Chart & Indicators
- Indicator math: `src/utils/indicators.js` — all public functions validate input via `validateBars(bars, minLen, fields)`
- Level math: `src/utils/levels.js`
- S/R detection: `src/utils/supportResistance.js`
- Gap detection: `src/utils/gaps.js` — weekly gap detection + fill tracking
- Volume profile math: `src/utils/volumeProfile.js` — price-level volume bins, POC, Value Area
- Confluence score: `src/utils/confluence.js`
- Backtester engine: `src/utils/backtest.js`
- Constants (EMA colors etc): `src/constants/chart.js`
- Main chart: `src/components/chart/CandlestickChart.jsx`
- Live price + % change header: `src/components/chart/PriceDisplay.jsx`
- Symbol input + autocomplete: `src/components/chart/SymbolInput.jsx`
- Timeframe button group: `src/components/chart/TimeframeSelector.jsx`
- Crosshair OHLCV legend: `src/components/ui/CrosshairLegend.jsx`
- RSI/MACD tabbed sub-indicator: `src/components/ui/IndicatorTabView.jsx` (`React.memo` + `useMemo`, tabs on mobile, stacked on desktop) + `SubIndicatorValueOverlay.jsx` (live value readout) + `RSIMiniChart.jsx` + `MACDMiniChart.jsx` + `miniChartConfig.js` (shared opts)
- Sidebar indicator toggles (all indicators): `src/components/ui/IndicatorToggle.jsx`

### Indicator Overlays
- EMA 9/48/200 line series: `src/components/indicators/EMAOverlay.jsx`
- VWAP + σ band series: `src/components/indicators/VWAPOverlay.jsx`
- Prev H/L, ORB zone, ODC: `src/components/indicators/LevelOverlay.jsx`
- S/R lines + swing markers + extra markers (divergences, EMA crosses): `src/components/indicators/SROverlay.jsx`
- Bollinger Bands: `src/components/indicators/BollingerOverlay.jsx`
- Weekly gaps: `src/components/indicators/GapOverlay.jsx` — unfilled gap zones from weekly bars
- Volume profile: `src/components/indicators/VolumeProfileOverlay.jsx` + `src/primitives/VolumeProfilePrimitive.js` — horizontal volume histogram (ISeriesPrimitive canvas drawing)
- Chart annotations: `src/components/indicators/AnnotationOverlay.jsx` — user-drawn text/arrow/hline markers
- RSI divergence + 4hr EMA cross markers are computed in `App.jsx` and passed to SROverlay via `extraMarkers` prop

### Synthesis Layer
- Confluence bar: `src/components/ui/ConfluenceBar.jsx` — setup quality readout (glow + pulse on strong setups)
- MTF status strip: `src/components/ui/MTFStrip.jsx` — multi-timeframe EMA alignment
- MTF signals hook: `src/hooks/useMTFSignals.js` — fetches bars across 5m/15m/1h/4h/1D

### Stores
- Primary UI state: `src/store/useChartStore.js` (timeframe, symbol, indicators, activePanel, activeSubIndicator, isFullscreen, annotationMode, theme, accentId)
- Preset store: `src/store/usePresetsStore.js`
- Alert store: `src/store/useAlertsStore.js` (persisted per-preset: `cheechart-alerts-{presetId}`)
- Trade journal store: `src/store/useJournalStore.js`
- Toast store: `src/store/useToastStore.js`
- Annotation store: `src/store/useAnnotationsStore.js` — per-symbol localStorage persistence
- Replay store: `src/store/useReplayStore.js` — replay state, simulated trades, P&L

### API Layer (serverless)
- Shared rate limiter + IP extraction + request ID: `api/_rateLimit.js`
- Bar proxy: `api/bars.js` — symbol/timeframe/date validation, pagination, SSRF guard
- Snapshot proxy: `api/snapshot.js` — multi-symbol validation, SSRF guard
- WS auth proxy: `api/ws-auth.js` — bearer token gate, timing-safe comparison

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
- Keyboard shortcuts (1-6, [/], Cmd+K, Cmd+Shift+S, A/B/J/W/F/R panel toggles, N annotate, Esc exits annotation→fullscreen→panel): `src/hooks/useKeyboardShortcuts.js`
- Viewport persistence: `src/hooks/useViewportPersistence.js`
- Alert checker: `src/hooks/useAlertChecker.js`
- Daily bars hook: `src/hooks/useDailyBars.js`
- MTF signals: `src/hooks/useMTFSignals.js`
- Watchlist quotes: `src/hooks/useWatchlistQuotes.js`
- Screener scanner: `src/hooks/useScreener.js` — fetches bars + computes confluence for each watchlist symbol
- 4hr EMA crosses: `src/hooks/useEMACrosses.js` — fetches 4hr bars, detects EMA 9×48 crossovers
- Weekly bars: `src/hooks/useWeeklyBars.js` — fetches 1yr weekly bars for gap detection
- Swipe gestures (touch devices): `src/hooks/useSwipeGesture.js` — sidebar open/close (disabled on mobile, BottomNav hamburger is the single toggle)
- Media queries (reactive): `src/hooks/useMediaQuery.js` — `useIsMobile()`, `useIsTablet()`, `useIsLandscape()`
- Pull-to-refresh (mobile): `src/hooks/usePullToRefresh.js` — touch gesture, threshold-based trigger
- Long-press (mobile alerts): `src/hooks/useLongPress.js` — 500ms hold, 10px move cancel, haptic feedback
- Focus trap (modals): `src/hooks/useFocusTrap.js` — Tab/Shift+Tab cycle within container, focus restore on close

### Right Panels (slide-out on desktop, bottom sheet on mobile)
- Alerts panel: `src/components/panels/AlertsPanel.jsx`
- Backtest panel: `src/components/panels/BacktestPanel.jsx`
- Journal panel: `src/components/panels/JournalPanel.jsx`
- Watchlist panel: `src/components/panels/WatchlistPanel.jsx`
- Screener panel: `src/components/panels/ScreenerPanel.jsx` — scans watchlist for confluence setups, ranked by score
- Replay panel: `src/components/panels/ReplayPanel.jsx` — bar-by-bar trade replay with simulated P&L

### UI Components
- Preset selector UI: `src/components/ui/PresetSelector.jsx`
- Default preset definitions: `src/constants/presets.js`
- Accent color presets (per-theme): `src/constants/accents.js`
- Command palette (Cmd+K): `src/components/ui/CommandPalette.jsx`
- Settings modal (3 themes + 6 accent presets/theme + shortcuts + sound alerts + data backup): `src/components/ui/SettingsModal.jsx`
- Data tab (backup export/import/reset in Settings modal): `src/components/ui/DataTab.jsx`
- Error boundary: `src/components/ui/ErrorBoundary.jsx`
- Logo: `src/components/ui/Logo.jsx`
- Toast notifications: `src/components/ui/ToastContainer.jsx`
- Status bar (desktop only — WS/polling + session stats + Ko-fi link): `src/components/ui/StatusBar.jsx`
- Welcome banner (first-visit, dismissible): `src/components/ui/WelcomeBanner.jsx`
- ATR gauge: `src/components/ui/ATRGauge.jsx` — colors from `ATR_GAUGE_COLORS` in chart.js
- Annotation toolbar: `src/components/ui/AnnotationToolbar.jsx` — floating draw tools (text/arrow/hline)
- Day type banner: `src/components/ui/DayTypeBanner.jsx`
- Onboarding tour (first-visit + manual restart via Help menu): `src/components/ui/OnboardingTour.jsx`

### Utilities
- Structured logger: `src/utils/logger.js` — level-gated (`debug`/`info`/`warn`/`error`), auto-forwards errors to Sentry
- Shared timezone utils: `src/utils/timezone.js`
- localStorage schema validation: `src/utils/validate.js`
- Backup/restore + preset share links: `src/utils/backup.js` — export, import, encode/decode share URLs
- Chart snapshot capture + export (confluence watermark): `src/utils/snapshot.js`

### Services
- Data provider: `src/services/dataProvider.js` — provider-abstracted data fetching
- Alpaca provider adapter: `src/services/providers/alpaca.js`
- Sentry error tracking + web vitals: `src/services/sentry.js` (dynamic import — zero cost when DSN unset)

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
  - Candle colors per theme (`CANDLE_COLORS`), RSI colors, MACD colors, S/R colors (red resistance, green support)
  - Bollinger colors, confluence/signal colors, alert sound config
  - RSI divergence marker colors (`RSI_DIV_BULL_COLOR`, `RSI_DIV_BEAR_COLOR`)
  - EMA cross marker colors (`EMA_CROSS_BULL_COLOR`, `EMA_CROSS_BEAR_COLOR`)
  - RVOL highlight colors (`RVOL_AMBER` ≥1.5x, `RVOL_HOT` ≥2x)
  - Weekly gap colors (`GAP_UP_COLOR`, `GAP_DOWN_COLOR`)
  - Annotation colors (`ANNOTATION_TEXT_COLOR`, `ANNOTATION_ARROW_COLOR`, `ANNOTATION_LINE_COLOR`)
  - Volume profile colors (`VP_BULL_COLOR`, `VP_BEAR_COLOR`, `VP_POC_COLOR`, `VP_VA_OPACITY`, `VP_OUTSIDE_OPACITY`, `VP_MAX_WIDTH_FRACTION`)
  - Replay colors (`REPLAY_BUY_COLOR`, `REPLAY_SELL_COLOR`)
  - ATR gauge colors per theme (`ATR_GAUGE_COLORS`)
  - Day type colors (`DAY_TYPE_COLORS` — trend-bull green, trend-bear red, chop amber, range gray)
  - Timeframe config (lookback, page size, max bars), symbol suggestions
- Shared validation patterns (SYMBOL_RE): `src/constants/patterns.js`
- Default preset definitions: `src/constants/presets.js`
- Accent color presets (per-theme): `src/constants/accents.js`

### Testing (472 test cases across 22 test files, coverage via @vitest/coverage-v8)
- Test setup (global React for JSX transforms): `src/test-setup.js`
- **Hook tests (18):** `useMediaQuery.test.js` (8), `usePullToRefresh.test.js` (10)
- **Component tests (21):** `BottomSheet.test.jsx` (6), `BottomNav.test.jsx` (15)
- **Store tests (81+):** `useChartStore` (19), `usePresetsStore` (21), `useJournalStore` (8), `useAlertsStore` (22), `useToastStore` (11)
- **Util tests (349+):** `indicators` (81), `levels` (32), `validate` (62), `backup` (56), `backtest` (16), `timezone` (17), `supportResistance` (12), `confluence` (19), `snapshot` (7), `normalizeBar` (5), `accents` (9), `gaps` (15), `volumeProfile` (21)
- Component tests use `// @vitest-environment jsdom` pragma (global env stays `node` for pure-logic tests)
- **Coverage:** CI runs `npx vitest run --coverage` on every push/PR. Utils layer at 94%, stores at 67%

### Tooling
- ESLint config (flat): `eslint.config.js`
- Pre-commit hooks: `.husky/pre-commit` → `lint-staged` (ESLint on staged files)
- CI pipeline: `.github/workflows/ci.yml` — lint + test + build on push/PR
- Vite config + SW versioning plugin + test setup + hidden sourcemaps: `vite.config.js`
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
- **CI:** GitHub Actions runs `npm run lint` → `npx vitest run --coverage` → `npm run build` on every push/PR to `main`
- **Scripts:** `npm run lint` (check), `npm run lint:fix` (auto-fix), `npm test` (watch), `npx vitest run` (single-run), `npx vitest run --coverage` (with coverage)
- **Quality gate:** No ESLint warnings allowed in commits (enforced by lint-staged `--max-warnings=0`)
- **Test conventions:**
  - Pure logic tests (utils, stores): `environment: 'node'` (default), import from vitest directly
  - Component/hook tests needing DOM: add `// @vitest-environment jsdom` pragma at top of file
  - `src/test-setup.js` runs for all tests — provides `globalThis.React` for JSX transform compatibility
  - Component tests mock `motion/react` with plain div forwarding (see `BottomSheet.test.jsx` pattern)
  - Store tests use `beforeEach` to reset Zustand state to known defaults

## Production infrastructure rules
- Static assets (`/assets/*`): `Cache-Control: public, max-age=31536000, immutable` (Vite content-hashes filenames)
- HTML (`/`): `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- API endpoints: per-endpoint cache (bars 30s, snapshot 15s, ws-auth no-store)
- Fonts must be self-hosted (no external CDN dependency) — `public/fonts/`
- Service worker `CACHE_NAME` must be auto-versioned via build hash (not manual bump)
- `prefers-reduced-motion: reduce` must be respected for all animations
- Open Graph meta tags required in `index.html` for social sharing previews
- Error tracking via Sentry free tier (5K errors/month, session replay)
- Hidden sourcemaps (`build.sourcemap: 'hidden'`) — Sentry ingests them, users don't see them
- `engines: { node: ">=20" }` in package.json — enforces minimum Node version

## Known issues

> Assessment findings (2026-03-18): all high/medium/low priority items resolved.
> Only open items below remain — address when touching related code.

### Open
- No localStorage schema migration system — new fields on journal/presets silently lost on old data
- SW precache strategy — only caches shell, not JS/CSS assets (consider Workbox)
