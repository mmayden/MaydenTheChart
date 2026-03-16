/**
 * Vercel Serverless Function — /api/snapshot
 *
 * Proxies Alpaca snapshot requests for watchlist live prices.
 * Returns latest trade + quote for multiple symbols in one call.
 *
 * Query params:
 *   symbols - comma-separated list, e.g. 'QQQ,SPY,AAPL'
 */

/**
 * Simple in-memory rate limiter (best-effort per serverless instance).
 */
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30 // 30 requests per IP per minute
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

/** SSRF guard — only allow known Alpaca data hosts. */
const ALLOWED_DATA_HOSTS = new Set(['data.alpaca.markets'])

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — try again later' })
  }

  const { symbols } = req.query

  if (!symbols) {
    return res.status(400).json({ error: 'Missing required param: symbols' })
  }

  // Validate each symbol
  const symbolList = symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
  if (symbolList.length === 0 || symbolList.length > 50) {
    return res.status(400).json({ error: 'Provide 1-50 comma-separated symbols' })
  }

  for (const sym of symbolList) {
    if (!/^[A-Z]{1,10}(\.[A-Z]{1,2})?$/.test(sym)) {
      return res.status(400).json({ error: `Invalid symbol: ${sym}` })
    }
  }

  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY
  const dataUrl = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'

  // SSRF guard — reject misconfigured data URLs (exact hostname match)
  if (!ALLOWED_DATA_HOSTS.has(new URL(dataUrl).hostname)) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Server misconfigured — missing Alpaca credentials' })
  }

  try {
    const headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': secretKey,
    }

    const params = new URLSearchParams({
      symbols: symbolList.join(','),
      feed: 'iex',
    })

    const response = await fetch(`${dataUrl}/stocks/snapshots?${params}`, { headers })

    if (!response.ok) {
      const text = await response.text()
      console.error('[snapshot] Alpaca API error:', response.status, text)
      // Generic error to client — never leak upstream status codes or details
      const clientStatus = response.status === 404 ? 404 : 502
      const clientMsg = response.status === 404
        ? 'Symbol not found or no data available'
        : 'Market data temporarily unavailable'
      return res.status(clientStatus).json({ error: clientMsg })
    }

    const data = await response.json()

    // Transform: extract price, change, changePercent per symbol
    const snapshots = {}
    for (const [sym, snap] of Object.entries(data)) {
      const latestTrade = snap.latestTrade ?? snap.latest_trade
      const prevClose = snap.prevDailyBar?.c ?? snap.prev_daily_bar?.c
      const price = latestTrade?.p ?? null

      let change = null
      let changePercent = null
      if (price != null && prevClose != null && prevClose > 0) {
        change = parseFloat((price - prevClose).toFixed(2))
        changePercent = parseFloat(((change / prevClose) * 100).toFixed(2))
      }

      snapshots[sym] = { price, change, changePercent, prevClose }
    }

    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30')
    return res.status(200).json({ snapshots })
  } catch (err) {
    console.error('[snapshot] Fetch failed:', err.message)
    return res.status(500).json({ error: 'Failed to fetch snapshot data' })
  }
}
