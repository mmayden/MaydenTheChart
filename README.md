# Cheechart

Day trading chart terminal with built-in signal synthesis, backtesting, and trade journaling. Real-time US equity data via Alpaca Markets.

**Live:** [cheechart.space](https://cheechart.space)

---

## Features

- **Confluence score** — weighted synthesis of 6 indicators into a single setup quality readout
- **Multi-timeframe strip** — EMA alignment across 5m / 15m / 1h / 4h / 1D
- **Day type classification** — Trend / Range / Chop detection from previous day H/L
- **ATR range meter** — daily range budget remaining
- **ORB zone** — 15-min opening range breakout levels
- **VWAP + sigma bands** — intraday institutional levels
- **EMA 9 / 48 / 200** — trend direction stack
- **Bollinger Bands** — volatility overlay
- **S/R levels** — auto-detected support and resistance via pivot clustering
- **Backtester** — ORB breakout, EMA cross, VWAP bounce strategies (same math as live chart)
- **Trade journal** — log entries with setup type, rating, win/loss analytics
- **Saved presets** — Clean, Full, Scalp, Swing + custom presets
- **Command palette** — `Cmd+K` for symbols, timeframes, indicators, presets
- **Infinite scroll** — scroll left to load historical data on demand
- **Live WebSocket feed** — real-time bars during market hours
- **3 themes** — Default, Lumpia, Terminal (6 accent colors each)
- **PWA** — installable, works offline for cached data

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + Vite 8 |
| Charting | lightweight-charts v5 |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Styling | Tailwind CSS 4 |
| Animations | Motion v12 |
| Data | Alpaca Markets (provider-abstracted) |
| Testing | Vitest (298 tests) |
| Linting | ESLint 9 + Husky pre-commit |
| CI | GitHub Actions |
| Deployment | Vercel |

---

## Getting Started

**Prerequisites:** Node 18+, [Alpaca](https://alpaca.markets) paper trading account (free)

```bash
git clone <repo-url>
cd MaydenTheChart
npm install
cp .env.example .env
# Add your Alpaca keys to .env
```

Local dev (two terminals):
```bash
npx vercel dev      # Serverless API on :3000
npm run dev         # Vite dev server on :5173
```

### Environment Variables

Server-only (`.env` + Vercel dashboard):
```
ALPACA_API_KEY=your_paper_key
ALPACA_SECRET_KEY=your_paper_secret
ALPACA_DATA_URL=https://data.alpaca.markets
WS_AUTH_TOKEN=your_ws_auth_token
```

Client (`.env`):
```
VITE_WS_AUTH_TOKEN=your_ws_auth_token
VITE_SENTRY_DSN=                        # Optional
```

API keys use no `VITE_` prefix — they never reach the browser bundle.

---

## Scripts

```bash
npm run dev        # Dev server
npm test           # Run tests (watch mode)
npx vitest run     # Single test run
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix
npm run build      # Production build
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Cmd+K` | Command palette |
| `1`–`6` | Timeframe (1m / 5m / 15m / 1h / 4h / 1D) |
| `[` / `]` | Cycle presets |
| `A` `B` `J` `W` | Alerts / Backtest / Journal / Watchlist panel |
| `Cmd+Shift+S` | Chart snapshot |
| `Esc` | Close panel or modal |

---

## Project Structure

```
api/                  Vercel serverless functions
src/
  components/
    chart/            CandlestickChart, SymbolInput, PriceDisplay
    indicators/       EMA, VWAP, S/R, Bollinger, Level overlays
    layout/           TopNav, Sidebar, RightPanel
    panels/           Alerts, Backtest, Journal, Watchlist
    ui/               CommandPalette, SettingsModal, ConfluenceBar, MTFStrip, ...
  constants/          Chart config, presets, accent colors, patterns
  hooks/              useBars, useLiveFeed, useInfiniteHistory, ...
  services/           Data provider interface, Alpaca adapter, WebSocket
  store/              Zustand stores (chart, presets, alerts, journal, toasts)
  utils/              Indicator math, levels, confluence, backtest, S/R
```

---

## Deployment

Auto-deploys on push via Vercel. Set env vars in Vercel dashboard → Project Settings → Environment Variables.

Custom domain: `cheechart.space`

```bash
npm run build && npm run preview   # Local production test
vercel --prod                      # Manual deploy
```
