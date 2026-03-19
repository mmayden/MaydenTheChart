# Task List — Cheechart

> Living task board. Update status as work progresses.
> 🔲 not started | 🔄 in progress | ✅ done | ❌ blocked

---

## ✅ Phase 15 — Mobile UX Leap (Complete)

### Phase 15A — Tabbed Sub-indicator ✅
- ✅ Replace stacked RSI+MACD with single tabbed sub-chart area
- ✅ Inline tab labels inside chart area (no separate row overhead)
- ✅ Value overlay label — shows current indicator reading (updates on crosshair)
- ✅ Desktop: preserve stacked option; mobile: strictly one at a time
- ✅ Swipe-down on sub-indicator area to dismiss (hides both RSI + MACD)

### Phase 15B — Full-screen Chart Mode ✅
- ✅ Double-click (desktop) / double-tap (mobile) to enter fullscreen
- ✅ Hide all chrome (TopNav, BottomNav, sidebar, sub-charts, status bar, sub-header, right panel)
- ✅ `isFullscreen` + `toggleFullscreen` in useChartStore
- ✅ Exit pill: persistent "Tap to exit" on mobile, auto-fading "ESC to exit" on desktop
- ✅ Chart fires `cheechart:layout-resize` on toggle

### Phase 15C — Long-press Alert Creation ✅
- ✅ Long-press (500ms) on chart → haptic → price from touch Y via coordinateToPrice
- ✅ Creates alert directly + success toast with price
- ✅ Wire into existing useAlertsStore — auto-detects above/below
- ✅ Ignores volume zone (bottom 18% of chart) + negative/NaN prices

### Phase 15D — Mobile Layout Optimization ✅
- ✅ Status bar removed on mobile — connection dot integrated into BottomNav hamburger
- ✅ Price + confluence + day type merged into TopNav on mobile — sub-header eliminated (~50px saved)
- ✅ Total vertical space reclaimed: ~78px (sub-header 50px + status bar 28px)
- ✅ Mobile chart now gets ~582px on iPhone 14 (69% of screen, up from 504px / 60%)

---

## ✅ Phase 12F — Future Differentiators (Complete)

- ✅ RSI divergence chart markers — detects bull/bear divergences, renders as ▲/▼ arrows on main chart
- ✅ 4hr EMA cross annotations — fetches 4hr bars, detects EMA 9×48 crosses, maps to current timeframe
- ✅ Screener panel — scans watchlist for active setups, ranked by confluence score, day type + RSI + ATR readouts
- ✅ Trade replay — step through historical days bar-by-bar with simulated paper trades, play/pause/speed, running P&L
- ✅ Chart annotations — text notes, arrow markers, horizontal lines on chart, saved per symbol in localStorage
- ✅ Weekly gap tracking — detects unfilled weekly gaps, renders as price line pairs on chart, fill % tracking
- ✅ Volume profile — horizontal volume histogram via ISeriesPrimitive canvas drawing, POC + Value Area, 21 tests
- ✅ Alert sets per preset — alerts persist per-preset in localStorage, swap on preset switch, copy on save-as, cleanup on delete
- ✅ Backup & restore + preset share links — JSON export/import (Settings > Data tab), preset share URLs (?share=), command palette commands, validation layer

---

## 📌 Open Items — Address When Touching Related Code

> Assessment findings (2026-03-18): all high/medium/low items resolved.
> Polish batch (2026-03-19): 6 items resolved (memoization, color constants, input validation, sourcemaps, engines).
> Focus traps (2026-03-19): useFocusTrap hook for CommandPalette + SettingsModal.
> CI coverage (2026-03-19): @vitest/coverage-v8 added, runs on every push/PR.
> 2 items remain.

- 🔲 No localStorage schema migration system — adding new fields silently drops old data
- 🔲 SW precache strategy — only caches shell, not JS/CSS assets (consider Workbox)

---

## 📌 Deferred — Mobile Polish (follow-up QA)

> Core mobile overhaul (M1–M5) + Phase 15 UX leap complete. These are follow-up QA items.

- 🔲 iOS Safari / Chrome Android cross-device QA pass (test double-tap fullscreen, long-press alerts, swipe-down dismiss)
- 🔲 Onboarding tour mobile variant (currently welcome toast only)
- 🔲 Lighthouse PWA audit pass
- 🔲 Bottom sheet snap tuning (spring constants, velocity sensitivity)
- 🔲 Offline chart data caching (service worker strategy)

---

## ❌ Blocked / Needs Input

> Nothing blocked yet.

---

## ✅ Completed Phases — Archive

