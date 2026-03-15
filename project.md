# Project Spec — Loompia

> Claude reads this file at the start of every session to restore full context.
> Update this file whenever a major decision is made.

---

## What We're Building

A professional day trading chart terminal for QQQ (Nasdaq 100 ETF) using real Alpaca paper
trading data. The goal is a tool that encodes the actual trading system used by Nick and
CheechyMonkey from the Bulls & Bears Discord — validated against academic research and
professional trader consensus — into a visual interface that makes high-probability setups
obvious and low-probability conditions clearly flagged.

This is not a generic charting tool. It is purpose-built around a specific, documented,
rules-based system with a proven academic edge (ORB strategy on QQQ, 33% annualized alpha
per Concretum Group/SSRN research, 2016–2023).

---

## User Profile

- Learning day trading / technical analysis from scratch
- Studying QQQ specifically — familiar with Nick's Discord system (Bulls & Bears)
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

### Source
11 months of Discord analysis (April 2025 – March 2026), Bulls & Bears #qqq-analysis channel.
Primary analyst: Nick (1,736 messages). Secondary: CheechyMonkey (784 messages).
Cross-validated against academic ORB research, ATR methodology, and Minervini market health
framework.

### Nick's Core Rules

**Rule 1 — Previous High/Low Bias (the backbone of everything)**
- Break above previous day's high → bullish day, do NOT expect previous low to be revisited
- Break below previous day's low → bearish day, do NOT expect previous high to be hit
- Both broken same session → expect a big move; direction follows current momentum (chop signal)
- Applied fractally across all timeframes: daily, weekly, monthly, quarterly — same rule scales up

