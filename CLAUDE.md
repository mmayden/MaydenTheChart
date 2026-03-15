# Lumpia — Claude Session Instructions

## Start of every session
Read these files in order before doing anything else:
1. `project.md` — full project spec, architecture, competitive landscape, trading system
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
- **No react-router-dom** — single-page app, panel-based architecture

## Architecture

Single-page app. Chart is always visible. Tools live in slide-out right panels.
URL state sync via query params only (?s=QQQ&tf=5m&p=full&panel=backtest).

```
TopNav → Sidebar (left) → Chart (center) → RightPanel (right, one at a time)
```

**Right panel system:** `activePanel` in useChartStore controls which panel is shown.
Values: `null | 'alerts' | 'backtest' | 'journal' | 'watchlist'`. Same panel = close,
different panel = switch. On mobile (<768px), panels become full-screen overlays.

## Key file locations

### App Shell
- App shell (single-page): `src/App.jsx`
- Top navigation bar: `src/components/layout/TopNav.jsx`
- Left sidebar (chart controls): `src/components/layout/Sidebar.jsx`
- Right panel shell: `src/components/layout/RightPanel.jsx`
- URL state sync: `src/hooks/useURLState.js`

### Chart & Indicators
- Indicator math: `src/utils/indicators.js`
- Level math: `src/utils/levels.js`
- S/R detection: `src/utils/supportResistance.js`
- Confluence score: `src/utils/confluence.js`
- Backtester engine: `src/utils/backtest.js`
- Constants (EMA colors etc): `src/constants/chart.js`
- Main chart: `src/components/chart/CandlestickChart.jsx`
- Symbol input + autocomplete: `src/components/chart/SymbolInput.jsx`
- Crosshair OHLCV legend: `src/components/ui/CrosshairLegend.jsx`
- RSI/MACD toggle + mini charts: `src/components/ui/IndicatorTabView.jsx` + `RSIMiniChart.jsx` + `MACDMiniChart.jsx`
- Bollinger Bands overlay: `src/components/indicators/BollingerOverlay.jsx`
- Sidebar indicator toggles (overlays only): `src/components/ui/IndicatorToggle.jsx`

### Synthesis Layer
- Confluence bar: `src/components/ui/ConfluenceBar.jsx` — setup quality readout
- MTF status strip: `src/components/ui/MTFStrip.jsx` — multi-timeframe EMA alignment

### Stores
- Primary UI state: `src/store/useChartStore.js` (timeframe, symbol, indicators, activePanel, theme)
- Preset store: `src/store/usePresetsStore.js`
- Alert store: `src/store/useAlertsStore.js`
- Trade journal store: `src/store/useJournalStore.js`
- Toast store: `src/store/useToastStore.js`

### Hooks
- Keyboard shortcuts (1-6, [/], Cmd+K, panel toggles): `src/hooks/useKeyboardShortcuts.js`
- Viewport persistence: `src/hooks/useViewportPersistence.js`
- WebSocket live feed: `src/hooks/useAlpacaSocket.js` + `src/services/websocket.js`
- Alert checker: `src/hooks/useAlertChecker.js`
- Daily bars hook: `src/hooks/useDailyBars.js`
- Watchlist quotes: `src/hooks/useWatchlistQuotes.js`

### Right Panels (slide-out, one at a time)
- Alerts panel: `src/components/panels/AlertsPanel.jsx`
- Backtest panel: `src/components/panels/BacktestPanel.jsx`
- Journal panel: `src/components/panels/JournalPanel.jsx`
- Watchlist panel: `src/components/panels/WatchlistPanel.jsx`

### UI Components
- Preset selector UI: `src/components/ui/PresetSelector.jsx`
- Default preset definitions: `src/constants/presets.js`
- Command palette (Cmd+K): `src/components/ui/CommandPalette.jsx`
- Settings modal (themes + shortcuts): `src/components/ui/SettingsModal.jsx`
- Error boundary: `src/components/ui/ErrorBoundary.jsx`
- Logo: `src/components/ui/Logo.jsx`
- Toast notifications: `src/components/ui/ToastContainer.jsx`
- Status bar (WS/polling): `src/components/ui/StatusBar.jsx`
- ATR gauge: `src/components/ui/ATRGauge.jsx`
- Day type banner: `src/components/ui/DayTypeBanner.jsx`

### Utilities
- Shared timezone utils: `src/utils/timezone.js`
- Bar normalizer: `src/utils/normalizeBar.js`

### Docs
- Project spec + architecture: `project.md`
- Task board: `tasks.md`
- Indicator math reference: `indicators.md`
- Competitive research + vision: `brainstorming.md`
- Health audit template: `audit.md`