### Mobile + Chart UX Polish (2026-03-19)
- ✅ Removed swipe-to-open sidebar on mobile — BottomNav hamburger is the single toggle (swipe gesture was unreliable + redundant)
- ✅ Chart right-edge snapping (`fixRightEdge: true`) — prevents scrolling past latest bar into empty space, matches TradingView/Webull behavior

### Accessibility + CI Polish (2026-03-19)
- ✅ Focus traps in CommandPalette + SettingsModal — `useFocusTrap` hook (Tab/Shift+Tab cycle, focus restore on close)
- ✅ CI test coverage reporting — `@vitest/coverage-v8`, `text` + `json-summary` reporters, runs on every push/PR

### Polish Batch — Code Quality & Build Config (2026-03-19)
- ✅ `IndicatorTabView` memoized (`React.memo` + `useMemo` for inline tab labels)
- ✅ `ATRGauge` colors → `ATR_GAUGE_COLORS` in `constants/chart.js` (per-theme)
- ✅ `classifyDayType` colors → `DAY_TYPE_COLORS` in `constants/chart.js`
- ✅ `indicators.js` input validation — `validateBars()` on all 7 public functions (array type + numeric field checks)
- ✅ Vite sourcemaps for Sentry (`build.sourcemap: 'hidden'`)
- ✅ `engines: { node: ">=20" }` in package.json

### Phase 12F — Backup & Restore + Preset Share Links (2026-03-19)
- **Backup & restore:** Versioned JSON envelope (`cheechart: true`, `version: 1`) with all user data (presets, alerts, journal, watchlist, annotations, preferences). Export triggers browser download. Import via file picker or drag-drop with preview summary and confirm. Merge strategy per section (presets: new UUIDs on collision, journal: by ID, watchlist: union dedup, symbolUsage: max-wins). Settings modal "Data" tab with export/import/reset. Command palette "Export Backup" / "Import Backup" commands. After import, page reloads to rehydrate all stores.
- **Preset share links:** Compact base64url-encoded preset configs (`?share=...`). Indicator bitfield maps 12 toggles to single chars (e.g., `evlR` = ema+vwap+levels+rsi). On visit, decodes, applies indicators+timeframe, cleans URL, shows toast. Does not auto-create named preset.
- **Security:** 5MB file size gate, magic marker + version check, every field through validators, `__proto__`/`constructor`/`prototype` key rejection, array caps (50 alerts/preset, 10K journal, 500 anns/symbol, 200 symbols), no eval/innerHTML, first-char sanity check on files, file type/extension validation.
- **Validators added:** `validateAnnotation()`, `validatePreferences()`, `validateBackupEnvelope()` in validate.js.
- 76 new tests (56 backup + 20 validator), 472 tests total (22 test files)

### Phase 12F — Alert Sets per Preset (2026-03-19)
- **Alert sets per preset:** Alerts now persist per-preset in localStorage (`cheechart-alerts-{presetId}`). Switching presets saves current alerts under old preset and loads new preset's alerts. Save-as copies alerts to new preset. Delete cleans up. AlertsPanel shows active preset name. `validateAlert()` added for localStorage deserialization safety. `INDICATOR_KEYS` in validate.js updated (was missing rsiDiv, emaCross, gaps, volProfile).
- 23 new tests (13 validateAlert + 10 alert store preset switching)
- 396 tests total (21 test files)

### Phase 12F Batch 3 — Volume Profile (2026-03-19)
- **Volume profile:** `volumeProfile()` in `src/utils/volumeProfile.js` — divides price range into 70 bins, distributes volume proportionally, identifies POC + Value Area (70%). `VolumeProfilePrimitive` (ISeriesPrimitive) draws horizontal histogram bars directly on chart canvas. Bull = blue, bear = red, POC = amber, VA rows 35% opacity. `VolumeProfileOverlay.jsx` follows overlay pattern. Toggle: `volProfile` (off by default). New constants: `VP_BULL/BEAR/POC_COLOR`, `VP_VA/OUTSIDE_OPACITY`, `VP_MAX_WIDTH_FRACTION`.
- 21 new tests (edge cases, POC detection, VA coverage, volume distribution, signal shape)
- 373 tests total (22 test files)

