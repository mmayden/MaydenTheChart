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
export const VOLUME_UP_COLOR   = '#22c55e55'   // green semi-transparent — close >= open
export const VOLUME_DOWN_COLOR = '#ef444455'   // red   semi-transparent — close < open

// ─── Chart background / grid ──────────────────────────────────────────────────
export const CHART_BG_COLOR   = '#0a0a0a'
export const GRID_COLOR       = '#141a23'       // subtle grid — barely visible
export const CROSSHAIR_COLOR  = '#4b5563'

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

// ─── Candle colors per theme (lightweight-charts needs hex, not CSS vars) ────
export const CANDLE_COLORS = {
  dark:     { up: '#22c55e', down: '#ef4444' },
  terminal: { up: '#22c55e', down: '#ef4444' },
  lumpia:   { up: '#48B068', down: '#D44020' },
}

// ─── RSI mini chart colors ───────────────────────────────────────────────────
export const RSI_LINE_COLOR = '#a78bfa'   // purple
export const RSI_OB_COLOR   = '#ef4444'   // overbought (70)
export const RSI_MID_COLOR  = '#374151'   // midline (50)
export const RSI_OS_COLOR   = '#22c55e'   // oversold (30)

// ─── MACD mini chart colors ──────────────────────────────────────────────────
export const MACD_LINE_COLOR   = '#3b82f6'   // blue — MACD line
export const MACD_SIGNAL_COLOR = '#f97316'   // orange — signal line
export const MACD_HIST_UP      = '#22c55e'   // histogram positive
export const MACD_HIST_DOWN    = '#ef4444'   // histogram negative

// ─── S/R overlay colors (RGB tuples for rgba() with variable opacity) ────────
export const SR_RESISTANCE_RGB = [239, 68, 68]   // red
export const SR_SUPPORT_RGB    = [34, 197, 94]    // green
export const SR_SWING_HIGH     = '#ef4444'
export const SR_SWING_LOW      = '#22c55e'

// ─── Bollinger Bands ─────────────────────────────────────────────────────────
export const BOLLINGER_PERIOD       = 20
export const BOLLINGER_MULTIPLIER   = 2
export const BOLLINGER_MIDDLE_COLOR = '#a78bfa'  // purple — SMA(20) middle band
export const BOLLINGER_BAND_COLOR   = '#7c3aed80' // purple semi-transparent — upper/lower bands

// ─── Confluence weights ─────────────────────────────────────────────────────
export const CONFLUENCE_WEIGHTS = {
  dayType:  3,
  emaStack: 3,
  vwap:     2,
  atr:      2,
  rsi:      1,
  macd:     1,
}

// ─── Confluence / MTF signal colors ─────────────────────────────────────────
export const SIGNAL_COLORS = {
  bull:     '#22c55e',
  bear:     '#ef4444',
  neutral:  '#6b7280',
  strong:   '#22c55e',
  moderate: '#eab308',
  weak:     '#ef4444',
  none:     '#6b7280',
}

// ─── Alert sound ────────────────────────────────────────────────────────────
export const ALERT_SOUND_FREQ     = 880   // A5 note
export const ALERT_SOUND_DURATION = 0.3   // seconds

// ─── Timeframe config ─────────────────────────────────────────────────────────
// lookbackMs: how far back to fetch data on initial load
// limit: max bars per initial request
// pageSize: bars to fetch per scroll-back page (infinite scroll)
// maxBars: hard cap on total bars in memory (prevents OOM)
// intraday: whether VWAP/ORB/levels are shown
// showVWAP: hide VWAP on higher timeframes per trading system rules
//
// Note: provider-specific timeframe strings (e.g. '5Min' for Alpaca) are
// handled by the provider adapter in src/services/providers/. The internal
// keys here ('5Min', '1Hour', etc.) are the canonical identifiers.

export const TIMEFRAME_CONFIG = {
  '1Min': {
    label:      '1m',
    lookbackMs: 2 * 24 * 60 * 60 * 1000,   // 2 days
    limit:      1000,
    pageSize:   390,     // ~1 trading day
    maxBars:    50000,
    intraday:   true,
    showVWAP:   true,
    showORB:    true,
  },
  '5Min': {
    label:      '5m',
    lookbackMs: 5 * 24 * 60 * 60 * 1000,   // 5 days
    pageSize:   390,     // ~2 trading days
    maxBars:    100000,
    limit:      1000,
    intraday:   true,
    showVWAP:   true,
    showORB:    true,
  },
  '15Min': {
    label:      '15m',
    lookbackMs: 10 * 24 * 60 * 60 * 1000,  // 10 days
    limit:      1000,
    pageSize:   260,     // ~5 trading days
    maxBars:    100000,
    intraday:   true,
    showVWAP:   true,
    showORB:    true,
  },
  '1Hour': {
    label:      '1h',
    lookbackMs: 30 * 24 * 60 * 60 * 1000,  // 30 days
    limit:      720,
    pageSize:   150,
    maxBars:    100000,
    intraday:   false,
    showVWAP:   false,
    showORB:    false,
  },
  '4Hour': {
    label:      '4h',
    lookbackMs: 90 * 24 * 60 * 60 * 1000,  // 90 days
    limit:      540,
    pageSize:   180,
    maxBars:    100000,
    intraday:   false,
    showVWAP:   false,
    showORB:    false,
  },
  '1Day': {
    label:      '1D',
    lookbackMs: 365 * 24 * 60 * 60 * 1000, // 1 year
    limit:      365,
    pageSize:   252,     // ~1 year
    maxBars:    0,       // unlimited
    intraday:   false,
    showVWAP:   false,
    showORB:    false,
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
