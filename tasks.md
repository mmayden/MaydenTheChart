# Task List — Cheechart

> Living task board. Update status as work progresses.
> 🔲 not started | 🔄 in progress | ✅ done | ❌ blocked

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

## 📌 Assessment Findings — Priority Fixes (2026-03-18)

> From comprehensive deep-dive audit across mobile, architecture, security, performance, and CSS.

### High Priority
- ✅ BottomSheet missing `safe-area-inset-bottom` — fixed: added `padding-bottom: env(safe-area-inset-bottom)` to `.bottom-sheet` CSS
- ✅ `usePullToRefresh` dependency array — fixed: replaced state deps with refs (`pullProgressRef`, `isRefreshingRef`, `onRefreshRef`), effect now stable on `[threshold, handleRefresh]`

### Medium Priority
- ✅ RVOL calculation memoized in CandlestickChart — `useMemo` wraps `relativeVolume(bars)` (2026-03-24)
- ✅ Sentry dynamic-imported — `@sentry/react` only loaded when `VITE_SENTRY_DSN` is set, logger uses lazy `getSentry()` (2026-03-24)
- 🔲 No mobile component tests — BottomNav, BottomSheet, useMediaQuery, usePullToRefresh have zero test coverage
- 🔲 No localStorage schema migration system — adding new fields to journal/presets silently drops old entries' data

### Low Priority
- ✅ API request IDs use `Math.random()` — switched to `crypto.randomUUID()` (2026-03-24)
- ✅ No explicit fetch timeout on API proxy calls — added `AbortSignal.timeout(10_000)` (2026-03-24)
- ✅ RVOL_AMBER/RVOL_HOT moved to `constants/chart.js` (2026-03-24)
- 🔲 `setTheme()` mutates DOM inside store action — ideally a `useEffect` in App.jsx

---

## 📌 Deferred — Mobile Polish (follow-up QA)

> Core mobile overhaul (M1–M5) complete. These are follow-up QA items.

- 🔲 iOS Safari / Chrome Android cross-device QA pass
- 🔲 Onboarding tour mobile variant (currently welcome toast only)
- 🔲 Lighthouse PWA audit pass
- 🔲 Bottom sheet snap tuning (spring constants, velocity sensitivity)
- 🔲 Offline chart data caching (service worker strategy)

---

## ❌ Blocked / Needs Input

> Nothing blocked yet.

---

## ✅ Completed Phases — Archive

### Roadmap Header Redesign (2026-03-25)
- Cleaner chevron back button with hover animation + accent color transition
- "cheechart" branding right-aligned in header for identity
- Progress bar: taller (`h-1.5`), darker bg (`--bg-base`) for visual separation
- Active node glow style added in `roadmap.css`

### Mobile BottomNav UX Overhaul (2026-03-25)
- Replaced scrollable timeframe pills + "more" popover with compact timeframe dropdown + direct panel buttons
- Layout: `[☰] [5m ▾] —spacer— [🔔] [📋] [📊] [📓]` — all actions one tap away
- Backtest + Journal promoted from hidden "..." menu to always-visible icon buttons
- Removed `MORE_PANELS` constant and `moreOpen` state

### Roadmap — Curated Beginner Path (2026-03-25)
- **Beginner path redesigned:** Replaced naive "first 8 phases" filter with a curated selection: P1–P5 (foundations through classical TA) + P10 (Risk Management) + P11 (Trading Psychology). Inspired by roadmap.sh's curated path approach.
- **Rationale:** Old path included advanced topics (Wyckoff, Elliott Wave, Order Flow, Footprint Charts) while excluding essentials (position sizing, stop losses, emotional discipline). New path prioritizes what keeps beginners from blowing up.
- **Modular constants:** Beginner config (`BEGINNER_PHASE_IDS`, `BEGINNER_PHASES`, `BEGINNER_NODE_COUNT`) exported from `src/constants/roadmap.js` — single source of truth. RoadmapPage imports instead of hardcoding.
- **Dynamic hero:** Stats and description text adapt to beginner/full mode. No more hardcoded "8" or inline `.filter().reduce()`.

### Chart Stability — Preset Switch Smoothness (2026-03-25)
- **Batched preset application:** `applyPreset()` now uses a single `useChartStore.setState()` call instead of two separate `setIndicators()` + `setTimeframe()` calls. Eliminates multi-wave re-render cascade.
- **LevelOverlay rewrite:** ODC LineSeries now created once on mount (like EMA/VWAP/Bollinger) and updated imperatively via `setData()`. Was tearing down and rebuilding all series on every bar change.
- **Callback ref for chart detection:** Replaced `setInterval` polling (100ms) in App.jsx with a `useCallback` ref that fires immediately when CandlestickChart mounts. Deterministic, no timing bugs.
- **Transition guard (stableBars):** Overlays now receive `stableBars` (null during `isPlaceholderData`) instead of stale `keepPreviousData` bars. Prevents overlays from thrashing with mismatched timeframe data during transitions.
- **Mini charts always mounted:** `IndicatorTabView` now always mounts RSI/MACD mini charts, toggling via `height: 0` with CSS transition instead of conditional rendering. Eliminates expensive `createChart()` mount/unmount cycles on preset switches.