### Phase 12F Batch 2 — Trade Replay, Chart Annotations, Weekly Gaps (2026-03-18)
- **Trade replay panel:** New `ReplayPanel` (lazy-loaded). Pick a date, fetch 5m bars, step through bar-by-bar with play/pause/speed (1x/2x/5x/10x). Simulated buy/sell with running P&L, trade history, win rate. Arrow keys + Space for transport. Chart shows progressive bar reveal via `useReplayStore`.
- **Chart annotations:** `useAnnotationsStore` (localStorage per-symbol). Three types: text notes (circle markers), arrows (arrowUp/arrowDown), horizontal lines (price lines). Floating `AnnotationToolbar` top-left of chart. Click-to-place with crosshair cursor. Annotation markers merged into SROverlay via `extraMarkers`. `N` key cycles modes, Escape exits.
- **Weekly gap tracking:** `detectWeeklyGaps()` + `checkGapFills()` in `src/utils/gaps.js` (15 tests). `useWeeklyBars` hook fetches 1yr weekly bars. `GapOverlay` renders unfilled gaps as price line pairs (top/bottom). Toggle: `gaps` (off by default, on in Full/Swing presets). `1Week` added to Alpaca timeframe map.
- New constants: `GAP_UP/DOWN_COLOR`, `ANNOTATION_TEXT/ARROW/LINE_COLOR`, `REPLAY_BUY/SELL_COLOR`
- New CSS vars per theme: `--replay-color`, `--replay-active-bg`
- Added to: TopNav, BottomNav (More menu), CommandPalette, keyboard shortcuts (`R` replay, `N` annotate)
- 352 tests (15 new gap detection tests)

### Phase 12F Batch 1 — RSI Divergences, EMA Crosses, Screener (2026-03-18)
- **RSI divergence markers:** `detectRSIDivergences()` wired to main chart via SROverlay `extraMarkers` merge. Toggle: `rsiDiv` (off by default, on in Full/Swing presets)
- **4hr EMA cross annotations:** New `useEMACrosses` hook fetches 4hr bars, detects EMA 9×48 crosses, maps to nearest bar in current timeframe. Toggle: `emaCross`
- **Screener panel:** New right panel (`ScreenerPanel.jsx`) scans watchlist symbols for active setups. For each: fetches 5m + daily bars, computes full confluence score, displays ranked by score with day type, RSI, ATR readouts. Shares watchlist with WatchlistPanel. Lazy-loaded (7.5KB chunk). Keyboard shortcut: `F`
- **Marker aggregation:** SROverlay now accepts `extraMarkers` prop — merges SR swing markers with divergence + EMA cross markers in a single `setMarkers()` call
- New constants: `RSI_DIV_BULL/BEAR_COLOR`, `EMA_CROSS_BULL/BEAR_COLOR`
- New CSS vars per theme: `--screener-color`, `--screener-active-bg`
- Added to: TopNav, BottomNav (More menu), CommandPalette, keyboard shortcuts, preset definitions

### Assessment Fixes + Mobile Tests (2026-03-18)
- All 11 priority findings resolved: BottomSheet safe area, usePullToRefresh deps, RVOL memoization, Sentry dynamic import, API UUIDs, fetch timeouts, theme DOM mutation, RVOL constants
- 39 mobile component tests added: BottomNav (15), BottomSheet (6), useMediaQuery (8), usePullToRefresh (10)
- Test infrastructure: jsdom + @testing-library/react devDeps, `src/test-setup.js`, per-file jsdom pragma
- 298 → 337 tests

### Codebase Audit & Cleanup (2026-03-18)
- 5-agent parallel audit: security, architecture, chart/indicators, UI/layout, build/tooling
- Security: shared rate limiter, emergency memory purge, IP extraction hardened, ISO date validation, error sanitization
- Architecture: infinite history fetch lock fix, CrosshairLegend CSS var caching, levels.js guard
- Infrastructure: CSP hardened, SW/manifest cache headers, DNS prefetch, color-scheme meta

### Mobile-First Overhaul (M1–M5) (2026-03-18)
- **M1:** Safe areas (`env(safe-area-inset-*)`), `100dvh` with fallback, `useMediaQuery`/`useIsMobile`/`useIsLandscape` hooks, `viewport-fit=cover`
- **M2:** BottomNav (mobile-only): thumb-zone timeframe pills + panel toggles + sidebar hamburger. TopNav slimmed to `h-9` with compact PriceDisplay. StatusBar mobile-optimized (dot+label only)
- **M3:** BottomSheet component (drag handle, snap points, velocity-based dismiss). RightPanel uses bottom sheet on mobile. Chart sub-header stacks into 2 rows on mobile. ConfluenceBar dropdown repositioned for mobile. Mini chart height 70px on mobile (was 90px)
- **M4:** Responsive font scaling (`clamp()`). Landscape mode: `landscape-hide`/`landscape-compact` utilities, mini charts hidden, status bar hidden. Chart `contain: layout style`. Orientation change fires `cheechart:layout-resize`
- **M5:** Pull-to-refresh hook (`usePullToRefresh`). Haptic feedback (`navigator.vibrate`) on alert triggers. PWA manifest: `orientation: any`, `categories`, shortcuts for QQQ/SPY/NVDA

