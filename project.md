# Project Spec — Lumpia

> Claude reads this file at the start of every session to restore full context.
> Update this file whenever a major decision is made.

---

## What We're Building

A professional day trading chart terminal supporting any US equity symbol, using real Alpaca
paper trading data. The goal is a tool that encodes a rules-based trading system — validated
against academic research and professional trader consensus — into a visual interface that
makes high-probability setups obvious and low-probability conditions clearly flagged.

Originally built around QQQ (Nasdaq 100 ETF), now multi-symbol with autocomplete for ~80
popular tickers. The system is purpose-built around a specific, documented, rules-based
approach with a proven academic edge (ORB strategy on QQQ, 33% annualized alpha per
Concretum Group/SSRN research, 2016–2023), applicable to any liquid equity.

---

## User Profile

- Learning day trading / technical analysis from scratch
- Primarily studies QQQ — familiar with the rules-based trading system, now trading multiple symbols
- Comfortable in VS Code
- Has Alpaca paper trading account with API keys ready
- Node.js + npm installed
- Local dev + Vercel deployment (live at cheechart.space)

---

## Core Decisions (locked)

| Decision | Choice | Reason |
|---|---|---|
| Framework | React 19 + Vite 8 | Fast dev, industry standard, dominant in 2026 (Phase 12C complete) |
| Charting lib | lightweight-charts **v5** | v5 has native multi-pane (RSI/MACD subcharts built-in), 16% smaller bundle, enhanced plugin system. Use v5, not v4. |
| Styling | Tailwind CSS 4 | Dominates 2026 frontend ecosystem — config in CSS `@theme`, `@tailwindcss/postcss` plugin |
| Server state | **TanStack Query v5** | 2026 consensus for API data: caching, loading states, background refetch, deduplication |
| Client/UI state | **Zustand v5** | 2026 consensus for UI state: timeframe, symbol, indicator toggles. ~1KB, no boilerplate. |
| Data source | Alpaca Markets API | Paper trading, real market data, free, WebSocket support |
| HTTP client | Axios | Clean API, interceptors for auth headers |
| Deployment | Vercel | Free, instant, Git-connected |
| Testing | **Vitest** | Vite-native, zero config, runs same environment as the app. Unit tests on all indicator math. |
| Language | JavaScript (not TypeScript) | Simpler for learning phase, can migrate later |

---

## The Trading System We're Encoding

### Core Trading Rules

**Rule 1 — Previous High/Low Bias (the backbone of everything)**
- Break above previous day's high → bullish day, do NOT expect previous low to be revisited
- Break below previous day's low → bearish day, do NOT expect previous high to be hit
- Both broken same session → expect a big move; direction follows current momentum (chop signal)
- Applied fractally across all timeframes: daily, weekly, monthly, quarterly — same rule scales up

**Rule 2 — EMA Stack (direction confirmation)**
- EMA 9 (blue), EMA 48 (green), EMA 200 (white) — exact colors, do not change
- EMA 9 crossing EMA 48 = directional signal on any timeframe
- **4-hour EMA cross is the strongest swing signal** — "first time 4hr crosses is most reliable"
- Wait for the cross as entry confirmation; never anticipate it

**Rule 3 — Gap Awareness**
- Weekly gaps almost always fill (same day or within 5–10 days)
- Rare weekly gaps are structurally significant — bearish if they sit below current price
- Track unfilled gaps on QQQ weekly chart

**Rule 4 — The Ghetto Spread (risk management)**
- Buy N contracts → sell N-1 when up ~20% (recover capital + profit) → let 1 runner ride risk-free
- Runner is now playing with house money — can hold for 100%+ without stress
- This philosophy should be reflected in how the tool frames risk

**Rule 5 — Timeframe Hierarchy**
- 5min / 15min: intraday scalp entry signals (noisy, use for entry timing only)
- 4hr: swing signals (reliable, especially EMA crosses — the primary swing timeframe)
- Daily / Weekly / Monthly: macro context and major level identification

**Rule 6 — VWAP as intraday pivot**
- Above VWAP = bullish intraday bias; below VWAP = bearish intraday bias
- First test of VWAP after open = major battle zone
- Bounce off VWAP = high-probability entry point
- VWAP only meaningful on intraday timeframes (1m, 5m, 15m) — hide on 4h/1D

### Complementary Trading Philosophy
- Reactive not predictive — "let the move show you what to do"
- Play the middle, take base hits not home runs
- Never add to a losing position; cut losses without hesitation
- Never swing into the next day
- "When you stop thinking you make much better trades"

### Academic Validation of the System
- ORB (Opening Range Breakout) strategy on QQQ studied by Concretum Group (SSRN, 2023)
- 2016–2023 backtest including two bear markets: **33% annualized alpha** net of commissions
- Volume confirmation raises breakout success rate: ~45% (no volume filter) → ~65% (1.5x avg volume) = 20 percentage point edge
- The system is a rules-based ORB + EMA confirmation + multi-timeframe structure — this is a documented, backtested approach

---

## Competitive Landscape (March 2026)

Research from Trustpilot, Reddit (r/daytrading, r/TradingView, r/Webull, r/thinkorswim),
app store reviews, and trading forums. These gaps define our opportunity.

| Platform | Strengths We Respect | Gaps We Exploit |
|---|---|---|
| **TradingView** (1.9/5 Trustpilot) | Best charting UX, Pine Script ecosystem, 100+ indicators | Free tier nearly unusable (2 indicators, 1 chart, 3 alerts). Subscriptions $15-60/mo. Hidden alert throttle (15/3min all plans). Pine Script lock-in — scripts break on major versions. Chart lag during volatile markets. Settings don't persist reliably. |
| **Webull** | Outstanding mobile charting, magnifying glass for drawing, bar replay, trade-from-chart | Only 56 indicators, no real scripting. Replay is visual-only (no simulated trades/stats). Desktop is "glitchy, confusing, frustrating" on Mac. Chart lag and freezes. No real backtesting engine. |
| **thinkorswim** (1.3/5 Trustpilot) | 400+ free indicators, ThinkScript, best paper trading, Active Trader ladder | Schwab migration destroyed stability — crashes, blank screens, broken fills. "Archaic 1990s-era UI." ThinkScript functions deprecated without replacement. Friday lockouts. |
| **TrendSpider** ($33/mo) | AI auto-pattern detection, multi-timeframe overlay, "Sidekick" natural language AI | Expensive. Narrow focus — analysis only, no execution integration. |
| **NinjaTrader** | Algorithmic backtesting, no script lock-in | Desktop-only, steep learning curve, expensive for full features. |

**The tool traders describe but nobody has built:** fast web-based charts, free, scriptable,
reliable real-time data, clean modern UI, broker-agnostic, no paywall on core features.
Cheechart is 70% of the way there.

