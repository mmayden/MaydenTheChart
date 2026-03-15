# Project Spec — Lumpia

> Claude reads this file at the start of every session to restore full context.
> Update this file whenever a major decision is made.

---

## What We're Building

A professional day trading chart terminal for QQQ (Nasdaq 100 ETF) using real Alpaca paper
trading data. The goal is a tool that encodes a rules-based trading system — validated
against academic research and professional trader consensus — into a visual interface that
makes high-probability setups obvious and low-probability conditions clearly flagged.

This is not a generic charting tool. It is purpose-built around a specific, documented,
rules-based system with a proven academic edge (ORB strategy on QQQ, 33% annualized alpha
per Concretum Group/SSRN research, 2016–2023).

---

## User Profile

- Learning day trading / technical analysis from scratch
- Studying QQQ specifically — familiar with the rules-based trading system
- Comfortable in VS Code
- Has Alpaca paper trading account with API keys ready
- Node.js + npm installed
- Wants local dev first, then Vercel deployment

---

## Core Decisions (locked)

| Decision | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast dev, industry standard, dominant in 2026 |
| Charting lib | lightweight-charts **v5** | v5 has native multi-pane (RSI/MACD subcharts built-in), 16% smaller bundle, enhanced plugin system. Use v5, not v4. |
| Styling | Tailwind CSS | Dominates 2026 frontend ecosystem |
| Server state | **TanStack Query v5** | 2026 consensus for API data: caching, loading states, background refetch, deduplication |
| Client/UI state | **Zustand** | 2026 consensus for UI state: timeframe, symbol, indicator toggles. ~1KB, no boilerplate. |
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
│        │  RSI / MACD tabs                         │              │
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

### Tier 4 — Synthesis Layer (Phase 10) 🔄 CURRENT
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

### Tier 5 — Polish + Mobile (Phase 11)
Make it sticky and portable.

| Feature | Why it's here |
|---|---|
| **First-visit onboarding** | 4-step tooltip tour highlighting Day Type, ATR gauge, presets, Cmd+K. No platform explains itself well. |
| **Mobile polish pass** | Touch targets 44px+, swipe gestures (right=sidebar, left=panel), chart fills viewport |
| **PWA manifest** | Installable to home screen, feels like a native app |
| **CSS theme refactor** | Replace Tailwind !important overrides with CSS variable-first approach |
| **Chart annotations** | Click to add notes/arrows directly on chart, saved per symbol |

### Tier 6 — Future Differentiators (Phase 12+)
The nuclear options — each one could be a product on its own.

| Feature | Why it's here |
|---|---|
| **Screener** | Scan watchlist for active setups ("QQQ: ORB breakout + RVOL 2.1x"). No free tool does this. |
| **Trade replay mode** | Step through historical days bar-by-bar with indicators updating live. Webull's replay is visual-only — ours would have simulated trades + stats. |
| **Weekly gap tracking** | Panel showing unfilled QQQ weekly gaps with distance from current price |
| **Volume profile (horizontal)** | Price levels with most traded volume = strongest S/R |
| **Alert sets per preset** | Tie alert configurations to presets — huge pain point on every platform |
| **Cloud sync / preset export** | Multi-device persistence, preset sharing between traders |
| **Snapshot sharing** | One-click chart screenshot with all indicators, copyable/shareable |

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

### Core Data Layer
| File | Purpose |
|---|---|
| `src/services/alpaca.js` | Axios client, auth headers, base URLs |
| `src/services/queryClient.js` | TanStack Query client config + default options |
| `src/services/websocket.js` | Alpaca WebSocket connection manager — auth, subscribe, reconnect with exponential backoff |
| `api/bars.js` | Vercel serverless proxy — Alpaca API (keys server-only, pagination) |
| `api/ws-auth.js` | Vercel serverless function — returns Alpaca WS credentials, protected by bearer token |

### Stores (Zustand)
| File | Purpose |
|---|---|
| `src/store/useChartStore.js` | Primary UI state — timeframe, symbol, indicator toggles, active panel, theme, WS status |
| `src/store/usePresetsStore.js` | Preset CRUD — save/load/rename/delete named presets, localStorage persistence |
| `src/store/useAlertsStore.js` | Alert definitions, triggered state |
| `src/store/useJournalStore.js` | Trade journal CRUD + stats (localStorage persisted) |
| `src/store/useToastStore.js` | Toast notification queue (add/remove/auto-dismiss) |

### Hooks
| File | Purpose |
|---|---|
| `src/hooks/useAlpacaBars.js` | TanStack Query hook for historical bars |
| `src/hooks/useAlpacaSocket.js` | React hook — WS market-hours gating, 1-min bar aggregation, TanStack cache injection |
| `src/hooks/useDailyBars.js` | TanStack Query hook for daily bars (ATR gauge) |
| `src/hooks/useKeyboardShortcuts.js` | Global keyboard shortcuts (1-6 timeframes, [/] presets, Cmd+K, panel toggles) |
| `src/hooks/useViewportPersistence.js` | Preserves chart zoom/scroll across live data updates |
| `src/hooks/useAlertChecker.js` | Checks alert conditions against incoming bar data |
| `src/hooks/useURLState.js` | Bidirectional URL state sync (?s=QQQ&tf=5m&p=full) |

