# Competitive Intelligence + Product Vision — Cheechart

> Research conducted 2026-03-15 across Trustpilot, Reddit (r/daytrading, r/TradingView,
> r/Webull, r/thinkorswim), app store reviews, trading forums, Product Hunt, and industry analysis.
> This document informs architecture and feature priorities.

---

## Competitive Landscape Summary

### TradingView — Market Leader (1.9/5 Trustpilot)
**What they do right:** Best charting UX in the industry. 100+ indicators, 110+ drawing
tools, Pine Script ecosystem with 100K+ community scripts. Multi-condition alerts.
Cross-device web app. Automatic pattern recognition.

**Where they're bleeding users:**
- Free tier nearly unusable: 1 chart, 2 indicators, 3 alerts, persistent ads
- Subscriptions $15-60/mo, with auto-conversion from free trials to $600+/yr
- Hidden alert throttle: 15 alerts per 3 minutes on ALL plans including Premium
- Pine Script v6 broke existing scripts without migration path
- Chart lag and 30-60 second alert delays during volatile markets
- Settings don't persist reliably
- No human customer support (bot-only, weeks-long ticket response)
- **Trustpilot: 1.9/5 (794 reviews, ~50% are 1-star)**

**Users leaving for:** GoCharting (order flow), Sierra Chart (400+ indicators),
TrendSpider (AI auto-analysis), thinkorswim (free with Schwab)

### Webull — Best Mobile Charting
**What they do right:** Outstanding mobile UX with magnifying glass for precise drawing.
Bar replay mode. Trade-from-chart execution. 56 indicators that work well on small screens.
Commission-free trading. Dark/light themes with per-element customization.

**Where they fall short:**
- Only 56 indicators, no real scripting (Script Editor is web-only, no community ecosystem)
- Bar replay is visual-only — no simulated trades, no stats, not a real backtester
- Desktop is "glitchy, confusing, frustrating" on Mac — buttons obscured, drawings hard to select
- Chart lag and freezes during volatile markets; misleading candles when system unfreezes
- Dual charts only (no multi-pane layouts)
- No live data by default — pay extra for real-time feeds
- AWS single-provider: entire platform went dark during an outage, no failover

### thinkorswim — Most Powerful Free Tool (1.3/5 Trustpilot)
**What they do right:** 400+ indicators (no paywall), ThinkScript customization,
best paper trading fidelity, Active Trader ladder (fastest free order entry),
ThinkOnDemand market replay, best options analysis tools.

**What killed them:**
- Schwab migration (May 2024) destroyed everything: fills degrade, crashes, blank screens
- "Archaic, 1990s-era UI" with steep learning curve
- ThinkScript functions deprecated without replacement
- Friday lockouts during system maintenance
- **Trustpilot: 1.3/5**
- Former TDA users: "It worked great under TDA, Schwab is killing it"

### Emerging Competitors
| Platform | Why it matters |
|---|---|
| **TrendSpider** ($33/mo) | AI auto-pattern detection, Sidekick natural language AI, multi-TF overlay |
| **TakeProfit** ($10/mo) | Python-based "Indie" scripting, backward-compatible (no breaking updates), 400 cloud alerts |
| **Bookmap** ($39-79/mo) | Order flow heatmaps, real-time liquidity visualization |
| **Koyfin** | Bloomberg-killer for retail, rated 9/10 by financial advisors |
| **Composer** | No-code visual strategy builder |
| **QuantConnect** | Cloud quant research, IDE integrations (Copilot, Cursor) |

---

## What Traders Actually Want (Community Consensus)

The ideal tool described across forums — **nobody has fully built it yet**:

1. **Fast web-based charts** — no desktop install, no Java runtime
2. **Free or cheap** — no paywall on core features, no dark-pattern billing
3. **Scriptable indicators** — but not locked to a proprietary language
4. **Reliable real-time data** — no per-exchange surcharges
5. **Clean modern UI** — not "cluttered to look professional"
6. **Broker-agnostic** — not locked to one brokerage
7. **Settings that persist** — the #1 complaint across ALL platforms
8. **Keyboard-first interaction** — command palettes, hotkeys, quick search
9. **Signal synthesis** — "tell me if there's a trade here, don't make me check 6 indicators"
10. **Multi-timeframe at a glance** — see alignment across timeframes without switching

---

## Cheechart's Structural Advantages (Already Shipped)

| Advantage | vs. TradingView | vs. Webull | vs. thinkorswim |
|---|---|---|---|
| Zero indicator cap | TV free = 2 indicators | Webull = 56 total | ToS = unlimited but UI is 1990s |
| Standard JS functions | Pine Script lock-in | No scripting | ThinkScript deprecated |
| lightweight-charts v5 | TV's engine is bloated | Webull freezes | ToS is Java/desktop |
| Settings persist (presets + localStorage) | TV settings vanish | Webull = limited | ToS = broken post-Schwab |
| Free real-time (Alpaca IEX) | TV = per-exchange fees | Webull = pay extra | ToS = free |
| Command palette (Cmd+K) | TV has none | Webull has none | ToS has none |
| Backtester uses live chart math | TV requires Pine Script | Webull has none | ToS = separate |

---

## Architecture Decision: Single-Page Panel System

**Why we're doing this:**

The industry has converged on single-page apps with modular, panel-based layouts.
The old multi-page/multi-window approach is dying. Key evidence:

- Bloomberg, thinkorswim, TradingView: chart is the center of gravity, tools are panels
- Devexperts (major trading platform vendor) explicitly called out multi-page navigation
  as a UX anti-pattern in their 2025 design guidelines