> Collapsed summaries. See `project.md` session log for full details.

### Phase 13C — Discoverability (2026-03-17)
- `robots.txt` + `sitemap.xml` for crawlers, canonical URL meta tag
- Branded PWA icons (192/512) replacing 1x1 placeholders — gold "C" + candlestick chart
- SEO meta description targeting "free charting tool" / "TradingView alternative"
- Vercel rewrite rules for robots.txt + sitemap.xml

### Level/Line Clarity Overhaul (2026-03-17)
- S/R filter: resistance strictly above price, support strictly below (no more "R" labels below current price)
- S/R labels always show strength: "R ×1", "S ×2" etc. (was blank for single-pivot)
- ODC color changed from amber (#f59e0b) to slate (#94a3b8) — visually distinct from gold PDH/PDL
- S/R cap reduced to 5 per type, sorted by strength (strongest survive the cap)

### Bugfix: Data Freshness + Confluence Dropdown (2026-03-17)
- `useBars.js` — safety-net REST polling (2min) even when WS is 'subscribed' (WS can stall on low-volume or market close)
- `queryClient.js` — `refetchOnWindowFocus: 'always'` so tab-switching triggers immediate data refresh
- `App.jsx` — removed `overflow-hidden` from chart sub-header that clipped ConfluenceBar dropdown

### Phase 14C — Chart Interaction UX (2026-03-17)
- Kinetic scrolling (`kineticScroll: { touch: true, mouse: true }`) — momentum/inertia on drag-release
- Magnet crosshair (`CrosshairMode.Magnet`) — snaps to nearest OHLC value instead of floating freely
- Explicit `handleScroll` config: `vertTouchDrag: false` prevents accidental vertical scroll on mobile
- Explicit `handleScale` config: `axisDoubleClickReset: true` for quick zoom reset
- Full `handleScroll`/`handleScale`/`kineticScroll` config blocks for clarity and maintainability

### Phase 14B — Observability (2026-03-17)
- Structured logger (`src/utils/logger.js`): level-gated (debug/info/warn/error), dev gets all, prod gets warn+error
- All client-side `console.*` calls replaced with `log.*` calls — single logging path
- Sentry enhanced: explicit `captureException` in ErrorBoundary + data provider, `browserTracingIntegration`, breadcrumbs on symbol/timeframe changes
- Web vitals (LCP, CLS, INP, FID, TTFB) reported to Sentry via `web-vitals` library (lazy-loaded chunk)
- API request IDs: `x-request-id` header on all serverless responses, `rid=` in server-side error logs
- Data fetch errors surfaced as toast notifications (no more silent failures)

### Phase 14A — Chart Visual Overhaul (2026-03-17)
- Webull-inspired chart refinements: bar spacing (`barSpacing: 8`, `minBarSpacing: 2`), `rightOffset: 5` breathing room
- Dotted grid lines, dashed crosshair (Webull-style), removed axis borders for cleaner edges
- Price scale: `alignLabels`, 5% margins, subdued text color
- Volume bars more transparent (55% opacity), mini charts taller (90px from 82px)
- Mini chart grid: vertical lines hidden, horizontal dotted, no axis borders
- Sub-header: tighter layout, symbol-first price display with `tabular-nums`
- CrosshairLegend: smaller font, tighter positioning, higher contrast background

### Phase 13A — Traction Readiness (2026-03-17)
- Enhanced chart snapshots: watermark includes confluence score + day type (`NVDA 5m · Confluence 85 Bull · Trend Day — Bullish · cheechart.space`)
- First-visit welcome banner: dismissible, localStorage-gated ("Free charting — unlimited indicators, no signup, no ads")
- Ko-fi donate link: heart icon in StatusBar with external link
- OG image: branded 1200x630 PNG with candlestick chart + confluence badge, `summary_large_image` Twitter card
- Codebase cleanup: removed 3 dead shim files, standardized localStorage keys to `cheechart-*` prefix with migration

### Phase 13B — First Impression Polish (2026-03-16)
- 9 hardcoded color violations fixed (AlertsPanel, MACDMiniChart, RSIMiniChart, SROverlay, ErrorBoundary, CandlestickChart, ToastContainer, PresetSelector, IndicatorTabView, CrosshairLegend)
- Confluence bar visual emphasis: bigger score, pulse dot + glow on strong setups
- Accessibility: `:focus-visible` outline, `role="dialog"` + `aria-modal` on modals, `aria-label` + `aria-pressed` on panel buttons

### Phase 12E — Infinite Scroll (2026-03-16)
- `useInfiniteHistory` hook: scroll-back fetch, debounced, viewport save/restore
- Per-timeframe `pageSize` + `maxBars` caps in `TIMEFRAME_CONFIG`
- Loading pill at chart left edge during fetch

### Phase 12D — Data Provider Abstraction (2026-03-16)
- Provider interface (`dataProvider.js`): `fetchBars()`, `fetchSnapshot()`, `getProviderName()`
- Alpaca adapter (`providers/alpaca.js`): normalization, timeframe mapping, WS protocol
- Hooks renamed: `useAlpacaBars` → `useBars`, `useAlpacaSocket` → `useLiveFeed`

### Phase 12C — Dependency Upgrades (2026-03-16)
- React 19, Zustand 5, Vite 8, Tailwind 4 (`@tailwindcss/postcss`, CSS `@theme` block)

### Phase 12B — UX Sharpening (2026-03-16)
- Motion v12 for content transitions (panels, modals)
- Skeleton loading states, accent color customization (6 presets/theme)
- Layout transition fix: CSS persistent wrapper, Motion for content only

### Phase 12A — Production Hardening (2026-03-16)
- Cache headers (immutable assets, HTML SWR), self-hosted fonts
- SW auto-versioning (Vite plugin), OG/Twitter meta tags
- `prefers-reduced-motion` support, Sentry integration

### Process Hardening (2026-03-16)
- Husky 9 + lint-staged pre-commit (`--max-warnings=0`)
- GitHub Actions CI: lint → test → build on push/PR
- Shared `SYMBOL_RE` pattern, font preload tags

### Phase 11 — Polish + Mobile + Security (2026-03-15)
- **11A:** localStorage schema validation (29 tests), API error sanitization, code splitting (501KB → 303KB main)
- **11B:** CSS theme refactor (eliminated 33 `!important`), touch targets 44px+, swipe gestures, chart snapshot
- **11C:** PWA manifest + service worker + icons, onboarding tour (4-step tooltip)
- Per-panel icon colors (3 themes), nav hover micro-animations (CSS keyframes)

### Phase 10 — Single-Page Panels + Synthesis Layer (2026-03-15)
- **10A:** Killed react-router-dom, unified `activePanel` state, RightPanel shell, 4 slide-out panels
- **10B:** Confluence score (weighted 6-signal synthesis), MTF strip (5-timeframe EMA alignment), backtester upgrade (3 strategies + equity curve)
- **10C:** Watchlist live prices (Alpaca snapshots), journal analytics (win rate, streaks, rating correlation), sound alerts, session stats

### Phase 9 — Multi-View + Stretch Goals (2026-03-15)
- Command palette (Cmd+K), alerts panel, Bollinger Bands, backtester engine
- Journal store, URL state sync, keyboard shortcuts ([/] presets, panel toggles)

### Phase 8 — Saved Chart Presets (2026-03-15)
- 4 default presets (Clean/Full/Scalp/Swing), custom CRUD, localStorage persistence (21 tests)

### Phases 5–7 — Live Data + Deploy + Multi-Symbol (2026-03-14)
- Live WebSocket feed (market-hours gating, bar aggregation, auto-reconnect)
- Vercel deployment (serverless proxy, cheechart.space, SSL)
- Multi-symbol support (autocomplete ~80 tickers, Alpaca validation)

### Phases 1–4 — Core Chart + Indicators + Levels (2026-03-13)
- Candlestick chart, EMA 9/48/200, VWAP + σ bands, ORB zone, prev H/L, ODC
- RSI, MACD, ATR gauge, day type banner, S/R detection + swing markers
- Volume bars (direction-colored), RVOL math for backtester

### Audit Milestones
- **Comprehensive audit (2026-03-15):** Rate limiting, SSRF guard, input validation, ESLint, 17 timezone tests, backtest determinism, dead code cleanup (274 → 298 tests)
- **System coherence audit (2026-03-16):** Multi-pane sync (RSI/MACD ↔ main chart), URL state race fix, layout resize events, mobile sub-header overflow
- **Code quality audit (2026-03-16):** Overlay reactivity fixes, CrosshairLegend O(1) lookup, semantic data color system (30+ migrations), RightPanel layout fix