### Indicator Math (pure functions)
| File | Purpose |
|---|---|
| `src/utils/indicators.js` | Pure math: EMA, VWAP, ATR, Bollinger, RSI, MACD — every function returns `{ series, signal }` |
| `src/utils/levels.js` | Previous H/L detection, ORB zone, open of day, day type classification |
| `src/utils/supportResistance.js` | Pivot point S/R detection algorithm |
| `src/utils/confluence.js` | *(Phase 10)* Weighted confluence score — synthesizes all indicator signals |
| `src/utils/backtest.js` | Backtest harness — ORB, EMA-cross, VWAP Bounce strategies |
| `src/utils/timezone.js` | Shared ET timezone utilities (toETDateString, toETTime) |
| `src/utils/normalizeBar.js` | Shared Alpaca bar → lightweight-charts bar normalizer |
| `src/utils/validateEnv.js` | Validate required VITE_* env vars on startup |

### App Shell
| File | Purpose |
|---|---|
| `src/main.jsx` | App entry: QueryClientProvider, validateEnv() call |
| `src/App.jsx` | Single-page shell: TopNav + Sidebar + Chart + Right Panel + overlays |
| `src/constants/chart.js` | All colors, periods, timeframe configs, symbol suggestions |
| `src/constants/presets.js` | Default preset definitions (Clean, Full, Scalp, Swing) |

### Layout Components
| File | Purpose |
|---|---|
| `src/components/layout/TopNav.jsx` | Top navigation (Logo, panel toggles, ⌘K, bell, settings) |
| `src/components/layout/Sidebar.jsx` | Left sidebar — symbol, timeframe, presets, indicators, ATR gauge |
| `src/components/layout/RightPanel.jsx` | *(Phase 10)* Generic right panel shell — renders active panel content |

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
| `src/components/panels/BacktestPanel.jsx` | *(Phase 10)* Configurable backtester with equity curve + day type breakdown |
| `src/components/panels/JournalPanel.jsx` | *(Phase 10)* Trade journal + performance analytics |
| `src/components/panels/WatchlistPanel.jsx` | *(Phase 10)* Watchlist with live prices + daily % change |

### UI Components
| File | Purpose |
|---|---|
| `src/components/ui/ConfluenceBar.jsx` | *(Phase 10)* Weighted setup quality readout — traffic light + expandable breakdown |
| `src/components/ui/MTFStrip.jsx` | *(Phase 10)* Multi-timeframe EMA alignment strip |
| `src/components/ui/IndicatorTabView.jsx` | RSI + MACD toggle buttons and mini charts below main chart |
| `src/components/ui/ATRGauge.jsx` | Daily range used vs ATR budget gauge |
| `src/components/ui/DayTypeBanner.jsx` | Trend / Range / Chop live classification |
| `src/components/ui/IndicatorToggle.jsx` | Sidebar show/hide toggles for chart overlays |
| `src/components/ui/PresetSelector.jsx` | Sidebar preset grid — switch, save, rename, delete |
| `src/components/ui/CommandPalette.jsx` | Cmd+K search overlay (symbols, timeframes, indicators, panels) |
| `src/components/ui/SettingsModal.jsx` | Themes + keyboard shortcuts reference |
| `src/components/ui/CrosshairLegend.jsx` | OHLCV data overlay on crosshair hover (ref-based, no re-renders) |
| `src/components/ui/ToastContainer.jsx` | Fixed bottom-right toast notification renderer |
| `src/components/ui/StatusBar.jsx` | WebSocket/Polling status + last updated time |
| `src/components/ui/ErrorBoundary.jsx` | React error boundary with fallback UI |
| `src/components/ui/Logo.jsx` | Boogaloo font logo with BETA badge |

### Docs
| File | Purpose |
|---|---|
| `project.md` | Full project spec, architecture, competitive landscape |
| `tasks.md` | Living task board, current sprint status |
| `indicators.md` | Indicator math reference and code contracts |
| `brainstorming.md` | Competitive intelligence research + vision document |
| `audit.md` | Health audit reusable template |

---

## Current Status

**192/192 tests passing, build clean.**

### Completed
- [x] Phases 1–4: Core chart, indicators, levels, S/R detection, ATR gauge, day type
- [x] Phase 5: Live WebSocket feed (market-hours gating, 1-min aggregation, auto-reconnect)
- [x] Phase 6: Vercel deployment (serverless proxy, cheechart.space, SSL)
- [x] Phase 7: Multi-symbol support (autocomplete, Alpaca validation, symbol-agnostic)
- [x] Phase 8: Saved chart presets (4 defaults, custom CRUD, localStorage, 21 tests)
- [x] Phase 9: Multi-view architecture, command palette, alerts panel, Bollinger Bands, backtester engine, dashboard, mobile responsive
- [x] Alert system: price-level + candle-streak alerts with browser notifications
- [x] QOL: crosshair legend, toasts, viewport persistence, keyboard shortcuts, error boundary
- [x] Health audits: security headers, input validation, shared utilities, dead code cleanup

### In Progress
- [ ] Phase 10A: Architecture consolidation (single-page, panel system, kill router)
- [ ] Phase 10B: Synthesis layer (confluence score, MTF strip, backtester upgrade)
- [ ] Phase 10C: Right panel content (watchlist with live prices, journal analytics)

### Upcoming
- [ ] Phase 11: Polish + Mobile (onboarding, touch targets, PWA, theme refactor)
- [ ] Phase 12+: Screener, trade replay, gap tracking, cloud sync

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
