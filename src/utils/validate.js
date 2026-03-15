/**
 * Schema validation for localStorage-deserialized data.
 *
 * Every validator returns sanitized data or null (never throws).
 * Used at deserialization boundaries to prevent corrupted or malicious
 * localStorage values from propagating into application state.
 */

import { TIMEFRAME_ORDER } from '../constants/chart'

const SYMBOL_RE = /^[A-Z]{1,10}(\.[A-Z]{1,2})?$/
const INDICATOR_KEYS = ['ema', 'vwap', 'rvol', 'rsi', 'macd', 'levels', 'sr', 'bollinger']
const VALID_RESULTS = ['win', 'loss', 'breakeven']
const MAX_PRESET_NAME = 50
const MAX_JOURNAL_NOTES = 2000
const MAX_WATCHLIST = 100

/**
 * Validate a single preset object from localStorage.
 * Returns a sanitized preset or null if structurally invalid.
 */
export function validatePreset(obj) {
  if (!obj || typeof obj !== 'object') return null
  if (typeof obj.id !== 'string' || !obj.id) return null
  if (typeof obj.name !== 'string' || !obj.name) return null

  // Sanitize name length
  const name = obj.name.slice(0, MAX_PRESET_NAME)

  // Validate indicators — must be an object with boolean values for known keys
  if (!obj.indicators || typeof obj.indicators !== 'object') return null
  const indicators = {}
  for (const key of INDICATOR_KEYS) {
    indicators[key] = typeof obj.indicators[key] === 'boolean' ? obj.indicators[key] : false
  }

  // Validate timeframe
  const timeframe = TIMEFRAME_ORDER.includes(obj.timeframe) ? obj.timeframe : '5Min'

  return {
    id: obj.id,
    name,
    icon: typeof obj.icon === 'string' ? obj.icon.slice(0, 4) : '◉',
    isDefault: typeof obj.isDefault === 'boolean' ? obj.isDefault : false,
    indicators,
    timeframe,
  }
}

/**
 * Validate a single journal entry from localStorage.
 * Returns a sanitized entry or null if structurally invalid.
 */
export function validateJournalEntry(obj) {
  if (!obj || typeof obj !== 'object') return null
  if (typeof obj.id !== 'string' || !obj.id) return null

  // Validate date — must be a parseable date string
  if (typeof obj.date !== 'string') return null
  const dateMs = Date.parse(obj.date)
  if (isNaN(dateMs)) return null

  // Validate symbol — optional (some early entries may lack it)
  const symbol = typeof obj.symbol === 'string' && SYMBOL_RE.test(obj.symbol)
    ? obj.symbol
    : null

  // Validate result
  const result = typeof obj.result === 'string' && VALID_RESULTS.includes(obj.result)
    ? obj.result
    : null

  // Validate rating — integer 1-5 or null
  let rating = null
  if (typeof obj.rating === 'number' && Number.isInteger(obj.rating) && obj.rating >= 1 && obj.rating <= 5) {
    rating = obj.rating
  }

  // Validate notes — string, capped at 2000 chars
  const notes = typeof obj.notes === 'string'
    ? obj.notes.slice(0, MAX_JOURNAL_NOTES)
    : ''

  // Validate setup — string, optional
  const setup = typeof obj.setup === 'string'
    ? obj.setup.slice(0, 100)
    : ''

  // Validate timeframe — optional
  const timeframe = typeof obj.timeframe === 'string' && TIMEFRAME_ORDER.includes(obj.timeframe)
    ? obj.timeframe
    : null

  return {
    id: obj.id,
    date: obj.date,
    symbol,
    timeframe,
    setup,
    result,
    notes,
    rating,
  }
}

/**
 * Validate a watchlist array from localStorage.
 * Returns a deduplicated, validated array of symbol strings (max 100).
 */
export function validateWatchlist(arr) {
  if (!Array.isArray(arr)) return null

  const seen = new Set()
  const result = []
  for (const item of arr) {
    if (typeof item !== 'string') continue
    const sym = item.trim().toUpperCase()
    if (!SYMBOL_RE.test(sym)) continue
    if (seen.has(sym)) continue
    seen.add(sym)
    result.push(sym)
    if (result.length >= MAX_WATCHLIST) break
  }

  return result
}

/**
 * Validate symbol usage counts from localStorage.
 * Returns a sanitized object with valid symbol keys and non-negative integer values.
 */
export function validateSymbolUsage(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (!SYMBOL_RE.test(key)) continue
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) continue
    result[key] = value
  }

  return result
}
