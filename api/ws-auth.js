/**
 * Vercel Serverless Function — /api/ws-auth
 *
 * Returns Alpaca WebSocket credentials to the browser so it can
 * open a direct connection to wss://stream.data.alpaca.markets/v2/iex.
 *
 * Protected by a bearer token (WS_AUTH_TOKEN) to prevent random third
 * parties from harvesting credentials. This is a paper trading account
 * so the risk is minimal — for real money, use a persistent WS relay.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple bearer token check
  const expected = process.env.WS_AUTH_TOKEN
  if (expected) {
    const auth = req.headers.authorization
    if (!auth || auth !== `Bearer ${expected}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const key = process.env.ALPACA_API_KEY
  const secret = process.env.ALPACA_SECRET_KEY

  if (!key || !secret) {
    return res.status(500).json({ error: 'Server misconfigured — missing Alpaca credentials' })
  }

  // Short cache — credentials don't change often but shouldn't be cached long
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ key, secret })
}
