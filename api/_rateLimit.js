/**
 * Shared rate limiter for serverless API endpoints.
 *
 * In-memory, per-instance (best-effort — each cold start gets a fresh map).
 * For stronger guarantees, swap for Upstash Redis or Vercel KV.
 *
 * Features:
 *   - Per-IP sliding window (configurable window + max)
 *   - Periodic cleanup every 2 minutes (purges expired entries)
 *   - 10K entry hard cap with emergency oldest-20% purge
 *   - extractIP helper for consistent IP extraction across endpoints
 */

const RATE_LIMIT_MAX_ENTRIES = 10_000
const CLEANUP_INTERVAL = 120_000 // 2 minutes

/**
 * Create an isolated rate limiter instance.
 *
 * @param {number} maxRequests - Max requests per IP per window
 * @param {number} windowMs   - Window duration in milliseconds (default 60s)
 * @returns {{ isLimited: (ip: string) => boolean }}
 */
export function createRateLimiter(maxRequests, windowMs = 60_000) {
  const map = new Map()
  let lastCleanup = 0

  function cleanup(now) {
    for (const [key, val] of map) {
      if (now - val.start > windowMs) map.delete(key)
    }
    lastCleanup = now

    // Emergency purge if still oversized after TTL cleanup
    if (map.size > RATE_LIMIT_MAX_ENTRIES) {
      const sorted = Array.from(map.entries())
        .sort((a, b) => a[1].start - b[1].start)
      const purgeCount = Math.ceil(sorted.length * 0.2)
      for (let i = 0; i < purgeCount; i++) map.delete(sorted[i][0])
    }
  }

  return {
    isLimited(ip) {
      const now = Date.now()

      // Periodic cleanup
      if (now - lastCleanup > CLEANUP_INTERVAL || map.size > RATE_LIMIT_MAX_ENTRIES) {
        cleanup(now)
      }

      const entry = map.get(ip)
      if (!entry || now - entry.start > windowMs) {
        map.set(ip, { start: now, count: 1 })
        return false
      }
      entry.count++
      return entry.count > maxRequests
    },
  }
}

/**
 * Extract client IP from request headers.
 *
 * On Vercel, prefer x-vercel-forwarded-for (Vercel-signed, not spoofable).
 * Falls back to x-forwarded-for first entry, then socket address.
 *
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
export function extractIP(req) {
  // Vercel-signed header — most trustworthy behind Vercel's proxy
  const vercelIP = req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim()
  if (vercelIP) return vercelIP

  const xff = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  if (xff) return xff

  return req.socket?.remoteAddress || 'unknown'
}

/**
 * Generate a request ID for log correlation.
 * @returns {string}
 */
export function requestId() {
  return crypto.randomUUID()
}
