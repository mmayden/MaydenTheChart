/**
 * Shared utilities for serverless API functions.
 *
 * Vercel does NOT deploy files prefixed with `_` as endpoints, so `_utils.js`
 * is safe to import from sibling handlers without becoming a public route.
 *
 * Each serverless instance gets its own module scope, so the rate-limit Map
 * is per-instance (best-effort). For stronger guarantees, use Upstash/KV.
 */

// ─── SSRF guard ─────────────────────────────────────────────────────────────

export const ALLOWED_DATA_HOSTS = new Set(['data.alpaca.markets'])

// ─── Request ID ─────────────────────────────────────────────────────────────

export function requestId() {
  return crypto.randomUUID().slice(0, 8)
}

// ─── IP extraction ──────────────────────────────────────────────────────────

export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
}

// ─── Rate limiter ───────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW = 60_000       // 1 minute
const RATE_LIMIT_MAX_ENTRIES = 10_000

/**
 * Create a per-endpoint rate limiter with a configurable max.
 * Returns a function `isRateLimited(ip) → boolean`.
 */
export function createRateLimiter(max) {
  const map = new Map()
  let lastCleanup = 0

  return function isRateLimited(ip) {
    const now = Date.now()
    // Periodic cleanup — purge expired entries every 2 minutes (or if map is oversized)
    if (now - lastCleanup > 120_000 || map.size > RATE_LIMIT_MAX_ENTRIES) {
      for (const [key, val] of map) {
        if (now - val.start > RATE_LIMIT_WINDOW) map.delete(key)
      }
      lastCleanup = now
    }
    const entry = map.get(ip)
    if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
      map.set(ip, { start: now, count: 1 })
      return false
    }
    entry.count++
    return entry.count > max
  }
}

// ─── Symbol validation ──────────────────────────────────────────────────────

export const SYMBOL_RE = /^[A-Z]{1,10}(\.[A-Z]{1,2})?$/

// ─── Common preamble ────────────────────────────────────────────────────────

/**
 * Run shared checks (method, rate limit) and set request ID header.
 * Returns `{ rid, ip }` on success, or sends an error response and returns null.
 */
export function preamble(req, res, isRateLimited) {
  const rid = requestId()
  res.setHeader('x-request-id', rid)

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return null
  }

  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Too many requests — try again later' })
    return null
  }

  return { rid, ip }
}

// ─── Alpaca credentials ─────────────────────────────────────────────────────

export function getAlpacaConfig() {
  const apiKey    = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY
  const dataUrl   = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'
  return { apiKey, secretKey, dataUrl }
}
