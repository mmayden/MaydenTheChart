/**
 * All chart constants — colors, periods, timeframe configs.
 * Single source of truth. Never hardcode these in components.
 */

// ─── EMA colors — DO NOT CHANGE ──────────────────────────────────────────────
export const EMA_COLORS = {
  9:   '#3b82f6',  // blue  — short-term momentum
  48:  '#22c55e',  // green — medium-term trend
  200: '#e5e7eb',  // white — long-term bull/bear line
}

// ─── VWAP / band colors ────────────────────────────────────────────────────────
export const VWAP_COLOR       = '#06b6d4'  // cyan
export const VWAP_BAND1_COLOR = '#0891b2'  // darker cyan — 1σ bands
export const VWAP_BAND2_COLOR = '#0e7490'  // darkest cyan — 2σ bands

// ─── Level colors ─────────────────────────────────────────────────────────────
export const PREV_LEVEL_COLOR = '#eab308'  // gold — prev day H/L
export const ODC_COLOR        = '#f59e0b'  // amber — open of day candle
export const ORB_COLOR        = '#6366f1'  // indigo — ORB zone

// ─── Volume colors (candle-direction: green up / red down) ───────────────────
export const VOLUME_UP_COLOR   = '#22c55e80'   // green semi-transparent — close >= open
export const VOLUME_DOWN_COLOR = '#ef444480'   // red   semi-transparent — close < open

// ─── Chart background / grid ──────────────────────────────────────────────────
export const CHART_BG_COLOR   = '#0a0a0a'
export const GRID_COLOR       = '#1f2937'
export const CROSSHAIR_COLOR  = '#6b7280'

// ─── EMA periods ──────────────────────────────────────────────────────────────
export const EMA_PERIODS = [9, 48, 200]

// ─── RSI / MACD defaults ─────────────────────────────────────────────────────
export const RSI_PERIOD        = 14
export const MACD_FAST         = 12
export const MACD_SLOW         = 26
export const MACD_SIGNAL       = 9

// ─── ATR / RVOL defaults ─────────────────────────────────────────────────────
export const ATR_PERIOD        = 14
export const RVOL_PERIOD       = 20
export const RVOL_THRESHOLD    = 1.5

// ─── Timeframe config ─────────────────────────────────────────────────────────
// lookbackMs: how far back to fetch data for this timeframe
// alpacaTimeframe: the string Alpaca's API expects
// limit: max bars to request
// intraday: whether VWAP/ORB/levels are shown
// showVWAP: hide VWAP on higher timeframes per trading system rules

export const TIMEFRAME_CONFIG = {
  '1Min': {
    label:           '1m',
    alpacaTimeframe: '1Min',
    lookbackMs:      2 * 24 * 60 * 60 * 1000,   // 2 days
    limit:           1000,
    intraday:        true,
    showVWAP:        true,
    showORB:         true,
  },
  '5Min': {
    label:           '5m',
    alpacaTimeframe: '5Min',
    lookbackMs:      5 * 24 * 60 * 60 * 1000,   // 5 days
    limit:           1000,
    intraday:        true,
    showVWAP:        true,
    showORB:         true,
  },
  '15Min': {
    label:           '15m',
    alpacaTimeframe: '15Min',
    lookbackMs:      10 * 24 * 60 * 60 * 1000,  // 10 days
    limit:           1000,
    intraday:        true,
    showVWAP:        true,
    showORB:         true,
  },
  '1Hour': {
    label:           '1h',
    alpacaTimeframe: '1Hour',
    lookbackMs:      30 * 24 * 60 * 60 * 1000,  // 30 days
    limit:           720,
    intraday:        false,
    showVWAP:        false,
    showORB:         false,
  },
  '4Hour': {
    label:           '4h',
    alpacaTimeframe: '4Hour',
    lookbackMs:      90 * 24 * 60 * 60 * 1000,  // 90 days
    limit:           540,
    intraday:        false,
    showVWAP:        false,
    showORB:         false,
  },
  '1Day': {
    label:           '1D',
    alpacaTimeframe: '1Day',
    lookbackMs:      365 * 24 * 60 * 60 * 1000, // 1 year
    limit:           365,
    intraday:        false,
    showVWAP:        false,
    showORB:         false,
  },
}

export const TIMEFRAME_ORDER = ['1Min', '5Min', '15Min', '1Hour', '4Hour', '1Day']

// ─── Default symbol ───────────────────────────────────────────────────────────
export const DEFAULT_SYMBOL    = 'QQQ'
export const DEFAULT_TIMEFRAME = '5Min'

// ─── Symbol suggestions (autocomplete only — not a restriction) ─────────────
// Any symbol can be typed and validated via Alpaca. This list just powers
// the autocomplete dropdown for fast access to popular tickers.
export const SYMBOL_SUGGESTIONS = [
  // Major indices / ETFs
  'QQQ', 'SPY', 'IWM', 'DIA', 'VTI', 'VOO',
  // Leveraged ETFs
  'TQQQ', 'SQQQ', 'SPXL', 'SPXS', 'UPRO', 'SDOW',
  // Sector ETFs
  'XLF', 'XLE', 'XLK', 'XLV', 'XLI', 'XLP', 'XLU', 'XLRE', 'XLC', 'XLB', 'XLY',
  // Mega caps
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'NVDA', 'TSLA', 'BRK.B',
  // Semi / AI
  'AMD', 'INTC', 'AVGO', 'QCOM', 'MU', 'ARM', 'SMCI', 'MRVL',
  // Financials
  'JPM', 'GS', 'MS', 'BAC', 'WFC', 'C', 'V', 'MA',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB', 'USO',
  // Other popular
  'NFLX', 'DIS', 'PYPL', 'SQ', 'COIN', 'HOOD', 'PLTR', 'SOFI',
  'BA', 'CAT', 'UNH', 'JNJ', 'PFE', 'LLY', 'ABBV',
  'CRM', 'ORCL', 'ADBE', 'NOW', 'SNOW',
  // Volatility / bonds
  'VIX', 'TLT', 'HYG', 'GLD', 'SLV',
]