- VS Code, Linear, Notion all use slide-out panels over route changes
- Progressive disclosure: clean defaults, power on demand

**What this means for Cheechart:**
- Kill `/dashboard` route — collapse backtester, journal, watchlist into right panels
- Chart is always visible — no context switching
- Click watchlist symbol → chart updates instantly (no navigation)
- Log journal entry while looking at the chart setup
- Backtest results appear alongside the chart that produced them

---

## Confluence Score — Design Spec

**The single most differentiating feature.** No retail platform synthesizes indicator
signals into a single "should I trade right now?" readout.

### Weighted Signal System

| Signal Source | Weight | Trading System Rule |
|---|---|---|
| Day Type | **Heavy** | Rule 1 — "the backbone of everything" |
| EMA Alignment | **Heavy** | Rule 2 — stacked EMA = directional confirmation |
| VWAP Position | **Medium** | Rule 6 — intraday pivot |
| ATR Budget | **Medium** | Range exhaustion = don't chase |
| RSI Zone | **Light** | Confirmation, not a trigger |
| MACD Direction | **Light** | Confirmation, not a trigger |

### UX: Traffic Light + Expandable Breakdown

**Surface (always visible):**
```
🟢 SETUP ACTIVE — Bull bias, 4/6 aligned
```
or
```
🟡 MIXED — Range day, EMAs diverging
```
or
```
🔴 NO SETUP — Chop day, ATR exhausted
```

**Expanded (click/hover):**
```
  ✅ Day Type: Trend (Bullish)        ██████████  heavy
  ✅ EMA: 9 > 48 > 200                ██████████  heavy
  ✅ VWAP: Price above                 ███████░░░  medium
  ⚠️ ATR: 72% consumed                ███████░░░  medium
  ✅ RSI: 58 (neutral zone)            █████░░░░░  light
  ❌ MACD: Histogram shrinking         █████░░░░░  light
```

**Why this works:** It teaches the trading system while you use it. New users learn
*why* a setup is strong just by reading the breakdown. That's onboarding built into
the feature itself.

---

## Multi-Timeframe Status Strip — Design Spec

**Another feature TrendSpider charges $33/mo for.**

Thin horizontal bar below the confluence bar:
```
5m: 🟢 Bull  |  15m: 🟢 Bull  |  4h: 🔴 Bear  |  1D: ⚪ Neutral
```

Each status is based on EMA 9/48 alignment for that timeframe.
Color-coded: green (bull), red (bear), gray (neutral).

**Data strategy:** Fetch EMA data for each timeframe via TanStack Query
with separate query keys. Cache aggressively — 4h and 1D data changes slowly.

---

## Build Priority (Phases 10-12)

### Phase 10A — Architecture Consolidation
Kill router, build right panel system, migrate dashboard components to panels.

### Phase 10B — Synthesis Layer ("Damn Factor")
Confluence score, MTF strip, backtester upgrade (configurable params, equity curve,
day type breakdown, VWAP Bounce strategy).

### Phase 10C — Panel Content Upgrades
Watchlist with live prices (Alpaca snapshot), journal analytics (by setup, streaks, ratings).

### Phase 11 — Polish + Mobile
Onboarding tooltips, touch targets, swipe gestures, PWA, theme CSS refactor.

### Phase 12+ — Future Differentiators
Screener, trade replay, chart annotations, snapshot sharing, weekly gap tracking,
volume profile, alert sets per preset, cloud sync.

---

## Approved Ideas (Scoped into Build Phases)

- **Sound alerts** — optional subtle audio ping on alert triggers (Bloomberg-style). → Phase 10C
- **Session stats in status bar** — "Today: 2 trades, +0.8%" from journal entries for current day. → Phase 10C
- **Heat calendar in journal panel** — GitHub-style contribution graph of daily P&L. Green = profit, red = loss. → Phase 10C
- **Chart snapshot** — Cmd+Shift+S captures chart as PNG with all indicators, copyable. → Phase 11

## Additional Ideas (Not Yet Scoped)

- **Keyboard-everything** — every single action reachable via command palette
- **Natural language queries** — "show me when RSI crossed 70 this week" (future AI integration)

---

## Sources

### TradingView
- Trustpilot (1.9/5, 794 reviews), PissedConsumer (2.2/5, 73% unfavorable)
- StockBrokers.com 2026 review, Strike.money data-backed review
- TradingView changelog (Desktop v3.0.0, Advanced Charts v30.2.0)
- Pine Script v6 breaking changes analysis
- TradingView alternatives roundups (MEXC, TechBullion, ChartingLens, TradeBrains)

### Webull
- NerdWallet 2026 review, StockBrokers.com 2026 review, A1 Trading review
- Trustpilot, ConsumerAffairs, DayTrading.com reviews
- Elite Trader forum posts (chart loading issues, desktop glitches)
- Webull official charts & tools documentation

### thinkorswim
- Trustpilot (1.3/5), G2 reviews
- useThinkScript community (Feb 2025 upgrade issues, Schwab merger thread)
- ThinkAdvisor (Feb 2025 tech problems report)
- Bogleheads forum (Schwab forced migration thread)

### Industry Trends
- Devexperts trading platform UX design guidelines
- Lollypop AI stock trading UX revolution analysis
- TechNode Global automated trading UX report
- Koyfin, TrendSpider, Bookmap, QuantConnect product analysis
- Product Hunt stock trading category
- Trading dashboard design pattern research
