/**
 * Vercel Serverless Function — /api/bars
 *
 * Proxies bar requests through the configured data provider so API keys
 * never reach the browser. Currently supports Alpaca (default).
 *
 * Provider selection: DATA_PROVIDER env var (default: 'alpaca').
 * Future providers will add their own handler functions below.
 *
 * Query params:
 *   symbol    - e.g. 'QQQ'
 *   timeframe - e.g. '5Min', '1Hour', '1Day'
 *   start     - ISO 8601 start date
 *   end       - ISO 8601 end date
 *   limit     - max bars (default 1000)
 */

/**
 * Simple in-memory rate limiter (best-effort per serverless instance).
 */
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 60        // 60 requests per IP per minute
const RATE_LIMIT_MAX_ENTRIES = 10_000
let lastCleanup = 0

function isRateLimited(ip) {
  const now = Date.now()
  // Periodic cleanup — purge expired entries every 2 minutes (or if map is oversized)
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

/** Generate a short request ID for log correlation. */
function requestId() {
  return Math.random().toString(36).slice(2, 10)
}

export default async function handler(req, res) {
  const rid = requestId()
  res.setHeader('x-request-id', rid)

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — try again later' })
  }

  const { symbol, timeframe, start, end, limit = '1000' } = req.query

  if (!symbol || !timeframe || !start || !end) {
    return res.status(400).json({ error: 'Missing required params: symbol, timeframe, start, end' })
  }

  // Input validation
  const VALID_TIMEFRAMES = ['1Min', '5Min', '15Min', '30Min', '1Hour', '4Hour', '1Day', '1Week', '1Month']
  if (!/^[A-Z]{1,10}(\.[A-Z]{1,2})?$/.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol — must be 1-10 uppercase letters (optional .X or .XX suffix)' })
  }
  if (!VALID_TIMEFRAMES.includes(timeframe)) {
    return res.status(400).json({ error: `Invalid timeframe — must be one of: ${VALID_TIMEFRAMES.join(', ')}` })
  }
  const parsedLimit = parseInt(limit, 10)
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 10000) {
    return res.status(400).json({ error: 'Invalid limit — must be an integer between 1 and 10000' })
  }
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/
  if (start && !ISO_DATE_RE.test(start)) {
    return res.status(400).json({ error: 'Invalid start — must be ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDThh:mm:ss)' })
  }
  if (end && !ISO_DATE_RE.test(end)) {
    return res.status(400).json({ error: 'Invalid end — must be ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDThh:mm:ss)' })
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
    const baseUrl = `${dataUrl}/stocks/${encodeURIComponent(symbol)}/bars`

    let allBars = []
    let pageToken = null
    const MAX_PAGES = 10 // safety cap to avoid runaway loops

    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({
        timeframe,
        start,
        end,
        limit: String(parsedLimit),
        adjustment: 'raw',
        feed: 'iex',
      })
      if (pageToken) params.set('page_token', pageToken)

      const response = await fetch(`${baseUrl}?${params}`, { headers })

      if (!response.ok) {
        const text = await response.text()
        console.error(`[bars] rid=${rid} Alpaca API error:`, response.status, text)
        // Generic error to client — never leak upstream status codes or details
        const clientStatus = response.status === 404 ? 404 : 502
        const clientMsg = response.status === 404
          ? 'Symbol not found or no data available'
          : 'Market data temporarily unavailable'
        return res.status(clientStatus).json({ error: clientMsg })
      }

      const data = await response.json()
      const bars = data.bars ?? []
      allBars = allBars.concat(bars)
      pageToken = data.next_page_token ?? null

      if (!pageToken) break
    }

    // Cache for 30 seconds — data doesn't change that fast
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return res.status(200).json({ bars: allBars })
  } catch (err) {
    console.error(`[bars] rid=${rid} Fetch failed:`, err.message)
    return res.status(500).json({ error: 'Failed to fetch market data' })
  }
}