### Visual Polish — Webull-Level Chart Tuning (2026-03-25)
- Background: `#0a0a0a` → `#0b1018` dark navy (richer than pure black)
- EMA line width: 1px → 2px for all periods (was 2px only for EMA 200)
- Volume opacity: 33% → 60% (hex `55` → `99`), height 18% → 25% of chart
- Bar spacing: 8 → 10, min 2 → 3 (fatter candles)
- CrosshairLegend: 10px → 11px font, roomier padding
- App shell bg synced to chart bg across dark theme CSS vars

### Chart Stability — Preset Switch Crash Fix (2026-03-24)
- Fixed overlay effect bodies (EMA, VWAP, Bollinger, Level) — wrapped all `addSeries()`/`setData()` in try/catch + `disposedRef` guard
- Fixed RSI/MACD mini chart crosshair handler stale reference race — handlers now read `chartRef.current` (live ref) instead of stale closure capture
- Fixed CandlestickChart prepend null guard — added `?.` optional chaining on `chartRef.current` in scroll-back + fitContent paths
- Root cause: preset switching changes indicators + timeframe simultaneously, effects fire during chart teardown, uncaught errors crash the app

### Security Hardening (2026-03-24)
- CSP hardened: added `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`, `upgrade-insecure-requests`
- Added `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Resource-Policy: same-origin` (Spectre mitigations)
- Expanded `Permissions-Policy` to 14 disabled APIs (inc. `interest-cohort` for FLoC/Topics opt-out)
- Added `X-XSS-Protection: 0` (modern best practice — disable legacy XSS filter, rely on CSP)
- Fixed Vercel header routing: `/(.*)`  → `/:path*` (catch-all now matches root `/`)
- API endpoints: `AbortSignal.timeout(10_000)` on all upstream fetches, `crypto.randomUUID()` for request IDs
- CI pipeline: added `npm audit --audit-level=high` + `lockfile-lint` steps
- Dependabot: automated weekly PRs for npm deps + GitHub Actions versions
- Timezone fix: `toETTime()` normalizes ICU hour 24 → 0 for cross-platform midnight handling

### Trading Roadmap Page + Enhancements (2026-03-24)
- Standalone page at `/roadmap` — separate Vite entry point (`roadmap.html` + `src/roadmap-main.jsx`)
- Full-page interactive learning tracker: 16 phases, 86 topics, 500+ concepts
- Fully independent of chart app — no stores, no TanStack Query, no chart code, own CSS (`roadmap.css`)
- Own fixed dark color scheme — does NOT inherit main app's theme system (dark/terminal/lumpia)
- Progress tracking via localStorage (`cheechart-roadmap-done`) with checkboxes and progress bar
- Detail panel: desktop side panel (380px) / mobile bottom sheet overlay
- Search across topics, concepts, and resources
- Linked from TopNav "Learn" button
- Vercel rewrite: `/roadmap` → `/roadmap.html` (before SPA catch-all)
- Data extracted from standalone HTML into `src/constants/roadmap.js` ES module
- **Enhancement: Beginner Path filter** — curated selection (P1–P5 + P10 Risk Management + P11 Psychology), persisted to localStorage
- **Enhancement: Estimated time per phase** — displayed in phase headers (~2–6 weeks per phase)
- **Enhancement: "Mastered" badge** — appears on phase header when all nodes in phase are completed
- **Enhancement: Footer disclaimer** — "Not financial advice" legal disclaimer at page bottom
- **Content fix:** T+1 settlement updated (US equities since May 2024, was T+1/T+2)
- **Content fix:** 70–90% loss stat sourced with "per ESMA, FINRA, and 2025 studies"
- **Content fix:** ICT/SMC balance note added — "core ideas overlap with traditional price action, always backtest"

### Mobile-First Overhaul (M1–M5) (2026-03-18)
- **M1:** Safe areas (`env(safe-area-inset-*)`), `100dvh` with fallback, `useMediaQuery`/`useIsMobile`/`useIsLandscape` hooks, `viewport-fit=cover`
- **M2:** BottomNav (mobile-only): timeframe dropdown button + all 4 panel buttons (no "more" menu) + sidebar hamburger. TopNav slimmed to `h-9` with compact PriceDisplay. StatusBar mobile-optimized (dot+label only)
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

### Phase 14A — Chart Visual Overhaul (2026-03-17, tuned 2026-03-25)
- Webull-inspired chart refinements: bar spacing (`barSpacing: 10`, `minBarSpacing: 3`), `rightOffset: 5` breathing room
- Dark navy bg (`#0b1018`) — richer than pure black, premium feel
- EMA lines all 2px width (was 1px for 9/48)
- Dotted grid lines, dashed crosshair (Webull-style), removed axis borders for cleaner edges
- Price scale: `alignLabels`, 5% margins, subdued text color
- Volume bars 60% opacity, 25% chart height (`top: 0.75`) — visible, Webull-proportioned
- Mini chart grid: vertical lines hidden, horizontal dotted, no axis borders
- Sub-header: tighter layout, symbol-first price display with `tabular-nums`
- CrosshairLegend: 11px font, 88% opaque bg, roomier padding

### Phase 13A — Traction Readiness (2026-03-17)
- Enhanced chart snapshots: watermark includes confluence score + day type (`NVDA 5m · Confluence 85 Bull · Trend Day — Bullish · cheechart.space`)
- First-visit welcome banner: dismissible, localStorage-gated ("Free charting — unlimited indicators, no signup, no ads")
- Stripe donate link: heart icon in StatusBar with external link
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
- **11B:** CSS theme refactor (eliminated 33 `!important`), touch targets 44px+, chart snapshot
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
