/**
 * Backup & Restore — export/import all user data as a versioned JSON file.
 * Preset Share Links — encode/decode compact preset configs for URL sharing.
 *
 * Security:
 *   - MAX_BACKUP_SIZE enforced before JSON.parse (prevents memory bomb)
 *   - Magic marker + version check on envelope
 *   - Every nested field piped through existing validators (no raw data flows to stores)
 *   - Only known keys accessed (prototype pollution safe)
 *   - No eval/innerHTML/dangerouslySetInnerHTML anywhere
 *   - Share links validated against strict fixed schema
 */

import { TIMEFRAME_ORDER } from '../constants/chart'
import { SYMBOL_RE } from '../constants/patterns'
import {
  validatePreset,
  validateAlert,
  validateJournalEntry,
  validateWatchlist,
  validateSymbolUsage,
  validateAnnotation,
  validatePreferences,
  validateBackupEnvelope,
  MAX_BACKUP_SIZE,
  MAX_JOURNAL_ENTRIES,
  MAX_ANNOTATIONS_PER_SYMBOL,
  MAX_ANNOTATION_SYMBOLS,
} from './validate'
import { stampCurrentVersions, stampAlertVersion } from './migrate'

// ── Constants ────────────────────────────────────────────────────────────────

const ALERTS_PREFIX = 'cheechart-alerts-'
const MAX_ALERTS_PER_PRESET = 50

/**
 * Indicator char map for preset share link encoding.
 * Each indicator maps to a single char — present = on, absent = off.
 */
const INDICATOR_CHAR_MAP = {
  ema: 'e', vwap: 'v', rvol: 'r', rsi: 'R', macd: 'm', levels: 'l',
  sr: 's', bollinger: 'b', rsiDiv: 'd', emaCross: 'x', gaps: 'g', volProfile: 'p',
}
const CHAR_TO_INDICATOR = Object.fromEntries(
  Object.entries(INDICATOR_CHAR_MAP).map(([k, v]) => [v, k])
)
const VALID_INDICATOR_CHARS = new Set(Object.values(INDICATOR_CHAR_MAP))
const ALL_INDICATOR_KEYS = Object.keys(INDICATOR_CHAR_MAP)

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Collect all backup-eligible localStorage data into a versioned envelope.
 * Returns a plain object (not stringified).
 */