**Rule 2 — EMA Stack (direction confirmation)**
- EMA 9 (blue), EMA 48 (green), EMA 200 (white) — Nick's exact colors, do not change
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
- 4hr: swing signals (reliable, especially EMA crosses — Nick's primary swing timeframe)
- Daily / Weekly / Monthly: macro context and major level identification

**Rule 6 — VWAP as intraday pivot**
- Above VWAP = bullish intraday bias; below VWAP = bearish intraday bias
- First test of VWAP after open = major battle zone
- Bounce off VWAP = high-probability entry point
- VWAP only meaningful on intraday timeframes (1m, 5m, 15m) — hide on 4h/1D

### CheechyMonkey's Complementary Philosophy
- Reactive not predictive — "let the move show you what to do"
- Play the middle, take base hits not home runs
- Never add to a losing position; cut losses without hesitation
- Never swing into the next day
- "When you stop thinking you make much better trades"

### Academic Validation of the System
- ORB (Opening Range Breakout) strategy on QQQ studied by Concretum Group (SSRN, 2023)
- 2016–2023 backtest including two bear markets: **33% annualized alpha** net of commissions
- Volume confirmation raises breakout success rate: ~45% (no volume filter) → ~65% (1.5x avg volume) = 20 percentage point edge
- Nick's system is a rules-based ORB + EMA confirmation + multi-timeframe structure — this is a documented, backtested approach

---

## Feature Design — What We Build and Why

### Tier 1 — Core Essentials (Phases 1–2)
These make the tool functional. Without them, nothing else matters.

| Feature | Why it's here |
|---|---|
| Candlestick chart (OHLCV) | Foundation |
| Volume bars (green up / red down) | Confirms breakout strength; colored by candle direction |
| **Relative Volume (RVOL) math** | Volume 1.5x+ daily average = institutional conviction; available for backtester and future RVOL toggle |
| Timeframe switcher (1m, 5m, 15m, 1h, 4h, 1D) | Multi-timeframe analysis is the entire system |
| **Previous day High/Low lines** | Nick's Rule 1 — drawn automatically every morning; most important level |
| **15-minute Opening Range zone** | Shaded box for first 15 min of session; ORB zone validated by SSRN research |
| **Open of day line** | Nick references ODC (open of day) constantly as directional pivot |
| VWAP line (intraday, resets 9:30 AM ET daily) | Nick's Rule 6 — the intraday pivot |
| **VWAP ± 1σ and 2σ bands** | Institutional standard: 2σ band = mean reversion zone; anchors Cheech's "play the middle" |
| EMA 9 (blue), EMA 48 (green), EMA 200 (white) | Nick's exact EMA stack with his exact colors |
| Live price display + % change | Basic UX |

### Tier 2 — Intelligence Layer (Phases 3–4)
These are what make this tool better than a generic charting platform.

| Feature | Why it's here |
|---|---|
| RSI (14) subchart | Momentum confirmation and divergence detection |
| MACD (12, 26, 9) subchart | Trend confirmation and crossover signals |
| **ATR daily range meter** | Shows "range used today vs. 14-day ATR budget" as a gauge — prevents chasing exhausted moves; research shows QQQ trades 80–95% of ATR in first few hours on most days |
| **Macro health status bar** | QQQ vs. 50MA and 200MA, both trending up/down — Minervini-style market filter; contextualizes every signal |
| **Day type banner** | Real-time classification: Trend Day / Range Day / Chop — updates as price breaks or holds prev H/L |
| **4hr EMA cross annotations** | Auto arrow marker on chart when 4hr EMA 9 crosses EMA 48 — Nick's strongest swing signal, visualized automatically |
| Auto support & resistance levels | Pivot point method, clustered by proximity, labeled with price |
| Swing high / swing low markers | Dots at confirmed swing points |

### Tier 3 — Advanced / Stretch (Phase 5+)
| Feature | Why it's here |
|---|---|
| Weekly gap tracking panel | Nick tracks these manually; a panel showing unfilled QQQ weekly gaps would be uniquely useful |
| Volume profile (horizontal) | Price levels with most traded volume = strongest S/R |
| Price alert system | Browser notification when price hits a user-defined level |
| Multi-symbol watchlist | Not just QQQ — NVDA, TSLA, SPY, etc. |

---

## State Management Architecture

```
Server state (TanStack Query):
  - Historical bars from Alpaca
  - Latest quote / live price
  - Caching, background refetch, loading/error states

Client state (Zustand store):
  - selectedTimeframe: '5Min'
  - selectedSymbol: 'QQQ'
  - indicators: { ema: true, vwap: true, rvol: true, rsi: true, macd: true, levels: true, sr: true }

Component state (useState — local only):
  - Hover states, animation, tooltip position
```

---

## File Ownership Map

| File | Purpose |
|---|---|
| `src/store/useChartStore.js` | Zustand — timeframe, symbol, indicator toggles |
| `src/services/alpaca.js` | Axios client, auth headers, base URLs |
| `src/services/queryClient.js` | TanStack Query client config + default options |
| `src/hooks/useAlpacaBars.js` | TanStack Query hook for historical bars |
| `src/hooks/useAlpacaSocket.js` | WebSocket manager for live bar updates |
| `src/utils/indicators.js` | Pure math: EMA, VWAP, ATR, Bollinger, RSI, MACD — every function returns `{ series, signal }` |
| `src/utils/backtest.js` | *(planned, not yet built)* Backtest harness — replays historical days using the same indicator functions |
| `src/utils/timezone.js` | Shared ET timezone utilities (toETDateString, toETTime) |
| `src/utils/normalizeBar.js` | Shared Alpaca bar → lightweight-charts bar normalizer (used by REST, WS, daily hooks) |
| `src/utils/levels.js` | Previous H/L detection, ORB zone, open of day |
| `src/utils/supportResistance.js` | Pivot point S/R detection algorithm |
| `src/utils/validateEnv.js` | Validate required VITE_* env vars on startup |
| `src/components/chart/CandlestickChart.jsx` | lightweight-charts v5 main chart + pane management |
| `src/components/chart/TimeframeSelector.jsx` | Timeframe button group |
| `src/components/chart/PriceDisplay.jsx` | Live price + % change header |
| `src/components/indicators/EMAOverlay.jsx` | EMA 9/48/200 line series |
| `src/components/indicators/VWAPOverlay.jsx` | VWAP + band series |
| `src/components/indicators/LevelOverlay.jsx` | Prev H/L price lines, ORB zone, ODC as session-scoped LineSeries |
| `src/components/indicators/SROverlay.jsx` | Support/resistance lines + swing high/low markers |
| `src/components/ui/IndicatorTabView.jsx` | RSI + MACD toggle buttons and mini charts below main chart |
| `src/components/ui/ATRGauge.jsx` | Daily range used vs ATR budget gauge |
| `src/components/ui/DayTypeBanner.jsx` | Trend / Range / Chop live classification |
| `src/components/ui/MacroStatusBar.jsx` | 50MA / 200MA alignment, macro bias label |
| `src/components/ui/IndicatorToggle.jsx` | Sidebar show/hide toggles for chart overlays (EMA, VWAP, Levels, S/R, RVOL) |
| `src/services/websocket.js` | Alpaca WebSocket connection manager — auth, subscribe, reconnect with exponential backoff |
| `src/hooks/useAlpacaSocket.js` | React hook — connects WS during market hours, aggregates 1-min bars into selected timeframe, injects into TanStack Query cache |
| `api/ws-auth.js` | Vercel serverless function — returns Alpaca WS credentials, protected by bearer token |
| `src/components/ui/CrosshairLegend.jsx` | OHLCV data overlay on crosshair hover (ref-based, no re-renders) |
| `src/components/ui/ToastContainer.jsx` | Fixed bottom-right toast notification renderer |
| `src/hooks/useToast.js` | Zustand toast notification store (add/remove/auto-dismiss) |
| `src/hooks/useViewportPersistence.js` | Preserves chart zoom/scroll across live data updates |
| `src/hooks/useKeyboardShortcuts.js` | Global keyboard shortcuts (1-6 for timeframes) |
| `src/constants/chart.js` | All colors, periods, timeframe configs |
| `src/main.jsx` | App entry: QueryClientProvider, validateEnv() call |
| `src/App.jsx` | Root layout and routing |

---

## Current Status

- [x] Project initialized (Vite 7 + React 18, scaffolded directly in Loompia/)
- [x] Dependencies installed (lightweight-charts v5, axios, zustand, @tanstack/react-query v5, tailwind, vitest)
- [x] Git initialized, first commit on `main` — 36 files, 33/33 tests passing, clean build
- [x] `.env` configured with Alpaca paper keys
- [x] Phase 1 — core chart + levels + VWAP + EMAs (all code written, tested, committed)
- [x] Phase 2 — ORB zone + RVOL + VWAP bands (built during Phase 1)
- [x] Phase 3 — RSI/MACD panes, ATR gauge, day type banner — committed
- [x] Phase 4 — S/R detection + macro status bar — 45/45 tests, build clean
- [x] Phase 5 — live WebSocket (ws-auth proxy, websocket.js manager, useAlpacaSocket hook, StatusBar live indicator)
- [x] Phase 6 — Vercel deployment (api/bars.js serverless proxy, cheechart.space custom domain, SSL pending)
- [x] Alert system (Tier 3 stretch) — price-level and candle-streak alerts with browser notifications
- [x] Multi-symbol support — dynamic symbol input, autocomplete, Alpaca validation, all systems symbol-agnostic
- [x] Indicator deep assessment — 6 fixes (VWAP timezone, ATR thresholds, RVOL bias, MACD naming, byDay dedup, levels tests)
- [x] QOL phase — crosshair OHLCV legend, toast notifications, viewport persistence, smooth loading transitions
- [x] Full project health audit (reusable audit.md template, 8-category assessment)
- [x] P0–P3 audit fixes: ErrorBoundary, input validation, security headers, shared timezone.js, mini chart extraction, alert hook extraction, WS auto-recovery, dead code cleanup, doc sync
- [x] 82/82 tests passing, build clean

---

## Session Log

| Date | What was done |
|---|---|
| 2026-03-13 | Project scoped, initial structure and all docs written |
| 2026-03-13 | Deep research: compared Nick's system vs. ORB research, Minervini, ATR methodology, 2026 React stack. Stack upgraded to v5 + Zustand + TanStack Query. All docs finalized. |
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
