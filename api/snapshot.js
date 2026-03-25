/**
 * Vercel Serverless Function — /api/snapshot
 *
 * Proxies snapshot requests through Alpaca for watchlist live prices.
 *
 * Query params:
 *   symbols - comma-separated list, e.g. 'QQQ,SPY,AAPL'
 */

import { createRateLimiter, preamble, ALLOWED_DATA_HOSTS, SYMBOL_RE, getAlpacaConfig } from './_utils.js'

const isRateLimited = createRateLimiter(30) // 30 req/min per IP

export default async function handler(req, res) {
  const ctx = preamble(req, res, isRateLimited)
  if (!ctx) return
  const { rid } = ctx

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
    if (!SYMBOL_RE.test(sym)) {
      return res.status(400).json({ error: 'Invalid symbol format' })
    }
  }

  const { apiKey, secretKey, dataUrl } = getAlpacaConfig()

  // SSRF guard
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

    const response = await fetch(`${dataUrl}/stocks/snapshots?${params}`, { headers, signal: AbortSignal.timeout(10_000) })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[snapshot] rid=${rid} Alpaca API error:`, response.status, text)
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
    console.error(`[snapshot] rid=${rid} Fetch failed:`, err.message)
    return res.status(500).json({ error: 'Failed to fetch snapshot data' })
  }
}
