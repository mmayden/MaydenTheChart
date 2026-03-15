# Loompia — Claude Session Instructions

## Start of every session
Read these files in order before doing anything else:
1. `project.md` — full project spec, stack decisions, trading system
2. `tasks.md` — living task board, current sprint status
3. `indicators.md` — indicator math reference and code contracts

Then tell me where we left off based on what you read.

## Non-negotiable contract
Every indicator function in `src/utils/indicators.js` must return BOTH:
```js
{
  series: [{ time, value }],   // ready for lightweight-charts series.setData()
  signal: {                    // ready for backtester / confluenceScore()
    value:    number,
    bias:     'bull' | 'bear' | 'neutral',
    strength: 'strong' | 'moderate' | 'weak'
  }
}
```
The live chart and the backtester share identical math. Never duplicate indicator logic.

## Stack (locked)
- Vite 7 + React 18 + lightweight-charts **v5** (NOT v4)
- TanStack Query v5, Zustand v4, Axios, Tailwind CSS 3, Vitest v3
- JavaScript (not TypeScript)
- `feed: 'iex'` required on all Alpaca data fetches (free tier)

## Key file locations
- Indicator math: `src/utils/indicators.js`
- Level math: `src/utils/levels.js`
- S/R detection: `src/utils/supportResistance.js`
- Zustand store: `src/store/useChartStore.js`
- Constants (Nick's EMA colors etc): `src/constants/chart.js`
- Main chart: `src/components/chart/CandlestickChart.jsx`
- Symbol input + autocomplete: `src/components/chart/SymbolInput.jsx`
- Crosshair OHLCV legend: `src/components/ui/CrosshairLegend.jsx`
- Toast notifications: `src/hooks/useToast.js` + `src/components/ui/ToastContainer.jsx`
- Viewport persistence: `src/hooks/useViewportPersistence.js`
- WebSocket live feed: `src/hooks/useAlpacaSocket.js` + `src/services/websocket.js`
- RSI/MACD toggle + mini charts: `src/components/ui/IndicatorTabView.jsx`
- Keyboard shortcuts (1-6 timeframes): `src/hooks/useKeyboardShortcuts.js`
- Sidebar indicator toggles (overlays only): `src/components/ui/IndicatorToggle.jsx`
- Alert system: `src/store/useAlertsStore.js` + `src/components/ui/NotificationBell.jsx`
- App layout: `src/App.jsx`
- Feature ideas (not committed tasks): `feature-ideas.md`
