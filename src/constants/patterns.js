/**
 * Shared validation patterns — single source of truth.
 *
 * Used in: useChartStore, useURLState, WatchlistPanel, validate.js,
 * api/bars.js, api/snapshot.js (server-side duplicates inline for
 * zero-import serverless deploys — keep in sync).
 */

/** Matches valid US equity symbols: 1-10 uppercase letters, optional .X or .XX suffix (e.g. BRK.B) */
export const SYMBOL_RE = /^[A-Z]{1,10}(\.[A-Z]{1,2})?$/
