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
| Volume bars | Confirms breakout strength |
| **Relative Volume (RVOL) highlight** | Volume 1.5x+ daily average = institutional conviction; visual highlight on bars |
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
  - indicators: { ema: true, vwap: true, bollinger: false, rsi: true, macd: true }
  - ui: { rsiVisible: true, macdVisible: true }

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
| `src/utils/backtest.js` | Backtest harness — replays historical days using the same indicator functions, outputs win rate / R:R / day type breakdown |
| `src/utils/levels.js` | Previous H/L detection, ORB zone, open of day |
| `src/utils/supportResistance.js` | Pivot point S/R detection algorithm |
| `src/utils/validateEnv.js` | Validate required VITE_* env vars on startup |
| `src/components/chart/CandlestickChart.jsx` | lightweight-charts v5 main chart + pane management |
| `src/components/chart/TimeframeSelector.jsx` | Timeframe button group |
| `src/components/chart/PriceDisplay.jsx` | Live price + % change header |
| `src/components/indicators/EMAOverlay.jsx` | EMA 9/48/200 line series |
| `src/components/indicators/VWAPOverlay.jsx` | VWAP + band series |
| `src/components/indicators/LevelOverlay.jsx` | Prev H/L lines, ORB shaded zone, open of day line |
| `src/components/indicators/RSIChart.jsx` | RSI in v5 pane |
| `src/components/indicators/MACDChart.jsx` | MACD in v5 pane |
| `src/components/ui/ATRGauge.jsx` | Daily range used vs ATR budget gauge |
| `src/components/ui/DayTypeBanner.jsx` | Trend / Range / Chop live classification |
| `src/components/ui/MacroStatusBar.jsx` | 50MA / 200MA alignment, macro bias label |
| `src/components/ui/IndicatorToggle.jsx` | Show/hide toggles for each indicator |
| `src/constants/chart.js` | All colors, periods, timeframe configs |
| `src/main.jsx` | App entry: QueryClientProvider, validateEnv() call |
| `src/App.jsx` | Root layout and routing |

---

## Current Status

- [x] Project initialized (Vite 7 + React 18, scaffolded directly in Loompia/)
- [x] Dependencies installed (lightweight-charts v5, axios, zustand, @tanstack/react-query v5, tailwind, vitest)
- [x] Git initialized, first commit on `main` — 36 files, 33/33 tests passing, clean build
- [ ] `.env` configured with Alpaca paper keys — **BLOCKED: need to find keys in Alpaca dashboard**
- [x] Phase 1 — core chart + levels + VWAP + EMAs (all code written, tested, committed)
- [ ] Phase 2 — ORB zone + RVOL + VWAP bands
- [x] Phase 3 — RSI/MACD panes, ATR gauge, day type banner — committed
- [ ] Phase 4 — S/R + macro status bar + 4hr cross annotations
- [ ] Phase 5 — live WebSocket
- [ ] Phase 6 — Vercel deployment
- [x] Alert system (Tier 3 stretch) — price-level and candle-streak alerts with browser notifications

### Alpaca API Key Location (for next session)
Keys are NOT under "API" in the sidebar (that goes to docs).
Go to: `app.alpaca.markets/account/configuration` → look for an "API Keys" tab or section on that page, OR navigate directly to `app.alpaca.markets/account/api-keys`.
Need: Key ID (starts with PK...) + Secret Key (shown only once at creation).

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
