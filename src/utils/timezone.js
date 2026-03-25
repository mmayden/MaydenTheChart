/**
 * timezone.js — Shared Eastern Time conversion utilities.
 *
 * Single source of truth for all ET date/time conversions.
 * Used by indicators.js, levels.js, and any component needing ET formatting.
 */

export const ET_TIMEZONE = 'America/New_York'

// Module-level formatter singletons — avoid re-instantiation on every call
const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: ET_TIMEZONE })
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ET_TIMEZONE,
  hour: 'numeric', minute: 'numeric', hour12: false,
})

/**
 * Convert unix seconds to a YYYY-MM-DD date string in US-Eastern time.
 * Uses Intl.DateTimeFormat so DST (EDT/EST) is handled automatically.
 */
export function toETDateString(unixSecs) {
  return dateFormatter.format(new Date(unixSecs * 1000))
}

/**
 * Get ET hour:minute from a Unix timestamp (seconds).
 * Uses Intl.DateTimeFormat so DST (EDT/EST) is handled automatically.
 */
export function toETTime(unixSecs) {
  const parts = timeFormatter.formatToParts(new Date(unixSecs * 1000))
  const hourPart   = parts.find((p) => p.type === 'hour')
  const minutePart = parts.find((p) => p.type === 'minute')
  const h = hourPart ? Number(hourPart.value) : 0
  return {
    hour:   h === 24 ? 0 : h, // ICU returns 24 for midnight on some platforms
    minute: minutePart ? Number(minutePart.value) : 0,
  }
}

/**
 * Get today's date as YYYY-MM-DD string (UTC).
 * Shared across hooks to avoid duplicating `new Date().toISOString().slice(0, 10)`.
 */
export function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}
