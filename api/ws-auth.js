/**
 * Vercel Serverless Function — /api/ws-auth
 *
 * Returns Alpaca WebSocket credentials to the browser so it can
 * open a direct connection to wss://stream.data.alpaca.markets/v2/iex.
 *
 * Protected by a bearer token (WS_AUTH_TOKEN) + IP-based rate limiting.
 *
 * SECURITY NOTE: The bearer token ships in the client JS bundle, so it
 * is NOT a secret — it only prevents trivial abuse. The rate limiter is
 * the real gate. For real-money accounts, replace this with a server-side
 * WebSocket relay that never exposes credentials to the browser.
 */

import { timingSafeEqual as _tse } from 'crypto'

/** Timing-safe string comparison (constant-time to prevent timing attacks). */
function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && _tse(bufA, bufB)
}

/**
 * Simple in-memory rate limiter.
 * Serverless caveat: each cold-start gets a fresh map, so this is
 * best-effort per instance. For stronger guarantees, use Upstash/KV.
 */
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 5         // max 5 requests per IP per minute
const RATE_LIMIT_MAX_ENTRIES = 10_000
let lastCleanup = 0

function isRateLimited(ip) {
  const now = Date.now()
  if (now - lastCleanup > 120_000 || rateLimitMap.size > RATE_LIMIT_MAX_ENTRIES) {
    for (const [key, val] of rateLimitMap) {
      if (now - val.start > RATE_LIMIT_WINDOW) rateLimitMap.delete(key)
    }
    lastCleanup = now
  }
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 })
    return false
  }
  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — try again later' })
  }

  // Bearer token is mandatory — reject if WS_AUTH_TOKEN is not configured
  const expected = process.env.WS_AUTH_TOKEN
  if (!expected) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : ''

  // Timing-safe comparison to prevent timing attacks
  if (!timingSafeEqual(token, expected)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const key = process.env.ALPACA_API_KEY
  const secret = process.env.ALPACA_SECRET_KEY

  if (!key || !secret) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  // Short cache — credentials don't change often but shouldn't be cached long
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ key, secret })
}
