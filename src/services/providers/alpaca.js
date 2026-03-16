/**
 * Alpaca data provider adapter.
 *
 * Implements the provider interface for Alpaca Markets (free IEX feed).
 * All Alpaca-specific logic (bar normalization, timeframe strings, WS protocol)
 * is isolated here so the rest of the app is provider-agnostic.
 */

import { normalizeBar } from '../../utils/normalizeBar'

// ─── Timeframe mapping ───────────────────────────────────────────────────────
// Maps internal timeframe keys to Alpaca API strings.
const TIMEFRAME_MAP = {
  '1Min':  '1Min',
  '5Min':  '5Min',
  '15Min': '15Min',
  '1Hour': '1Hour',
  '4Hour': '4Hour',
  '1Day':  '1Day',
}

// ─── WebSocket protocol constants ────────────────────────────────────────────
const WS_URL = 'wss://stream.data.alpaca.markets/v2/iex'

/**
 * Translate internal timeframe key to Alpaca API string.
 * @param {string} timeframe - Internal key (e.g. '5Min')
 * @returns {string} Alpaca API string (e.g. '5Min')
 */
export function getProviderTimeframe(timeframe) {
  return TIMEFRAME_MAP[timeframe] ?? timeframe
}

/**
 * Normalize raw Alpaca bars (REST response) into chart-ready format.
 * Sorts oldest → newest and converts { t, o, h, l, c, v } to { time, open, high, low, close, volume }.
 *
 * @param {Object[]} rawBars - Alpaca bar objects
 * @returns {Object[]} Normalized bars sorted by time
 */
export function normalizeBars(rawBars) {
  return rawBars
    .sort((a, b) => new Date(a.t) - new Date(b.t))
    .map(normalizeBar)
}

/**
 * Normalize a single raw bar (WebSocket message).
 * Re-exports normalizeBar since Alpaca WS uses the same { t, o, h, l, c, v } shape.
 */
export { normalizeBar as normalizeWSBar }

/**
 * Get the WebSocket URL for this provider.
 */
export function getWSUrl() {
  return WS_URL
}

/**
 * Parse an Alpaca WebSocket message array and dispatch callbacks.
 *
 * @param {Object[]} messages - Parsed JSON array from WS
 * @param {Object} handlers
 * @param {WebSocket} handlers.ws - The WebSocket instance (for sending auth/subscribe)
 * @param {string} handlers.key - API key
 * @param {string} handlers.secret - API secret
 * @param {() => string} handlers.getSymbol - Returns current symbol
 * @param {(bar: Object) => void} handlers.onBar - Bar callback
 * @param {(status: string) => void} handlers.onStatus - Status callback
 * @param {() => void} handlers.onAuthSuccess - Called on successful auth (for retry reset)
 */
export function handleWSMessages(messages, handlers) {
  const { ws, key, secret, getSymbol, onBar, onStatus, onAuthSuccess } = handlers

  for (const msg of messages) {
    // Welcome message — send auth
    if (msg.T === 'success' && msg.msg === 'connected') {
      ws.send(JSON.stringify({ action: 'auth', key, secret }))
    }

    // Auth success — subscribe to bars
    if (msg.T === 'success' && msg.msg === 'authenticated') {
      onAuthSuccess?.()
      onStatus('authenticated')
      const symbol = typeof getSymbol === 'function' ? getSymbol() : 'QQQ'
      ws.send(JSON.stringify({
        action: 'subscribe',
        bars: [symbol],
      }))
    }

    // Subscription confirmation
    if (msg.T === 'subscription') {
      onStatus('subscribed')
    }

    // Bar data
    if (msg.T === 'b') {
      onBar(normalizeBar(msg))
    }

    // Error
    if (msg.T === 'error') {
      const DEBUG = import.meta.env.DEV
      DEBUG && console.error('[WS] Provider error:', msg.msg, msg.code)
      onStatus('error')
    }
  }
}
