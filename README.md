# MaydenTheChart

A professional-grade day trading chart tool for QQQ, built around a specific, validated
trading system derived from 11 months of real trader analysis. Purpose-built around
Nick's Previous High/Low framework and validated by academic ORB research.

---

## What Makes This Different

This is not a generic charting tool. Every feature is intentional:

- **Previous Day High/Low lines** auto-drawn every morning — the single most important level
- **15-minute ORB zone** — shaded breakout zone with academic backing (33% annualized alpha on QQQ)
- **VWAP + 1σ/2σ bands** — institutional-grade intraday levels, not just the line
- **EMA 9/48/200** in exactly Nick's colors — the directional signal stack
- **ATR daily range meter** — prevents chasing exhausted moves
- **Day type banner** — live Trend / Range / Chop classification
- **RVOL highlights** — volume confirmation on breakout bars
- **Macro health bar** — QQQ vs. 50MA/200MA context strip

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 + Vite |
| Charting | lightweight-charts **v5** (native multi-pane) |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Styling | Tailwind CSS |
| Data | Alpaca Markets API (paper trading) |
| HTTP | Axios |
| Deployment | Vercel |

---

## Project Structure

```
mayden-the-chart/
├── .roo/
│   ├── project.md          # Master spec & all decisions
│   ├── tasks.md            # Phase-by-phase task board
│   ├── git.md              # Git conventions
│   ├── indicators.md       # Math + logic for every indicator
│   └── security.md         # API key and security rules
├── docs/
│   ├── alpaca-api.md       # All Alpaca endpoints, params, quirks
│   └── architecture.md     # Data flow, component map, color system
├── src/
│   ├── store/
│   │   └── useChartStore.js
│   ├── services/
│   │   ├── alpaca.js
│   │   ├── queryClient.js
│   │   └── websocket.js
│   ├── hooks/
│   │   ├── useAlpacaBars.js
│   │   └── useAlpacaSocket.js
│   ├── utils/
│   │   ├── indicators.js
│   │   ├── levels.js
│   │   ├── supportResistance.js
│   │   └── validateEnv.js
│   ├── components/
│   │   ├── chart/
│   │   │   ├── CandlestickChart.jsx
│   │   │   ├── ChartContainer.jsx
│   │   │   ├── TimeframeSelector.jsx
│   │   │   └── PriceDisplay.jsx
│   │   ├── indicators/
│   │   │   ├── EMAOverlay.jsx
│   │   │   ├── VWAPOverlay.jsx
│   │   │   ├── LevelOverlay.jsx
│   │   │   ├── RSIChart.jsx
│   │   │   └── MACDChart.jsx
│   │   └── ui/
│   │       ├── ATRGauge.jsx
│   │       ├── DayTypeBanner.jsx
│   │       ├── MacroStatusBar.jsx
│   │       ├── IndicatorToggle.jsx
│   │       └── StatusBar.jsx
│   ├── constants/
│   │   └── chart.js
│   ├── App.jsx
│   └── main.jsx
├── .env                    # Real keys — NEVER commit
├── .env.example            # Template — safe to commit
├── .gitignore
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Alpaca paper trading account (free at alpaca.markets)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/mayden-the-chart.git
cd mayden-the-chart

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your Alpaca paper trading keys

# 4. Verify security — .env must NOT appear in git status
git status

# 5. Run audit — zero critical/high before starting
npm audit

# 6. Start dev server
npm run dev
```

App runs at `http://localhost:5173`

---

## Environment Variables

```bash
VITE_ALPACA_API_KEY=your_paper_key_here
VITE_ALPACA_SECRET_KEY=your_paper_secret_here
VITE_ALPACA_BASE_URL=https://paper-api.alpaca.markets
VITE_ALPACA_DATA_URL=https://data.alpaca.markets
```

> Never commit `.env`. It is gitignored. Use `.env.example` as the template.
> These are paper trading keys — no real money is at risk.

---

## Git Workflow

See `.roo/git.md` for full conventions.

```
main        — production only, never commit directly
develop     — integration branch
feature/*   — all new work happens here
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

---

## Documentation

| File | What's in it |
|---|---|
| `.roo/project.md` | Full project spec, trading system, all decisions |
| `.roo/tasks.md` | Phase-by-phase task checklist |
| `.roo/indicators.md` | Math + trading logic for every indicator |
| `.roo/security.md` | API key security rules |
| `docs/alpaca-api.md` | Every endpoint, param, and quirk |
| `docs/architecture.md` | Data flow, component responsibilities, colors |

---

## Deployment

```bash
# Test production build locally
npm run build && npm run preview

# Deploy to Vercel
vercel --prod
```

Add env vars in Vercel dashboard: Project Settings → Environment Variables.