**Our structural advantages already shipped:**
- Zero indicator cap (unlimited, free)
- Standard JS indicator functions (no vendor lock-in, no breaking updates)
- lightweight-charts v5 (16% smaller bundle than TV's engine — performance by default)
- Settings persistence that actually works (Zustand + localStorage, preset system)
- Real-time data without per-exchange surcharges (Alpaca IEX feed, free)
- Keyboard-first UX (Cmd+K command palette — no retail charting platform has this)

---

## Architecture — Single-Page Panel System

**Design principle:** The chart is the gravitational center. You never leave it.

The industry has converged on single-page apps with modular, panel-based layouts
(Bloomberg, thinkorswim, VS Code, Linear). Multi-page routing creates context-switching
friction — you can't see backtest results alongside the chart that produced them.

```
┌──────────────────────────────────────────────────────────────────┐
│  TopNav: Logo | ⌘K | 🔔 | ⚙                                    │
├────────┬──────────────────────────────────────────┬──────────────┤
│        │  Confluence Bar: 🟢 4/6 Bull — Trend +   │              │
│  Side  │  EMA aligned + VWAP above  ⚠ ATR 72%     │  Right Panel │
│  bar   ├──────────────────────────────────────────┤  (one at a   │
│        │  MTF Strip: 5m Bull | 4h Bear | 1D Neut  │   time)      │
│ Symbol ├──────────────────────────────────────────┤              │
│ TF     │                                          │ [Backtest]   │
│ Preset │          CHART (always visible)           │ [Journal]    │
│ Indic. │                                          │ [Watchlist]  │
│ ATR    │                                          │ [Alerts]     │
│        ├──────────────────────────────────────────┤              │
│        │  RSI / MACD mini-charts (labeled)          │              │
│        ├──────────────────────────────────────────┤              │
│        │  Status bar                              │              │
└────────┴──────────────────────────────────────────┴──────────────┘
```

**Right panel system:** A single slot — only one panel open at a time (Alerts, Backtest,
Journal, or Watchlist), toggled via TopNav icons or Cmd+K. Same pattern as VS Code's
sidebar, Linear's detail panels, and Bloomberg's modular layout.

**Mobile:** Right panels become full-screen overlays (same pattern as the existing sidebar
drawer). The chart fills the viewport; everything else is an overlay.

**Routing:** No react-router-dom. Single-page app. URL state sync handles `?s=QQQ&tf=5m&p=full`
for shareability without page routes.

---

## Feature Design — What We Build and Why

### Tier 1 — Core Essentials (Phases 1–2) ✅ COMPLETE
These make the tool functional. Without them, nothing else matters.

| Feature | Why it's here |
|---|---|
| Candlestick chart (OHLCV) | Foundation |
| Volume bars (green up / red down) | Confirms breakout strength; colored by candle direction |
| **Relative Volume (RVOL) math** | Volume 1.5x+ daily average = institutional conviction; available for backtester and future RVOL toggle |
| Timeframe switcher (1m, 5m, 15m, 1h, 4h, 1D) | Multi-timeframe analysis is the entire system |
| **Previous day High/Low lines** | Rule 1 — drawn automatically every morning; most important level |
| **15-minute Opening Range zone** | Shaded box for first 15 min of session; ORB zone validated by SSRN research |
| **Open of day line** | ODC (open of day) is used as a directional pivot |
| VWAP line (intraday, resets 9:30 AM ET daily) | Rule 6 — the intraday pivot |
| **VWAP ± 1σ and 2σ bands** | Institutional standard: 2σ band = mean reversion zone; anchors "play the middle" philosophy |
| EMA 9 (blue), EMA 48 (green), EMA 200 (white) | The exact EMA stack with the exact colors |
| Live price display + % change | Basic UX |

### Tier 2 — Intelligence Layer (Phases 3–4) ✅ COMPLETE
These are what make this tool better than a generic charting platform.

| Feature | Why it's here |
|---|---|
| RSI (14) subchart | Momentum confirmation and divergence detection |
| MACD (12, 26, 9) subchart | Trend confirmation and crossover signals |
| **ATR daily range meter** | Shows "range used today vs. 14-day ATR budget" as a gauge — prevents chasing exhausted moves |
| **Day type banner** | Real-time classification: Trend Day / Range Day / Chop — updates as price breaks or holds prev H/L |
| Auto support & resistance levels | Pivot point method, clustered by proximity, labeled with price |
| Swing high / swing low markers | Dots at confirmed swing points |
| Bollinger Bands overlay | Mean reversion bands, complements VWAP σ bands |

### Tier 3 — Presets + Live Infrastructure (Phases 5–9) ✅ COMPLETE
Settings persistence, live data, and keyboard-first UX.

| Feature | Why it's here |
|---|---|
| **Saved chart presets** | One-click strategy switching — solves the #1 trader complaint (settings not persisting) |
| **4 default presets** | Clean, Full, Scalp, Swing — instant onboarding value |
| **Custom preset save/rename/delete** | User creates presets from current toggle state |
| **Live WebSocket feed** | Real-time price updates during market hours |
| **Command palette (Cmd+K)** | Power-user navigation — no retail charting platform has this |
| **Keyboard shortcuts** | 1-6 timeframes, [/] cycle presets, Cmd+K palette |
| **Alert system** | Price-level and candle-streak alerts with browser notifications |
| **Multi-symbol support** | Dynamic symbol input with autocomplete (~80 tickers) |

### Tier 4 — Synthesis Layer (Phase 10) ✅ COMPLETE
This is what makes friends say "damn." The chart has all the data — now make it *think*.

| Feature | Why it's here | Competitive edge |
|---|---|---|
| **Confluence Score** | Weighted synthesis of all indicator signals into a single "setup quality" readout. Traffic light on surface (🟢🟡🔴), full breakdown on expand. | No retail platform does this. TrendSpider charges $33/mo for something similar but less integrated. |
| **Multi-Timeframe Status Strip** | Thin bar showing EMA alignment across 5m/15m/4h/1D simultaneously | TrendSpider's MTF overlay costs $33/mo. We give it away. |
| **Right Panel System** | Slide-out panels for Backtest, Journal, Watchlist, Alerts — always alongside the chart | Replaces route-based dashboard. Matches Bloomberg/ToS/VS Code panel pattern. |
| **Backtester Upgrade** | Configurable params, "Run" button, equity curve, day type breakdown, VWAP Bounce strategy | Webull has no backtester. TradingView's requires Pine Script. Ours uses the same math as the live chart. |
| **Watchlist with Live Prices** | Symbol list with price + daily % change from Alpaca snapshot | Current watchlist is text-only — needs live data to compete with Webull |
| **Journal Analytics** | Performance breakdown by setup type, win/loss streaks, rating correlation, heat calendar | Transforms a notes app into a trading coach |
| **Session Stats** | "Today: 2 trades, +0.8%" in status bar from journal entries | Connects journal to live session — always visible |
| **Sound Alerts** | Optional Bloomberg-style audio ping on alert triggers | Makes the app feel alive during market hours |

### Tier 5 — Polish + Mobile + Security (Phase 11) ✅ COMPLETE
Make it sticky, portable, and hardened.

| Feature | Why it's here |
|---|---|
| **Security hardening** | localStorage schema validation at all trust boundaries, API error sanitization, Notification API guard, CSP headers |
| **Code splitting** | React.lazy() for 6 components, manualChunks for lightweight-charts + vendor-api — bundle 501KB → 226KB main + 164KB charts + 81KB vendor |
| **CSS theme refactor** | Eliminated 33 !important overrides → 20+ semantic utility classes powered by CSS variables. Nav icons, active panel highlights, alert colors, symbol color, primary buttons (`.btn-primary`), form inputs (`.bg-input`), focus rings, and spinners all use per-theme CSS custom properties. Per-panel icon colors (alerts amber, watchlist teal, backtest purple, journal coral/red, cmd-palette purple, settings cyan/mint/gold). |
| **Nav button micro-animations** | Each TopNav icon has a unique keyframe hover animation: bell rings, watchlist bounces up, backtest EKG pulses, journal tilts open, search zooms, settings gear spins with glow. All pop to 1.25-1.4x on hover via CSS-only keyframes. |
| **Mobile polish pass** | Touch targets 44px+ via `@media (pointer: coarse)`, swipe gestures (right=sidebar, left=close), chart fills viewport |
| **Chart snapshot** | Cmd+Shift+S captures chart as PNG with watermark, copies to clipboard (download fallback). Command palette + settings reference. |
| **PWA manifest** | Installable to home screen — manifest.json, network-first service worker, apple-touch-icon |
| **First-visit onboarding** | 4-step tooltip tour highlighting Day Type, ATR gauge, presets, Cmd+K. Mobile gets welcome toast. |

### Tier 6 — Future Differentiators (Phase 12+)
The nuclear options — each one could be a product on its own.

| Feature | Why it's here |
|---|---|
| **Screener** | Scan watchlist for active setups ("QQQ: ORB breakout + RVOL 2.1x"). No free tool does this. |
| **Trade replay mode** | Step through historical days bar-by-bar with indicators updating live. Webull's replay is visual-only — ours would have simulated trades + stats. |
| **Chart annotations** | Click to add notes/arrows directly on chart, saved per symbol |
| **Weekly gap tracking** | Panel showing unfilled QQQ weekly gaps with distance from current price |
| **Volume profile (horizontal)** | Price levels with most traded volume = strongest S/R |
| **Alert sets per preset** | Tie alert configurations to presets — huge pain point on every platform |
| **Cloud sync / preset export** | Multi-device persistence, preset sharing between traders |

---

## Data Provider Strategy

**Current:** Alpaca Markets free tier (IEX feed, 200 calls/min, 7yr history, WebSocket for 30 symbols).

**Architecture (Phase 12D complete):** Data layer is abstracted behind a provider interface.
The chart, indicators, backtester, and confluence engine never touch provider-specific code
— they receive normalized `Bar[]` arrays. To add a new provider: create an adapter in
`src/services/providers/`, register it in `dataProvider.js`, update serverless proxies.

| Provider | Free Tier | Best For | When to consider |
|---|---|---|---|
| **Alpaca** (current) | 200 calls/min, WS, 7yr history | Free with WebSocket | Current — works, no cost |
| **FMP** ($19/mo) | 250/day free | Best bang-for-buck paid upgrade | When IEX data quality matters |
| **Polygon/Massive** (~$29-199/mo) | 5 calls/min free | SIP data (gold standard quality) | When data must match TradingView |
| **Twelve Data** | 800/day, real-time US | Deep history (back to 1980) | Daily bars supplement |

**Provider interface (3 methods in `src/services/dataProvider.js`):**
```js
fetchBars(symbol, timeframe, start, end, limit) → Bar[]
fetchSnapshot(symbols) → { [symbol]: { price, change, changePercent } }
createSocket({ onBar, onStatus, getSymbol }) → { connect, disconnect }
```

**Provider adapter (`src/services/providers/alpaca.js`):**
- `normalizeBars(rawBars)` — Alpaca `{t,o,h,l,c,v}` → `{time,open,high,low,close,volume}`
- `getProviderTimeframe(internalTF)` — maps internal keys to Alpaca API strings
- `getWsProtocol()` — Alpaca WS auth/subscribe/unsubscribe message formats

**Coupling audit (verified 2026-03-16):**
- `src/services/dataProvider.js` — provider interface, all hooks call this
- `src/services/providers/alpaca.js` — Alpaca adapter (normalization, timeframe mapping, WS protocol)
- `src/services/websocket.js` — provider-agnostic shell, delegates protocol to adapter
- `api/bars.js`, `api/snapshot.js`, `api/ws-auth.js` — HTTP proxies (documented for `DATA_PROVIDER` env var routing)
- Indicators, backtest, confluence, levels, S/R — **zero** provider dependency

## Production Infrastructure

**Cache strategy:**
- Static assets (`/assets/*`): `immutable, max-age=31536000` — Vite content-hashes all filenames
- HTML: `s-maxage=60, stale-while-revalidate=300` — fast deploy propagation
- API: per-endpoint (bars 30s, snapshot 15s, ws-auth no-store)
- Service worker: network-first for all, API bypassed, versioned via build hash

**Security headers (vercel.json):**
- HSTS (2yr, includeSubDomains, preload), X-Frame-Options DENY, nosniff
- CSP: self + fonts + Alpaca WS only, frame-ancestors none
- Permissions-Policy: camera/microphone/geolocation disabled

**Performance targets:**
- Main bundle: <320KB (currently 314KB + 161KB charts + 92KB motion + 69KB vendor, 7 lazy chunks — Vite 8/Rolldown)
- LCP: <2.5s (self-hosted fonts, no external blocking requests)
- INP: <200ms (canvas-based chart interactions bypass DOM)
- CLS: <0.1 (fixed layout, no late-loading content)

---

## State Management Architecture

```
Server state (TanStack Query):
  - Historical bars from Alpaca (per symbol + timeframe)
  - Latest quote / live price
  - Watchlist snapshots (latest quote per watched symbol)
  - Caching, background refetch, loading/error states

Client state (Zustand — useChartStore):
  - selectedTimeframe: '5Min'
  - selectedSymbol: 'QQQ'
  - indicators: { ema, vwap, rvol, rsi, macd, levels, sr, bollinger }
  - theme: 'dark' | 'lumpia' | 'terminal'
  - activePanel: null | 'alerts' | 'backtest' | 'journal' | 'watchlist'
  - sidebarOpen: boolean
  - wsStatus, isMarketOpen

Client state (Zustand — usePresetsStore):
  - activePresetId, presets (persisted to localStorage)

Client state (Zustand — useJournalStore):
  - Trade journal entries + CRUD (persisted to localStorage)

Client state (Zustand — useAlertsStore):
  - Alert definitions + triggered state

Component state (useState — local only):
  - Hover states, animation, tooltip position
  - Backtest config params (local to BacktestPanel)
```

---

## File Ownership Map

### Core Data Layer (provider-abstracted)
| File | Purpose |
|---|---|
| `src/services/dataProvider.js` | Provider interface — `fetchBars()`, `fetchSnapshot()`, `getProviderName()` |
| `src/services/providers/alpaca.js` | Alpaca adapter — bar normalization, timeframe mapping, WS protocol |
| `src/services/alpaca.js` | Re-export wrapper (backward compat → `dataProvider.js`) |
| `src/services/queryClient.js` | TanStack Query client config + default options |
| `src/services/websocket.js` | Provider-agnostic WebSocket manager — connection lifecycle, reconnect with exponential backoff |
| `src/services/sentry.js` | Sentry error tracking — conditional init via `VITE_SENTRY_DSN` env var |
| `api/bars.js` | Vercel serverless proxy — provider-routed (currently Alpaca, keys server-only, pagination) |
| `api/ws-auth.js` | Vercel serverless function — returns WS credentials, protected by bearer token |
| `api/snapshot.js` | Vercel serverless proxy — provider-routed snapshots for watchlist live prices |
| `public/manifest.json` | PWA manifest (standalone display, icons, theme) |
| `src/sw.js` | Service worker source — build-time processed by Vite plugin, auto-versioned CACHE_NAME |
| `public/fonts/boogaloo-regular.woff2` | Self-hosted Boogaloo font (logo) |
| `public/fonts/inter-800.woff2` | Self-hosted Inter 800 font (symbol display) |

### Stores (Zustand)
| File | Purpose |
|---|---|
| `src/store/useChartStore.js` | Primary UI state — timeframe, symbol, indicator toggles, active panel, theme, sound alerts, WS status |
| `src/store/usePresetsStore.js` | Preset CRUD — save/load/rename/delete named presets, localStorage persistence |
| `src/store/useAlertsStore.js` | Alert definitions, triggered state |
| `src/store/useJournalStore.js` | Trade journal CRUD + stats (localStorage persisted) |
| `src/store/useToastStore.js` | Toast notification queue (add/remove/auto-dismiss) |

### Hooks
| File | Purpose |
|---|---|
| `src/hooks/useBars.js` | TanStack Query hook for historical bars (provider-agnostic) |
| `src/hooks/useInfiniteHistory.js` | Infinite scroll-back — fetches older bars on scroll, prepends to TanStack cache |
| `src/hooks/useLiveFeed.js` | React hook — WS market-hours gating, 1-min bar aggregation, TanStack cache injection |
| `src/hooks/useDailyBars.js` | TanStack Query hook for daily bars (ATR gauge) |
| `src/hooks/useKeyboardShortcuts.js` | Global keyboard shortcuts (1-6 timeframes, [/] presets, Cmd+K, panel toggles) |
| `src/hooks/useViewportPersistence.js` | Preserves chart zoom/scroll across live data updates |
| `src/hooks/useAlertChecker.js` | Checks alert conditions against incoming bar data |
| `src/hooks/useSwipeGesture.js` | Horizontal swipe detection for sidebar open/close on touch devices |
| `src/hooks/useURLState.js` | Bidirectional URL state sync (?s=QQQ&tf=5m&p=full&panel=backtest) |
| `src/hooks/useMTFSignals.js` | Multi-timeframe EMA signals — parallel TanStack Query fetches across 5m/15m/1h/4h/1D |

### Indicator Math (pure functions)
| File | Purpose |
|---|---|
| `src/utils/indicators.js` | Pure math: EMA, VWAP, ATR, Bollinger, RSI, MACD — every function returns `{ series, signal }` |
| `src/utils/levels.js` | Previous H/L detection, ORB zone, open of day, day type classification |
| `src/utils/supportResistance.js` | Pivot point S/R detection algorithm |
| `src/utils/confluence.js` | Weighted confluence score — synthesizes all indicator signals into score/bias/level |
| `src/utils/backtest.js` | Backtest harness — ORB, EMA-cross, VWAP Bounce strategies + equity curve + day type breakdown |
| `src/utils/timezone.js` | Shared ET timezone utilities (toETDateString, toETTime) |
| `src/utils/normalizeBar.js` | Shared Alpaca bar → lightweight-charts bar normalizer |
| `src/utils/validate.js` | localStorage schema validation (presets, journal, watchlist, symbol usage) |
| `src/utils/snapshot.js` | Chart screenshot capture, watermark, clipboard/download export |

### App Shell
| File | Purpose |
|---|---|
| `src/main.jsx` | App entry: ErrorBoundary, QueryClientProvider, Sentry init, SW registration |
| `src/App.jsx` | Single-page shell: TopNav + Sidebar + Chart + Right Panel + overlays |
| `src/constants/chart.js` | All colors, periods, timeframe configs, symbol suggestions |
| `src/constants/presets.js` | Default preset definitions (Clean, Full, Scalp, Swing) |

### Layout Components
| File | Purpose |
|---|---|
| `src/components/layout/TopNav.jsx` | Top navigation (Logo, panel toggles, ⌘K, bell, settings) |
| `src/components/layout/Sidebar.jsx` | Left sidebar — symbol, timeframe, presets, indicators, ATR gauge |
| `src/components/layout/RightPanel.jsx` | Generic right panel shell — renders active panel content |

### Chart Components
| File | Purpose |
|---|---|
| `src/components/chart/CandlestickChart.jsx` | lightweight-charts v5 main chart + pane management |
| `src/components/chart/TimeframeSelector.jsx` | Timeframe button group |
| `src/components/chart/PriceDisplay.jsx` | Live price + % change header |
| `src/components/chart/SymbolInput.jsx` | Symbol input + autocomplete dropdown |

### Indicator Overlays
| File | Purpose |
|---|---|
| `src/components/indicators/EMAOverlay.jsx` | EMA 9/48/200 line series |
| `src/components/indicators/VWAPOverlay.jsx` | VWAP + σ band series |
| `src/components/indicators/LevelOverlay.jsx` | Prev H/L, ORB zone, ODC as session-scoped LineSeries |
| `src/components/indicators/SROverlay.jsx` | Support/resistance lines + swing high/low markers |
| `src/components/indicators/BollingerOverlay.jsx` | Bollinger Bands (middle + upper/lower series) |

### Right Panels (slide-out, one at a time)
| File | Purpose |
|---|---|
| `src/components/panels/AlertsPanel.jsx` | Alert management (price-level + candle-streak) |
| `src/components/panels/BacktestPanel.jsx` | Backtester — ORB/EMA-cross/VWAP Bounce, equity curve, day type breakdown |
| `src/components/panels/JournalPanel.jsx` | Trade journal — log entries, analytics (streaks, setup breakdown, rating corr), filter tabs |
| `src/components/panels/WatchlistPanel.jsx` | Symbol watchlist with live prices — add/remove, click to switch chart |

### UI Components
| File | Purpose |
|---|---|
| `src/components/ui/ConfluenceBar.jsx` | Weighted setup quality readout — traffic light pill + expandable breakdown |
| `src/components/ui/MTFStrip.jsx` | Multi-timeframe EMA alignment strip (5m/15m/1h/4h/1D) |
| `src/components/ui/IndicatorTabView.jsx` | RSI/MACD mini chart containers — crosshair + time range synced to main chart |
| `src/components/ui/ATRGauge.jsx` | Daily range used vs ATR budget gauge |
| `src/components/ui/DayTypeBanner.jsx` | Trend / Range / Chop live classification |
| `src/components/ui/IndicatorToggle.jsx` | Sidebar show/hide toggles for all indicators (EMA, VWAP, Bollinger, RVOL, Levels, S/R, RSI, MACD) |
| `src/components/ui/PresetSelector.jsx` | Sidebar preset grid — switch, save, rename, delete |
| `src/components/ui/CommandPalette.jsx` | Cmd+K search overlay (symbols, timeframes, indicators, panels) |
| `src/components/ui/SettingsModal.jsx` | Themes + keyboard shortcuts + sound alerts toggle |
| `src/components/ui/CrosshairLegend.jsx` | OHLCV data overlay on crosshair hover (ref-based, no re-renders) |
| `src/components/ui/ToastContainer.jsx` | Fixed bottom-right toast notification renderer |
| `src/components/ui/StatusBar.jsx` | WebSocket/Polling status + last updated time + session stats |
| `src/components/ui/ErrorBoundary.jsx` | React error boundary with fallback UI |
| `src/components/ui/Logo.jsx` | Boogaloo font logo with BETA badge |
| `src/components/ui/OnboardingTour.jsx` | 4-step tooltip tour (Day Type → ATR → Presets → Cmd+K), auto on first visit + manual restart via Help menu |

### Docs
| File | Purpose |
|---|---|
| `project.md` | Full project spec, architecture, competitive landscape |
| `tasks.md` | Living task board, current sprint status |
| `indicators.md` | Indicator math reference and code contracts |
| `brainstorming.md` | Competitive intelligence research + vision document |
| `security.md` | Security standards, threat model, API endpoint protections |
| `audit.md` | Health audit reusable template |

---

## Current Status

**298/298 tests passing, build clean, ESLint 0 errors, 0 vulnerabilities. Main bundle 314KB + 161KB lightweight-charts + 92KB motion + 69KB vendor-api (7 lazy chunks). Stack: React 19 + Vite 8 + Zustand 5 + Tailwind 4.**

### Completed
- [x] Phases 1–4: Core chart, indicators, levels, S/R detection, ATR gauge, day type
- [x] Phase 5: Live WebSocket feed (market-hours gating, 1-min aggregation, auto-reconnect)
- [x] Phase 6: Vercel deployment (serverless proxy, cheechart.space, SSL)
- [x] Phase 7: Multi-symbol support (autocomplete, Alpaca validation, symbol-agnostic)
- [x] Phase 8: Saved chart presets (4 defaults, custom CRUD, localStorage, 21 tests)
- [x] Phase 9: Command palette, alerts panel, Bollinger Bands, backtester engine, journal, mobile responsive
- [x] Phase 10A: Architecture consolidation — single-page panel system, killed react-router-dom
- [x] Phase 10B: Synthesis layer — confluence score, MTF strip, backtester upgrade
- [x] Phase 10C: Panel content — watchlist live prices, journal analytics, sound alerts, session stats
- [x] Phase 11A: Security hardening — localStorage schema validation, API error sanitization, Notification guard, code splitting (501KB → 303KB main)
- [x] Phase 11B: CSS theme refactor (eliminated 33 !important overrides), touch targets (44px+), swipe gestures, chart snapshot (Cmd+Shift+S)
- [x] Phase 11C: PWA (manifest, service worker, icons), onboarding tour (4-step tooltip)
- [x] Alert system: price-level + candle-streak alerts with browser notifications
- [x] QOL: crosshair legend, toasts, viewport persistence, keyboard shortcuts, error boundary
- [x] Health audits: security headers, input validation, shared utilities, dead code cleanup
- [x] Comprehensive audit (2026-03-15): security hardening (rate limiting, SSRF guard, input validation), ESLint, timezone tests, backtest test determinism, contract fixes, dead code cleanup

### Upcoming (Phase 12 — detailed plan finalized 2026-03-15)
- [x] Phase 12A: Production hardening — cache headers, self-host fonts, SW auto-versioning, OG meta, Sentry, reduced-motion
- [x] Phase 12B: UX sharpening — Motion library (content transitions), skeleton loading states, accent color customization, layout transition fix
- [x] Phase 12C: Dependency upgrades — React 19, Zustand 5, Vite 8, Tailwind 4
- [x] Phase 12D: Data provider abstraction — provider interface, Alpaca adapter, hooks renamed (useBars, useLiveFeed), TIMEFRAME_CONFIG decoupled
- [x] Phase 12E: Infinite scroll — useInfiniteHistory hook, scroll-back fetch with viewport save/restore, per-timeframe pageSize/maxBars caps, loading indicator
- [ ] Phase 12F: Future differentiators — screener, trade replay, annotations, gap tracking, cloud sync

---

## Session Log

| Date | What was done |
|---|---|
| 2026-03-13 | Project scoped, initial structure and all docs written |
| 2026-03-13 | Deep research: compared the trading system vs. ORB research, Minervini, ATR methodology, 2026 React stack. Stack upgraded to v5 + Zustand + TanStack Query. All docs finalized. |
| 2026-03-13 | Phase 1 fully built: all indicator math, data layer, chart components, overlays, 33 unit tests, first git commit. Blocked on .env setup — Alpaca key UI unclear. |
| 2026-03-13 | Phase 3 built: RSI/MACD panes, ATR gauge, day type banner, sidebar layout, indicator tabs, visibility toggles, DST fixes. Committed. |
| 2026-03-13 | Alert system (Tier 3): NotificationBell in header, price-level alerts, candle-streak alerts (N consecutive same-color candles), browser notifications, Zustand store. |
| 2026-03-13 | Bug fixes: chart ET timezone (tickMarkFormatter + localization), VOL label, data refetch interval (60s intraday), queryKey date-based cache invalidation, chart polling fix for stale refs after HMR. |
| 2026-03-13 | Phase 4 built: S/R detection algorithm (pivot + clustering), SROverlay with swing markers, 12 new tests (45 total). UI: indicator labels warm cream color, QQQ golden Inter font. Fixed SROverlay crash (marker time validation + try/catch). |
| 2026-03-13 | Vercel deployment: serverless proxy (api/bars.js) for API key security, removed VITE_ prefix from env vars, verified zero keys in browser bundle. Custom domain cheechart.space via CNAME. SSL cert propagating. |
| 2026-03-14 | Phase 5: Live WebSocket feed. `api/ws-auth.js` credential proxy, `src/services/websocket.js` connection manager (auth + exponential backoff reconnect), `src/hooks/useAlpacaSocket.js` (market-hours gating, 1-min bar aggregation into any timeframe, TanStack cache injection). StatusBar shows Live/Connecting/Reconnecting/Market Closed. REST polling auto-disabled when WS active. 45/45 tests, build clean. |
| 2026-03-14 | Multi-symbol base: stripped all QQQ hardcoding (MacroStatusBar removed, params saved to qqq-specific-features.txt). SymbolInput component (click-to-edit ticker). WebSocket uses dynamic getSymbol callback. NotificationBell, SettingsModal, loading message all symbol-agnostic. 45/45 tests, build clean. |
| 2026-03-14 | Symbol autocomplete: SYMBOL_SUGGESTIONS (~80 tickers) in chart.js for dropdown suggestions. SymbolInput rewritten with autocomplete dropdown (prefix filter, usage-frequency sorting via localStorage, arrow key nav, bold prefix highlight). Alpaca validation remains final gate. 45/45 tests, build clean. |
| 2026-03-14 | Volume bars: switched from RVOL-based color coding (gray/amber/red) to candle-direction coloring (green up / red down, semi-transparent). RVOL math retained in `relativeVolume()` for backtester and future settings toggle. 45/45 tests, build clean. |
| 2026-03-14 | ODC line fix: was rendering as full-width price line bleeding across all days. Changed `getOpenOfDay()` to return `{ price, startTime, endTime }`. LevelOverlay now renders ODC as a `LineSeries` scoped to today's session. Build clean. |
| 2026-03-14 | Indicator deep assessment: 6 fixes — VWAP ET timezone for day reset, ATR %-based strength thresholds, RVOL candle-direction bias, MACD return shape contract, byDay dedup optimization, 32 new levels tests. ODC color amber dashed. 77/77 tests. |
| 2026-03-14 | QOL phase: CrosshairLegend (OHLCV on hover, ref-based zero-rerender), useToast + ToastContainer (slide-in notifications), useViewportPersistence (preserves zoom during live updates), smooth loading overlay, symbol change toasts. feature-ideas.md for keyboard shortcuts. 77/77 tests, build clean. |
| 2026-03-15 | UX cleanup: RSI/MACD removed from sidebar IndicatorToggle, now toggled via tab buttons in IndicatorTabView. Removed dead `ui.rsiPaneVisible`/`macdPaneVisible` state from Zustand store. Fixed stale doc references (RSIChart.jsx, MACDChart.jsx, rsi signature). Beta branding: browser tab → "Beta Cheechart", logo shows BETA superscript badge. 77/77 tests, build clean. |
| 2026-03-15 | QOL polish: unified sidebar button hover states (bg-gray-800/50), bumped RSI/MACD tab + VOL label contrast, crosshair legend fade transition, error retry button, status bar shows data source (WebSocket/Polling), color variable cleanup (CROSSHAIR_COLOR constant, CSS theme vars), symbol input hover via CSS class, keyboard shortcuts (1-6 for timeframes via useKeyboardShortcuts hook). 77/77 tests, build clean. |
| 2026-03-15 | Keyboard shortcut stability: debounced rapid keypresses (150ms) in useKeyboardShortcuts to prevent chart blackout from rapid timeframe spam. Added cancelQueries() before invalidation to abort stale in-flight fetches. Added keepPreviousData to useAlpacaBars so chart shows stale data during transitions instead of flashing black. Build clean. |
| 2026-03-15 | Code health audit: 3 bug fixes (ResizeObserver null guards in CandlestickChart + IndicatorTabView, toast ID collision → crypto.randomUUID()), 3 smell fixes (shared normalizeBar utility deduplicating 3 files, LevelOverlay accepts pre-computed byDay prop, SettingsModal Escape key close). 77/77 tests, build clean. |
| 2026-03-15 | Full project health audit: created reusable audit.md template (10 categories), ran 8 parallel agents across build/architecture/code quality/security/performance/resilience/testing/docs. P0 fixes: React ErrorBoundary, /api/bars input validation, vercel.json security headers. P1 fixes: shared timezone.js, chart.js constants wired into indicators, console gating, dead file deletion, RSI Infinity fix, doc signature sync. P2 fixes: RSIMiniChart/MACDMiniChart extracted, useToast moved to store/, useAlertChecker hook extracted from NotificationBell, App.jsx Zustand subscriptions narrowed. P3: WS auto-recovery after max retries. P4: normalizeBar tests added. 82/82 tests, build clean. |
| 2026-03-15 | Phase 8 design: researched TradingView/thinkorswim/NinjaTrader/Webull/Sierra Chart layout systems. Consensus: layout = indicator config + style + timeframe, symbol floats freely. #1 trader complaint = settings not persisting. Designed lightweight preset system (Zustand + localStorage, sidebar dropdown, 4 default presets). Updated project.md, tasks.md, CLAUDE.md with Phase 8 plan. |
| 2026-03-15 | Chart QA + fixes: evaluated all 6 timeframes via screenshots. Fixed: RVOL toggle wired to highlight volume bars (amber ≥1.5x, red ≥2x). RSI/MACD/timeframe toggles now call markModified() for correct preset sync. VWAP toggle disabled on non-intraday TFs. API proxy follows Alpaca next_page_token pagination (fixes 4h data truncation). Symbol regex accepts dotted tickers (BRK.B). 169/169 tests, build clean. |
| 2026-03-15 | UX improvements: saved preset delete confirmation (two-click safety, red-tinted pill capsule), rename/delete buttons in theme-aware pill with larger hit targets. Terminal theme added (sage green #a8d8a8 on deep black #060806, vivid green accent #50d050) — CSS vars, Tailwind overrides, SettingsModal 3-column grid. Hover feedback (brightness-125) on all preset buttons. Build clean. |
| 2026-03-15 | Phase 9: Multi-view architecture (react-router-dom, ChartView + DashboardView), TopNav shared navigation, Sidebar extracted, Command palette (Cmd+K), AlertsPanel slide-out (replaces dropdown), Bollinger Bands indicator + overlay, RSI divergence detection helper, backtester engine (ORB + EMA-cross), Dashboard with BacktestCard + TradeJournal + WatchlistCard, useJournalStore, URL state sync, keyboard shortcuts expanded ([/] presets, Cmd+K), Settings shortcuts tab, mobile responsive layout. Quality audit: fixed z-index collision, TradeJournal reactivity, added useJournalStore tests. 192/192 tests, build clean. |
| 2026-03-15 | Strategic assessment + competitive research: 4 parallel research agents analyzed TradingView (1.9/5 Trustpilot, paywall rage, Pine Script lock-in, chart lag), Webull (great mobile, 56 indicators only, no real backtesting, desktop glitchy), thinkorswim (1.3/5 Trustpilot, Schwab migration disaster, deprecated ThinkScript), and 2026 UX trends (single-page panel architectures, AI copilots, command palettes). Decision: collapse `/dashboard` route into right-panel system (single-page, chart-centric). New Phase 10 plan: confluence score, MTF strip, panel architecture, backtester upgrade, watchlist with live prices, journal analytics. Updated project.md, tasks.md, CLAUDE.md, brainstorming.md. |
| 2026-03-15 | Phase 10A: Architecture consolidation. Replaced `alertsPanelOpen` with unified `activePanel` state (`null\|'alerts'\|'backtest'\|'journal'\|'watchlist'`). Built `RightPanel.jsx` generic shell (desktop slide-out, mobile full-screen overlay). Created `BacktestPanel`, `JournalPanel`, `WatchlistPanel` from dashboard card content. Refactored `AlertsPanel` to render as content-only (shell handles chrome). Killed react-router-dom: inlined ChartView into App.jsx, deleted `src/views/`, `npm uninstall react-router-dom`. TopNav: panel toggle icons (backtest/journal/watchlist/alerts) replace Chart/Dashboard nav tabs. CommandPalette: "Panel" commands replace "Navigate". Keyboard shortcuts: A/B/J/W toggle panels, Esc closes. URL state: `?panel=backtest` param added. SettingsModal: Panels shortcuts section added. 5 new activePanel tests. 197/197 tests, build clean. |
| 2026-03-15 | Phase 10B: Synthesis layer. `confluence.js` — weighted synthesis of 6 indicator categories (Day Type 3x, EMA Stack 3x, VWAP 2x, ATR 2x, RSI 1x, MACD 1x) → score/bias/level/reasons/warnings. 19 unit tests. `ConfluenceBar.jsx` — traffic light pill + expandable dropdown in chart sub-header. `MTFStrip.jsx` + `useMTFSignals.js` — multi-timeframe EMA alignment (5m/15m/1h/4h/1D) via parallel TanStack Query fetches. BacktestPanel upgraded: 3 strategies (ORB/EMA Cross/VWAP Bounce), SVG equity curve, collapsible day type breakdown. `backtest.js` expanded: `backtestVWAPBounce()`, `enrichTradesWithDayType()`, `statsByDayType()`, `equityCurve()`. 9 new backtest tests. 225/225 tests, build clean. |
| 2026-03-15 | Phase 10C: Panel content upgrades. `api/snapshot.js` — Vercel serverless proxy for Alpaca snapshots (multi-symbol live prices). `useWatchlistQuotes.js` — TanStack Query with 30s auto-refresh when watchlist panel open. WatchlistPanel upgraded: live price + daily % change per symbol. JournalPanel upgraded: analytics (win rate by setup, current/longest streak, rating correlation), filter tabs (All/Win/Loss), setup type filter. Sound alerts: Web Audio API ping (880Hz, off by default), `soundAlerts` preference in store + Settings toggle. StatusBar: session stats showing today's trades/wins/losses from journal. 225/225 tests, build clean. |
| 2026-03-15 | Phase 11: Security + Polish + PWA. **11A:** localStorage schema validation (`validate.js` + 29 tests), wired into presets/journal/watchlist/symbol stores. API error sanitization (bars.js + snapshot.js never leak upstream status). Notification API guard. Code splitting — React.lazy for 6 components, manualChunks for lightweight-charts (501KB → 303KB main + 164KB charts). CSP updated for PWA. **11B:** Eliminated 33 CSS !important overrides → 16 semantic utility classes. Touch targets 44px+ via `@media (pointer: coarse)`. Swipe gestures (`useSwipeGesture.js`). Chart snapshot (`snapshot.js` + Cmd+Shift+S + command palette). **11C:** PWA manifest + network-first service worker + icons. Onboarding tour (4-step tooltip, mobile welcome toast). Updated all docs. 257/257 tests, build clean. |
| 2026-03-15 | UI cleanup: removed emoji prefixes from day type labels (⚡↑↓↔), removed unicode icons from preset definitions (◇◈⚡◆), simplified TopNav search button from wide pill+kbd to icon-only magnifying glass. Added vendor-api manualChunk (226KB main + 164KB charts + 81KB vendor). 257/257 tests, build clean. |
| 2026-03-15 | Color architecture overhaul: centralized all nav icon colors into CSS custom properties (`--nav-icon`, `--nav-icon-hover`, `--nav-active-bg`, `--alert-color`, `--alert-active-bg`) with per-theme values. Added `.nav-icon` semantic CSS utility class. TopNav buttons use themed variables instead of hardcoded Tailwind classes. Symbol label uses `--symbol-color` per theme (subtle brightness lift). Removed sidebar collapse toggle (◀/▶), hamburger always visible in TopNav. Reduced ATR gauge spacing. Onboarding tour viewport clamping fixes (3 iterations). 257/257 tests, build clean. |
| 2026-03-15 | Per-panel icon colors: unique CSS variable per panel button across all 3 themes (alerts amber, watchlist teal, backtest purple, journal coral, cmd-palette purple). Replaced all remaining hardcoded Tailwind color classes (bg-blue-600, bg-[#0a0a0a], accent-blue-500, border-gray-500) with themed CSS properties (.btn-primary, .bg-input, --focus-ring, --settings-color). Panel button order: alerts → watchlist → backtest → journal. 257/257 tests, build clean. |
| 2026-03-15 | Nav hover micro-animations: unique CSS keyframe animation per TopNav button — bell ring (24° swing), watchlist bounce (translateY oscillation), backtest EKG pulse (double-tap scale), journal tilt (rotate from spine), search zoom, settings gear spin + glow. All icons pop 1.25-1.4x on hover. Sound alerts default changed to ON for new users. Settings gear gets unique per-theme color (dark cyan, terminal mint, lumpia warm gold). 257/257 tests, build clean. |
| 2026-03-15 | Comprehensive audit: 4 parallel agents (security, testing, architecture, build health). **Security:** rate limiting on all 3 API endpoints (ws-auth 5/min, bars 60/min, snapshot 30/min), SSRF guard (ALPACA_DATA_URL allowlist), symbol regex validation on URL params + watchlist input, ISO date regex anchored, ErrorBoundary hides raw errors in prod, SW cache versioned. **Testing:** +17 timezone.js tests (DST boundaries), backtest tests deterministic (removed Math.random), removed empty assertion guards. **Code quality:** ESLint added (eslint 9 + react-hooks plugin, 0 errors), vwapWithBands now returns .series per contract, chart polling stops after found, ref-during-render fixed, missing useEffect deps fixed, dead code removed. Alpaca keys rotated. 274/274 tests, build clean. |
| 2026-03-15 | Hotfix: ISO date regex in `api/bars.js` rejected `Date.toISOString()` output (includes milliseconds `.000Z`). Added optional `(\.\d{1,3})?` group. This was the root cause of "Data Error" in production after audit push. |
| 2026-03-15 | **Phase 12 strategic planning session.** Deep research (web-verified) across 3 dimensions: (1) Market data providers — evaluated Alpaca, Polygon/Massive, Twelve Data, Finnhub, FMP, Alpha Vantage, Yahoo Finance, Databento, IEX Cloud, Tradier. Decision: stay with Alpaca, abstract data layer behind provider interface for future swaps. FMP ($19/mo) identified as best paid upgrade. (2) Infinite scroll — researched lightweight-charts v5 `subscribeVisibleLogicalRangeChange` + `barsInLogicalRange` pattern, performance limits (~50-100K bars), IndexedDB caching via Dexie.js, per-timeframe page sizes. (3) Stack assessment — confirmed lightweight-charts v5, React, Zustand, Vercel are all correct choices. Planned upgrades: React 19.2.4, Zustand 5.0.11, Vite 8, Tailwind 4.2.1. (4) Production infrastructure audit — identified missing cache headers (P0), Google Fonts dependency (P1), manual SW versioning (P1), missing OG meta tags (P2). (5) UX deep dive — Motion library for panel/modal animations, skeleton loading states, accent color customization, `prefers-reduced-motion` support, Sentry error tracking. Compiled 6-phase plan (12A–12F) into tasks.md, project.md, CLAUDE.md. |
| 2026-03-15 | **Phase 12A complete: Production hardening.** Cache headers (`/assets/*` + `/fonts/*` immutable 1yr, HTML `s-maxage=60`). Self-hosted fonts (Boogaloo 10KB + Inter 800 24KB woff2, removed Google Fonts dependency + CSP origins). SW auto-versioning (Vite plugin injects `cheechart-{hash}` at build time). OG + Twitter Card meta tags. `prefers-reduced-motion` disables all nav animations. Sentry (`@sentry/react`, conditional via `VITE_SENTRY_DSN`). 274/274 tests, build clean. |
| 2026-03-16 | **Layout transition fix.** Phase 12B's Motion `AnimatePresence` for RightPanel caused close-pause-jump: panel slid out via spring animation but still occupied 340px in flex layout until DOM removal, then chart snapped. Fix: reverted to persistent wrapper div with CSS `transition-[transform,width,min-width]` for seamless chart resize, `AnimatePresence` now only handles content fade between panels. **Design rule documented:** layout-affecting transitions must use CSS on persistent DOM elements; Motion only for content that doesn't affect flex layout. |
| 2026-03-16 | **RSI/MACD UX cleanup + sidebar revert.** Moved RSI/MACD toggles back to sidebar IndicatorToggle (they're indicators, not a separate UI category). Removed the separate tab button strip below the chart. Mini chart labels use lw-charts built-in watermark (auto-aligned inside plotting area). Mini chart price scales have `minimumWidth: 60` for right-edge alignment. All charts use `autoSize: true`. Sidebar reverted to original clean form (pre-audit `dca2cad`) after 5 failed fix attempts for BUG-001 (chart area not expanding on sidebar close). Created `bugs.md` tracker and `left-bar-problems.md` audit doc. 298/298 tests, build clean. |
| 2026-03-16 | **Phase 12C complete: Dependency upgrades.** Zustand 4.5.7 → 5.0.12 (drop-in, no middleware in use). Vite 7.3.1 → 8.0.0 + @vitejs/plugin-react 6.0.1 (`manualChunks` converted from object to function for Rolldown). React 18.3.1 → 19.2.4 + react-dom 19.2.4 (already on createRoot). Tailwind 3.4.19 → 4.2.1 via `@tailwindcss/postcss` (`@tailwindcss/vite` not yet Vite 8 compatible), config moved from `tailwind.config.js` to CSS `@theme` block, `@tailwind` directives → `@import "tailwindcss"`, removed `autoprefixer`. ESLint react-hooks v7 fix: `set-state-in-effect` in OnboardingTour (justified disable). 298/298 tests, build clean, ESLint 0 errors, 0 vulnerabilities. |
| 2026-03-16 | **Phase 12D complete: Data provider abstraction.** Created `src/services/dataProvider.js` (provider interface: `fetchBars()`, `fetchSnapshot()`, `getProviderName()`), `src/services/providers/alpaca.js` (Alpaca adapter: bar normalization, timeframe mapping, WS protocol). Refactored `websocket.js` to provider-agnostic shell — delegates protocol handling to adapter. Renamed hooks: `useAlpacaBars` → `useBars`, `useAlpacaSocket` → `useLiveFeed` (old files kept as re-export wrappers for backward compat). Removed `alpacaTimeframe` from `TIMEFRAME_CONFIG` — provider adapter handles translation. Updated all 6 consumers (App.jsx, BacktestPanel, useMTFSignals, useDailyBars, useWatchlistQuotes, SymbolInput). Serverless proxies documented for `DATA_PROVIDER` env var routing. 298/298 tests, build clean, ESLint 0 errors. |
| 2026-03-16 | **Phase 12E complete: Infinite scroll.** `src/hooks/useInfiniteHistory.js` — subscribes to `subscribeVisibleLogicalRangeChange`, triggers fetch when user scrolls within 50 bars of left edge. Debounced 200ms + 500ms cooldown. Fetches older page via `fetchBars()`, deduplicates, prepends to TanStack Query cache. `CandlestickChart.jsx` — detects prepend (bars grew at front, same tail), saves `getVisibleRange()` before `setData()`, restores after to prevent viewport jump. Skips `fitContent()` on prepend. Added `allowShiftVisibleRangeOnWhitespaceReplacement` to timeScale. `TIMEFRAME_CONFIG` — added `pageSize` (bars per scroll-back fetch) and `maxBars` (memory cap) per timeframe. Loading pill at chart left edge during fetch. IndexedDB/Dexie.js deferred. 298/298 tests, build clean, ESLint 0 errors. |
