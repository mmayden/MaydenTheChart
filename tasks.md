# Task List — Cheechart

> Living task board. Update status as work progresses.
> 🔲 not started | 🔄 in progress | ✅ done | ❌ blocked

---

## 🔲 Phase 13C — Discoverability

> After the Reddit/HN launch post — make it findable.

- 🔲 `public/robots.txt` — allow all crawlers
- 🔲 `public/sitemap.xml` — single-page sitemap
- 🔲 Canonical URL meta tag in `index.html`
- 🔲 Real PWA icons — replace placeholder 1x1 PNGs with branded 192/512 icons
- 🔲 Meta description targeting "free charting tool" / "TradingView alternative"

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

## 📌 Deferred — Mobile Polish (low priority)

> Touch targets + swipe gestures are in place. Revisit after core desktop features are complete.

- 🔲 Mobile-specific layout testing + QA pass across iOS Safari / Chrome Android
- 🔲 Panel transitions/animations for mobile overlays
- 🔲 Responsive chart sub-header (confluence bar + MTF strip overflow on narrow screens)
- 🔲 Onboarding tour mobile variant (currently welcome toast only)
- 🔲 Lighthouse PWA audit pass

---

## ❌ Blocked / Needs Input

> Nothing blocked yet.

---

## ✅ Completed Phases — Archive

> Collapsed summaries. See `project.md` session log for full details.

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
