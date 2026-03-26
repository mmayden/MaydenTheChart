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
import { log } from '../utils/logger'

// ─── Data fetching ──────────────────────────────────────────────────────────
// Currently uses Alpaca. To swap providers:
//   1. Create src/services/providers/{name}.js with adapter functions
//   2. Import and wire its normalize/timeframe functions below
//   3. Update serverless proxies (api/bars.js, api/snapshot.js)

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
  try {
    const { data } = await axios.get('/api/bars', { params, timeout: 10_000 })
    return alpacaNormalizeBars(data.bars ?? [])
  } catch (err) {
    log.error('dataProvider', `fetchBars failed for ${symbol} ${timeframe}`, err)
    throw err
  }
}

/**
 * Fetch live snapshot quotes for multiple symbols.
 * Returns { [symbol]: { price, change, changePercent, prevClose } }
 *
 * @param {string[]} symbols - Array of ticker symbols
 * @returns {Promise<Object>} Snapshots keyed by symbol
 */
export async function fetchSnapshot(symbols) {
  try {
    const { data } = await axios.get('/api/snapshot', {
      params: { symbols: symbols.join(',') },
      timeout: 10_000,
    })
    return data.snapshots ?? {}
  } catch (err) {
    log.error('dataProvider', `fetchSnapshot failed for ${symbols.join(',')}`, err)
    throw err
  }
}
