/**
 * Data provider abstraction layer.
 *
 * All data fetching goes through this module. The active provider adapter
 * handles normalization, timeframe translation, and protocol details.
 *
 * Provider interface (3 methods):
 *   fetchBars(symbol, timeframe, start, end, limit)  → normalized bars
 *   fetchSnapshot(symbols)                            → { [sym]: { price, change, changePercent } }
 *   createSocket({ onBar, onStatus, getSymbol })      → { connect, disconnect }
 *
 * Currently only Alpaca is implemented. To add a provider:
 *   1. Create src/services/providers/{name}.js with the adapter functions
 *   2. Add the provider to the registry below
 *   3. Set DATA_PROVIDER env var (or leave default 'alpaca')
 */

import axios from 'axios'
import {
  normalizeBars as alpacaNormalizeBars,
  getProviderTimeframe as alpacaGetTimeframe,
} from './providers/alpaca'

// ─── Active provider ─────────────────────────────────────────────────────────
// To add a new provider:
//   1. Create src/services/providers/{name}.js with adapter functions
//   2. Import and wire it here (swap alpacaNormalizeBars / alpacaGetTimeframe)
//   3. Update serverless proxies (api/bars.js, api/snapshot.js)
const ACTIVE_PROVIDER = 'alpaca'

/**
 * Get provider name.
 */
export function getProviderName() {
  return ACTIVE_PROVIDER
}

// ─── Data fetching (synchronous provider for REST — no dynamic import needed) ─

/**
 * Fetch historical OHLCV bars for a symbol.
 * Returns normalized bars: [{ time, open, high, low, close, volume }]
 *
 * @param {string} symbol   - e.g. 'QQQ'
 * @param {string} timeframe - Internal timeframe key: '1Min', '5Min', etc.
 * @param {string} start    - ISO 8601 start date
 * @param {string} end      - ISO 8601 end date
 * @param {number} limit    - Max bars (default 1000)
 * @returns {Promise<Object[]>} Normalized bar array
 */
export async function fetchBars(symbol, timeframe, start, end, limit = 1000) {
  const providerTimeframe = alpacaGetTimeframe(timeframe)
  const params = { symbol, timeframe: providerTimeframe, start, end, limit }
  const { data } = await axios.get('/api/bars', { params })
  return alpacaNormalizeBars(data.bars ?? [])
}

/**
 * Fetch live snapshot quotes for multiple symbols.
 * Returns { [symbol]: { price, change, changePercent, prevClose } }
 *
 * @param {string[]} symbols - Array of ticker symbols
 * @returns {Promise<Object>} Snapshots keyed by symbol
 */
export async function fetchSnapshot(symbols) {
  const { data } = await axios.get('/api/snapshot', {
    params: { symbols: symbols.join(',') },
  })
  return data.snapshots ?? {}
}
