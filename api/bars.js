/**
 * Vercel Serverless Function — /api/bars
 *
 * Proxies Alpaca bar requests so API keys never reach the browser.
 * Keys are read from server-only env vars (no VITE_ prefix).
 *
 * Query params:
 *   symbol    - e.g. 'QQQ'
 *   timeframe - e.g. '5Min', '1Hour', '1Day'
 *   start     - ISO 8601 start date
 *   end       - ISO 8601 end date
 *   limit     - max bars (default 1000)
 */

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { symbol, timeframe, start, end, limit = '1000' } = req.query

  if (!symbol || !timeframe || !start || !end) {
    return res.status(400).json({ error: 'Missing required params: symbol, timeframe, start, end' })
  }

  // Input validation
  const VALID_TIMEFRAMES = ['1Min', '5Min', '15Min', '30Min', '1Hour', '4Hour', '1Day', '1Week', '1Month']
  if (!/^[A-Z]{1,10}$/.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol — must be 1-10 uppercase letters' })
  }
  if (!VALID_TIMEFRAMES.includes(timeframe)) {
    return res.status(400).json({ error: `Invalid timeframe — must be one of: ${VALID_TIMEFRAMES.join(', ')}` })
  }
  const parsedLimit = parseInt(limit, 10)
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 10000) {
    return res.status(400).json({ error: 'Invalid limit — must be an integer between 1 and 10000' })
  }

  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY
  const dataUrl = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Server misconfigured — missing Alpaca credentials' })
  }

  try {
    const params = new URLSearchParams({
      timeframe,
      start,
      end,
      limit: String(parsedLimit),
      adjustment: 'raw',
      feed: 'iex',
    })

    const response = await fetch(
      `${dataUrl}/stocks/${encodeURIComponent(symbol)}/bars?${params}`,
      {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey,
        },
      }
    )

    if (!response.ok) {
      console.error('[bars] Alpaca API error:', response.status, await response.text())
      return res.status(response.status).json({ error: `Upstream API error (${response.status})` })
    }

    const data = await response.json()

    // Cache for 30 seconds — data doesn't change that fast
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return res.status(200).json(data)
  } catch (err) {
    console.error('[bars] Fetch failed:', err.message)
    return res.status(500).json({ error: 'Failed to fetch market data' })
  }
}
