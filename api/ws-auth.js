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
 * the real gate.
 */

import { timingSafeEqual as _tse } from 'crypto'
import { createRateLimiter, preamble } from './_utils.js'

const isRateLimited = createRateLimiter(5) // 5 req/min per IP

/** Timing-safe string comparison (constant-time to prevent timing attacks). */
function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && _tse(bufA, bufB)
}

export default async function handler(req, res) {
  const ctx = preamble(req, res, isRateLimited)
  if (!ctx) return

  // Bearer token is mandatory
  const expected = process.env.WS_AUTH_TOKEN
  if (!expected) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : ''

  if (!timingSafeEqual(token, expected)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const key = process.env.ALPACA_API_KEY
  const secret = process.env.ALPACA_SECRET_KEY

  if (!key || !secret) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ key, secret })
}