export function collectBackup() {
  const data = {}

  // Presets (custom only — defaults come from code)
  try {
    const raw = localStorage.getItem('cheechart-presets')
    data.presets = raw ? JSON.parse(raw) : {}
  } catch { data.presets = {} }

  // Active preset
  data.activePreset = _readStr('cheechart-active-preset') || 'full'

  // Alerts — collect all cheechart-alerts-* keys
  data.alerts = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(ALERTS_PREFIX)) {
        const presetId = key.slice(ALERTS_PREFIX.length)
        const raw = JSON.parse(localStorage.getItem(key))
        if (Array.isArray(raw)) data.alerts[presetId] = raw
      }
    }
  } catch { /* partial collection is fine */ }

  // Watchlist
  try {
    const raw = localStorage.getItem('cheechart-watchlist')
    data.watchlist = raw ? JSON.parse(raw) : []
  } catch { data.watchlist = [] }

  // Journal
  try {
    const raw = localStorage.getItem('cheechart-journal')
    data.journal = raw ? JSON.parse(raw) : []
  } catch { data.journal = [] }

  // Annotations
  try {
    const raw = localStorage.getItem('cheechart-annotations')
    data.annotations = raw ? JSON.parse(raw) : {}
  } catch { data.annotations = {} }

  // Symbol usage
  try {
    const raw = localStorage.getItem('cheechart-symbol-usage')
    data.symbolUsage = raw ? JSON.parse(raw) : {}
  } catch { data.symbolUsage = {} }

  // Preferences
  data.preferences = {
    theme: _readStr('cheechart-theme') || 'dark',
    accent: _readStr('cheechart-accent') || null,
    soundAlerts: _readStr('cheechart-sound-alerts') === 'true',
    symbol: _readStr('cheechart-symbol') || null,
  }

  return {
    cheechart: true,
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/**
 * Export a backup file — collects data and triggers browser download.
 * Returns the filename.
 */
export function exportBackup() {
  const envelope = collectBackup()
  const json = JSON.stringify(envelope, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const date = new Date().toISOString().slice(0, 10)
  const filename = `cheechart-backup-${date}.json`

  // Download pattern from snapshot.js
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 100)

  return filename
}

// ── Import ───────────────────────────────────────────────────────────────────

/**
 * Parse and validate a backup file.
 * Returns { ok: true, data, summary } or { ok: false, reason }.
 *
 * @param {File} file — File object from input or drag-drop
 * @returns {Promise<Object>}
 */
export async function parseBackupFile(file) {
  // Size gate
  if (file.size > MAX_BACKUP_SIZE) {
    return { ok: false, reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.` }
  }

  // Read as text
  const text = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })

  // First-char sanity check (rejects HTML, scripts, binary)
  if (typeof text !== 'string' || text.length === 0 || text[0] !== '{') {
    return { ok: false, reason: 'Not a valid JSON file' }
  }

  // Parse JSON
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'Invalid JSON — file may be corrupted' }
  }

  // Validate envelope
  const envelope = validateBackupEnvelope(parsed)
  if (!envelope.valid) {
    return { ok: false, reason: envelope.reason }
  }

  // Validate each section and build summary
  const validated = validateBackupData(envelope.data)

  return { ok: true, data: validated.data, summary: validated.summary }
}

/**
 * Validate and sanitize every section of backup data.
 * Returns { data, summary } with only validated entries.
 */
export function validateBackupData(raw) {
  const data = {}
  const summary = {}

  // Presets
  data.presets = {}
  if (raw.presets && typeof raw.presets === 'object' && !Array.isArray(raw.presets)) {
    for (const [id, preset] of Object.entries(raw.presets)) {
      if (id === '__proto__' || id === 'constructor' || id === 'prototype') continue
      const clean = validatePreset(preset)
      if (clean) data.presets[clean.id] = clean
    }
  }
  summary.presets = Object.keys(data.presets).length

  // Active preset
  data.activePreset = typeof raw.activePreset === 'string' ? raw.activePreset.slice(0, 100) : null

  // Alerts
  data.alerts = {}
  if (raw.alerts && typeof raw.alerts === 'object' && !Array.isArray(raw.alerts)) {
    for (const [presetId, alerts] of Object.entries(raw.alerts)) {
      if (presetId === '__proto__' || presetId === 'constructor' || presetId === 'prototype') continue
      if (!Array.isArray(alerts)) continue
      const clean = alerts.map(validateAlert).filter(Boolean).slice(0, MAX_ALERTS_PER_PRESET)
      if (clean.length > 0) data.alerts[presetId] = clean
    }
  }
  summary.alerts = Object.values(data.alerts).reduce((sum, arr) => sum + arr.length, 0)

  // Watchlist
  data.watchlist = Array.isArray(raw.watchlist) ? (validateWatchlist(raw.watchlist) ?? []) : []
  summary.watchlist = data.watchlist.length

  // Journal
  data.journal = []
  if (Array.isArray(raw.journal)) {
    data.journal = raw.journal
      .map(validateJournalEntry)
      .filter(Boolean)
      .slice(0, MAX_JOURNAL_ENTRIES)
  }
  summary.journal = data.journal.length

  // Annotations
  data.annotations = {}
  if (raw.annotations && typeof raw.annotations === 'object' && !Array.isArray(raw.annotations)) {
    let symbolCount = 0
    for (const [symbol, anns] of Object.entries(raw.annotations)) {
      if (symbol === '__proto__' || symbol === 'constructor' || symbol === 'prototype') continue
      if (!SYMBOL_RE.test(symbol)) continue
      if (!Array.isArray(anns)) continue
      if (symbolCount >= MAX_ANNOTATION_SYMBOLS) break
      const clean = anns.map(validateAnnotation).filter(Boolean).slice(0, MAX_ANNOTATIONS_PER_SYMBOL)
      if (clean.length > 0) {
        data.annotations[symbol] = clean
        symbolCount++
      }
    }
  }
  summary.annotations = Object.values(data.annotations).reduce((sum, arr) => sum + arr.length, 0)

  // Symbol usage
  data.symbolUsage = raw.symbolUsage ? validateSymbolUsage(raw.symbolUsage) : {}
  summary.symbolUsage = Object.keys(data.symbolUsage).length

  // Preferences
  data.preferences = validatePreferences(raw.preferences)
  summary.preferences = data.preferences ? 1 : 0

  return { data, summary }
}

/**
 * Apply validated backup data to localStorage with merge strategy.
 * Returns a summary of what was imported.
 */
export function applyBackup(data) {
  const summary = {}

  // ── Presets (merge — new UUIDs for ID collisions) ──────────────────────
  try {
    const existing = _parseJSON('cheechart-presets') || {}
    const merged = { ...existing }
    let added = 0
    for (const [id, preset] of Object.entries(data.presets)) {
      if (preset.isDefault) continue // never import defaults
      if (merged[id]) {
        // ID collision — give imported preset a new ID
        const newId = `custom-${crypto.randomUUID()}`
        merged[newId] = { ...preset, id: newId }
      } else {
        merged[id] = preset
      }
      added++
    }
    localStorage.setItem('cheechart-presets', JSON.stringify(merged))
    summary.presets = added
  } catch { summary.presets = 0 }

  // ── Active preset ──────────────────────────────────────────────────────
  if (data.activePreset) {
    try { localStorage.setItem('cheechart-active-preset', data.activePreset) } catch { /* noop */ }
  }

  // ── Alerts (merge per-preset key) ──────────────────────────────────────
  let alertsImported = 0
  for (const [presetId, alerts] of Object.entries(data.alerts)) {
    try {
      const key = ALERTS_PREFIX + presetId
      const existing = _parseJSON(key) || []
      const existingIds = new Set(existing.map((a) => a.id))
      const toAdd = alerts.filter((a) => !existingIds.has(a.id))
      const merged = [...existing, ...toAdd].slice(0, MAX_ALERTS_PER_PRESET)
      localStorage.setItem(key, JSON.stringify(merged))
      alertsImported += toAdd.length
    } catch { /* noop */ }
  }
  summary.alerts = alertsImported

  // ── Watchlist (union, dedup, cap 100) ──────────────────────────────────
  try {
    const existing = _parseJSON('cheechart-watchlist') || []
    const seen = new Set(existing.map((s) => s.toUpperCase()))
    const toAdd = data.watchlist.filter((s) => !seen.has(s.toUpperCase()))
    const merged = [...existing, ...toAdd].slice(0, 100)
    localStorage.setItem('cheechart-watchlist', JSON.stringify(merged))
    summary.watchlist = toAdd.length
  } catch { summary.watchlist = 0 }

  // ── Journal (merge by ID, cap) ─────────────────────────────────────────
  try {
    const existing = _parseJSON('cheechart-journal') || []
    const existingIds = new Set(existing.map((e) => e.id))
    const toAdd = data.journal.filter((e) => !existingIds.has(e.id))
    const merged = [...existing, ...toAdd].slice(0, MAX_JOURNAL_ENTRIES)
    localStorage.setItem('cheechart-journal', JSON.stringify(merged))
    summary.journal = toAdd.length
  } catch { summary.journal = 0 }

  // ── Annotations (merge per-symbol by ID) ───────────────────────────────
  let annsImported = 0
  try {
    const existing = _parseJSON('cheechart-annotations') || {}
    for (const [symbol, anns] of Object.entries(data.annotations)) {
      const existList = existing[symbol] || []
      const existIds = new Set(existList.map((a) => a.id))
      const toAdd = anns.filter((a) => !existIds.has(a.id))
      existing[symbol] = [...existList, ...toAdd].slice(0, MAX_ANNOTATIONS_PER_SYMBOL)
      annsImported += toAdd.length
    }
    localStorage.setItem('cheechart-annotations', JSON.stringify(existing))
  } catch { /* noop */ }
  summary.annotations = annsImported

  // ── Symbol usage (max-wins merge) ──────────────────────────────────────
  try {
    const existing = _parseJSON('cheechart-symbol-usage') || {}
    for (const [sym, count] of Object.entries(data.symbolUsage)) {
      existing[sym] = Math.max(existing[sym] || 0, count)
    }
    localStorage.setItem('cheechart-symbol-usage', JSON.stringify(existing))
  } catch { /* noop */ }

  // ── Preferences (replace) ──────────────────────────────────────────────
  if (data.preferences) {
    try {
      if (data.preferences.theme) localStorage.setItem('cheechart-theme', data.preferences.theme)
      if (data.preferences.accent) localStorage.setItem('cheechart-accent', data.preferences.accent)
      localStorage.setItem('cheechart-sound-alerts', String(!!data.preferences.soundAlerts))
      if (data.preferences.symbol) localStorage.setItem('cheechart-symbol', data.preferences.symbol)
    } catch { /* noop */ }
    summary.preferences = 1
  }

  // ── Stamp schema versions so migration system treats imported data as current ──
  stampCurrentVersions()
  for (const presetId of Object.keys(data.alerts)) {
    stampAlertVersion(presetId)
  }

  return summary
}

// ── Preset Share Links ───────────────────────────────────────────────────────

/**
 * Encode a preset into a compact base64url string for URL sharing.
 *
 * @param {{ name: string, timeframe: string, indicators: Object }} preset
 * @returns {string} base64url-encoded string
 */
export function encodePresetShare(preset) {
  if (!preset || !preset.indicators) return ''

  // Build indicator bitfield string
  let bits = ''
  for (const [key, char] of Object.entries(INDICATOR_CHAR_MAP)) {
    if (preset.indicators[key]) bits += char
  }

  const payload = {
    n: (preset.name || 'Shared').slice(0, 50),
    tf: preset.timeframe || '5Min',
    i: bits,
  }

  const json = JSON.stringify(payload)
  // base64url: replace + with -, / with _, strip trailing =
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a base64url-encoded preset share string.
 * Returns { name, timeframe, indicators } or null if invalid.
 *
 * @param {string} encoded
 * @returns {Object|null}
 */
export function decodePresetShare(encoded) {
  if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > 500) return null

  let json
  try {
    // Reverse base64url encoding
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    json = atob(base64)
  } catch {
    return null // invalid base64
  }

  // First-char sanity check
  if (json[0] !== '{') return null

  let parsed
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  // Validate name
  const name = typeof parsed.n === 'string' ? parsed.n.slice(0, 50) : 'Shared Preset'

  // Validate timeframe
  const timeframe = TIMEFRAME_ORDER.includes(parsed.tf) ? parsed.tf : '5Min'

  // Decode indicator bitfield
  const indicators = {}
  for (const key of ALL_INDICATOR_KEYS) {
    indicators[key] = false
  }
  if (typeof parsed.i === 'string') {
    for (const char of parsed.i) {
      if (VALID_INDICATOR_CHARS.has(char) && CHAR_TO_INDICATOR[char]) {
        indicators[CHAR_TO_INDICATOR[char]] = true
      }
      // Unknown chars silently ignored
    }
  }

  return { name, timeframe, indicators }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _readStr(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

function _parseJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
