# Cheechart (Lumpia)

A professional day trading chart terminal built around a rules-based trading system.
Multi-symbol support, real-time data via Alpaca, and signal synthesis that makes
high-probability setups obvious at a glance.

**Live:** [cheechart.space](https://cheechart.space)

---

## What Makes This Different

This is not a generic charting tool. Every feature encodes a specific trading edge:

- **Confluence score** — weighted synthesis of 6 indicator signals into a single "should I trade?" readout
- **Multi-timeframe strip** — EMA alignment across 5m/15m/1h/4h/1D at a glance
- **Day type classification** — live Trend / Range / Chop detection from prev H/L framework
- **ATR daily range meter** — prevents chasing exhausted moves
- **ORB zone** — 15-minute opening range with academic backing (33% annualized alpha, SSRN 2023)
- **VWAP + 1/2 sigma bands** — institutional-grade intraday levels
- **EMA 9/48/200 stack** — directional signal with exact colors
- **Command palette** — Cmd+K for everything (symbols, timeframes, indicators, presets)
- **Backtester** — 3 strategies using the same indicator math as the live chart
- **Trade journal** — log entries with setup type, rating, win/loss analytics
- **Saved presets** — one-click chart configurations (Clean, Full, Scalp, Swing + custom)

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 + Vite 7 |
| Charting | lightweight-charts **v5** (native multi-pane) |
| Server state | TanStack Query v5 |
| Client state | Zustand v4 |
| Animations | Motion v12 (spring physics panels, scale+fade modals) |
| Styling | Tailwind CSS 3 + CSS custom properties (3 themes) |
| Data | Alpaca Markets API (free tier, IEX feed) |
| HTTP | Axios |
| Testing | Vitest v3 (274 tests) |
| Linting | ESLint 9 (flat config) |
| Deployment | Vercel (serverless API proxies) |
| Error tracking | Sentry (optional) |
| PWA | Service worker + manifest |

---

## Project Structure

```
MaydenTheChart/
├── api/                         # Vercel serverless functions
│   ├── bars.js                  #   Alpaca bars proxy (rate-limited, validated)
│   ├── snapshot.js              #   Multi-symbol snapshot proxy
│   └── ws-auth.js               #   WebSocket credential proxy
├── public/
│   ├── fonts/                   #   Self-hosted Boogaloo + Inter woff2
│   ├── icons/                   #   PWA icons (192 + 512)
│   ├── manifest.json            #   PWA manifest
│   └── ...
├── src/
│   ├── components/
│   │   ├── chart/               #   CandlestickChart, PriceDisplay, SymbolInput, TimeframeSelector
│   │   ├── indicators/          #   EMAOverlay, VWAPOverlay, LevelOverlay, SROverlay, BollingerOverlay
│   │   ├── layout/              #   TopNav, Sidebar, RightPanel
│   │   ├── panels/              #   AlertsPanel, BacktestPanel, JournalPanel, WatchlistPanel
│   │   └── ui/                  #   CommandPalette, SettingsModal, ConfluenceBar, MTFStrip, ...
│   ├── constants/
│   │   ├── accents.js           #   Per-theme accent color presets (6 per theme)
│   │   ├── chart.js             #   Colors, timeframes, symbols, EMA periods
│   │   └── presets.js           #   Default chart presets (Clean, Full, Scalp, Swing)
│   ├── hooks/                   #   useAlpacaBars, useAlpacaSocket, useKeyboardShortcuts, ...
│   ├── services/                #   alpaca.js, websocket.js, queryClient.js, sentry.js
│   ├── store/                   #   useChartStore, usePresetsStore, useAlertsStore, useJournalStore, useToastStore
│   ├── utils/                   #   indicators.js, levels.js, confluence.js, backtest.js, ...
│   ├── App.jsx                  #   Single-page root layout
│   ├── main.jsx                 #   Entry point + SW registration
│   ├── index.css                #   Theme variables + semantic utilities
│   └── sw.js                    #   Service worker source (build-time versioned)
├── .env                         #   Real keys — NEVER commit
├── .env.example                 #   Template — safe to commit
├── eslint.config.js             #   ESLint 9 flat config
├── vite.config.js               #   Vite + SW versioning plugin
├── vercel.json                  #   Deployment config + security headers
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Alpaca paper trading account (free at [alpaca.markets](https://alpaca.markets))

### Setup

```bash
# Clone and install
git clone <repo-url>
cd MaydenTheChart
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Alpaca paper trading keys

# Run locally (needs two terminals)
npx vercel dev          # Terminal 1: serverless API functions on :3000
npm run dev             # Terminal 2: Vite dev server on :5173
```

### Environment Variables

**Server-only** (Vercel dashboard + `.env`):
```bash
ALPACA_API_KEY=your_paper_key
ALPACA_SECRET_KEY=your_paper_secret
ALPACA_DATA_URL=https://data.alpaca.markets
WS_AUTH_TOKEN=your_ws_auth_token
```

**Client** (`.env`):
```bash
VITE_WS_AUTH_TOKEN=your_ws_auth_token
VITE_SENTRY_DSN=                        # Optional — Sentry error tracking
```

> API keys are server-only (no `VITE_` prefix). They never reach the browser bundle.

---

## Testing

```bash
npm run test           # Run all 274 tests
npx vitest --watch     # Watch mode
npm run build          # Production build (zero errors/warnings)
npx eslint src/        # Lint check (0 errors)
```

---

## Themes

Three built-in color schemes, each with 6 accent color options:

- **Default** — Terminal black, blue accents
- **Lumpia** — Dark espresso, ember-orange accents
- **Terminal** — Deep black, sage green accents

Switch in Settings (gear icon) or via Command Palette (Cmd+K → "Default" / "Lumpia" / "Terminal").

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Cmd+K` | Command palette |
| `1`–`6` | Switch timeframe (1m/5m/15m/1h/4h/1D) |
| `[` / `]` | Cycle presets |
| `A` / `B` / `J` / `W` | Toggle Alerts / Backtest / Journal / Watchlist panel |
| `Cmd+Shift+S` | Chart snapshot (copy/download) |
| `Esc` | Close panel / modal |

---

## Documentation

| File | Contents |
|---|---|
| `CLAUDE.md` | AI session context — architecture, file map, contracts |
| `project.md` | Full project spec, trading system, decisions |
| `tasks.md` | Phase-by-phase task board |
| `indicators.md` | Math + trading logic for every indicator |
| `architecture.md` | Data flow, component map, patterns |
| `brainstorming.md` | Competitive research + product vision |
| `audit.md` | Health audit template + findings |
| `security.md` | Security model + threat mitigations |
| `alpaca-api.md` | Alpaca API endpoints, params, quirks |
| `git.md` | Git conventions + commit format |

---

## Deployment

Deployed on Vercel with auto-deploy from git push.

```bash
npm run build && npm run preview   # Test production build locally
vercel --prod                      # Manual deploy
```

Add env vars in Vercel dashboard: Project Settings → Environment Variables.
Custom domain: `cheechart.space` (CNAME → `cname.vercel-dns.com`).
