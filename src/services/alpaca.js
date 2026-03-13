/**
 * Alpaca API client — axios instance with auth headers baked in.
 * Two separate instances: one for account/trading, one for market data.
 * All keys come from VITE_* env vars — never hardcoded.
 */

import axios from 'axios'

const AUTH_HEADERS = {
  'APCA-API-KEY-ID':     import.meta.env.VITE_ALPACA_API_KEY,
  'APCA-API-SECRET-KEY': import.meta.env.VITE_ALPACA_SECRET_KEY,
}

/** Account/trading endpoint (paper) */
export const alpacaClient = axios.create({
  baseURL: import.meta.env.VITE_ALPACA_BASE_URL,
  headers: AUTH_HEADERS,
})

/** Market data endpoint */
export const alpacaDataClient = axios.create({
  baseURL: import.meta.env.VITE_ALPACA_DATA_URL,
  headers: AUTH_HEADERS,
})

/**
 * Fetch historical OHLCV bars for a symbol.
 *
 * @param {string} symbol   - e.g. 'QQQ'
 * @param {string} timeframe - Alpaca timeframe string: '1Min', '5Min', '15Min', '1Hour', '4Hour', '1Day'
 * @param {string} start    - ISO 8601 start date  e.g. '2026-03-01T00:00:00Z'
 * @param {string} end      - ISO 8601 end date
 * @param {number} limit    - max bars (default 1000)
 * @returns {Promise<Bar[]>} - array of bar objects from Alpaca
 */
export async function fetchBars(symbol, timeframe, start, end, limit = 1000) {
  const params = { timeframe, start, end, limit, adjustment: 'raw' }
  const { data } = await alpacaDataClient.get(`/stocks/${symbol}/bars`, { params })
  return data.bars ?? []
}

/**
 * Fetch the latest quote for a symbol (for live price display).
 *
 * @param {string} symbol
 * @returns {Promise<Quote>}
 */
export async function fetchLatestQuote(symbol) {
  const { data } = await alpacaDataClient.get(`/stocks/${symbol}/quotes/latest`)
  return data.quote
}
