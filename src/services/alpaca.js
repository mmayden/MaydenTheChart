/**
 * Alpaca market data client — proxied through /api/bars serverless function.
 *
 * API keys are NEVER sent to the browser. The serverless function holds
 * the credentials and forwards requests to Alpaca server-side.
 *
 * In local dev, requests go to the Vite dev server proxy (configured in vite.config.js).
 * In production (Vercel), requests go to the serverless function directly.
 */

import axios from 'axios'

/**
 * Fetch historical OHLCV bars for a symbol via the secure proxy.
 *
 * @param {string} symbol   - e.g. 'QQQ'
 * @param {string} timeframe - Alpaca timeframe string: '1Min', '5Min', '15Min', '1Hour', '4Hour', '1Day'
 * @param {string} start    - ISO 8601 start date
 * @param {string} end      - ISO 8601 end date
 * @param {number} limit    - max bars (default 1000)
 * @returns {Promise<Bar[]>} - array of bar objects from Alpaca
 */
export async function fetchBars(symbol, timeframe, start, end, limit = 1000) {
  const params = { symbol, timeframe, start, end, limit }
  const { data } = await axios.get('/api/bars', { params })
  return data.bars ?? []
}
