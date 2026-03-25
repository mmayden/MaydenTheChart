/**
 * Vercel Serverless Function — /api/bars
 *
 * Proxies bar requests through Alpaca so API keys never reach the browser.
 *
 * Query params:
 *   symbol    - e.g. 'QQQ'
 *   timeframe - e.g. '5Min', '1Hour', '1Day'
 *   start     - ISO 8601 start date
 *   end       - ISO 8601 end date
 *   limit     - max bars (default 1000)
 */

import { createRateLimiter, preamble, ALLOWED_DATA_HOSTS, SYMBOL_RE, getAlpacaConfig } from './_utils.js'

const isRateLimited = createRateLimiter(60) // 60 req/min per IP

const VALID_TIMEFRAMES = ['1Min', '5Min', '15Min', '30Min', '1Hour', '4Hour', '1Day', '1Week', '1Month']
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/

export default async function handler(req, res) {
  const ctx = preamble(req, res, isRateLimited)
  if (!ctx) return
  const { rid } = ctx

  const { symbol, timeframe, start, end, limit = '1000' } = req.query

  if (!symbol || !timeframe || !start || !end) {
    return res.status(400).json({ error: 'Missing required params: symbol, timeframe, start, end' })
  }

  // Input validation
  if (!SYMBOL_RE.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol — must be 1-10 uppercase letters (optional .X or .XX suffix)' })
  }
  if (!VALID_TIMEFRAMES.includes(timeframe)) {
    return res.status(400).json({ error: `Invalid timeframe — must be one of: ${VALID_TIMEFRAMES.join(', ')}` })
  }
  const parsedLimit = parseInt(limit, 10)
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 10000) {
    return res.status(400).json({ error: 'Invalid limit — must be an integer between 1 and 10000' })
  }
  if (!ISO_DATE_RE.test(start)) {
    return res.status(400).json({ error: 'Invalid start — must be ISO 8601 format' })
  }
  if (!ISO_DATE_RE.test(end)) {
    return res.status(400).json({ error: 'Invalid end — must be ISO 8601 format' })
  }

  const { apiKey, secretKey, dataUrl } = getAlpacaConfig()

  // SSRF guard — reject misconfigured data URLs
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
    const MAX_PAGES = 10

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

      const response = await fetch(`${baseUrl}?${params}`, { headers, signal: AbortSignal.timeout(10_000) })

      if (!response.ok) {
        const text = await response.text()
        console.error(`[bars] rid=${rid} Alpaca API error:`, response.status, text)
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

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return res.status(200).json({ bars: allBars })
  } catch (err) {
    console.error(`[bars] rid=${rid} Fetch failed:`, err.message)
    return res.status(500).json({ error: 'Failed to fetch market data' })
  }
}
