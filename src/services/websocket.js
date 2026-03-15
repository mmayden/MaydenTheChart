/**
 * Alpaca WebSocket connection manager.
 *
 * Connects to wss://stream.data.alpaca.markets/v2/iex, authenticates,
 * subscribes to minute bars, and calls back with normalized bar data.
 *
 * Handles reconnection with exponential backoff + jitter.
 */

import axios from 'axios'

const WS_URL = 'wss://stream.data.alpaca.markets/v2/iex'
const MAX_RETRIES = 10
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000

/**
 * Fetch WebSocket credentials from the serverless proxy.
 */
async function fetchCredentials() {
  const token = import.meta.env.VITE_WS_AUTH_TOKEN
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const { data } = await axios.get('/api/ws-auth', { headers })
  return data
}

/**
 * Normalize an Alpaca WebSocket bar to the shape lightweight-charts expects.
 *
 * WS bar shape: { T:'b', S:'QQQ', o, h, l, c, v, t:'2026-03-14T14:30:00Z', n, vw }
 * Output:       { time (unix seconds), open, high, low, close, volume }
 */
function normalizeWsBar(bar) {
  return {
    time:   Math.floor(new Date(bar.t).getTime() / 1000),
    open:   bar.o,
    high:   bar.h,
    low:    bar.l,
    close:  bar.c,
    volume: bar.v,
  }
}

/**
 * Create and manage an Alpaca WebSocket connection.
 *
 * @param {Object} options
 * @param {(bar: Object) => void} options.onBar       — called with each normalized bar
 * @param {(status: string) => void} options.onStatus  — 'connecting' | 'authenticated' | 'subscribed' | 'disconnected' | 'error'
 * @returns {{ connect: Function, disconnect: Function }}
 */
export function createAlpacaSocket({ onBar, onStatus }) {
  let ws = null
  let retryCount = 0
  let retryTimer = null
  let intentionalClose = false
  const subscribedSymbols = ['QQQ']

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return // already connected or connecting
    }

    intentionalClose = false
    onStatus('connecting')

    fetchCredentials()
      .then(({ key, secret }) => {
        if (intentionalClose) return // disconnected while fetching creds

        if (!key || !secret) {
          console.error('[WS] Invalid credentials from /api/ws-auth')
          onStatus('error')
          return
        }

        ws = new WebSocket(WS_URL)

        ws.onmessage = (event) => {
          let messages
          try {
            messages = JSON.parse(event.data)
          } catch (e) {
            console.warn('[WS] Failed to parse message:', e.message)
            return
          }

          if (!Array.isArray(messages)) return

          for (const msg of messages) {
            // Welcome message — send auth
            if (msg.T === 'success' && msg.msg === 'connected') {
              ws.send(JSON.stringify({ action: 'auth', key, secret }))
            }

            // Auth success — subscribe to bars
            if (msg.T === 'success' && msg.msg === 'authenticated') {
              retryCount = 0 // reset on successful auth
              onStatus('authenticated')
              ws.send(JSON.stringify({
                action: 'subscribe',
                bars: subscribedSymbols,
              }))
            }

            // Subscription confirmation
            if (msg.T === 'subscription') {
              onStatus('subscribed')
            }

            // Bar data
            if (msg.T === 'b') {
              onBar(normalizeWsBar(msg))
            }

            // Auth error
            if (msg.T === 'error') {
              console.error('[WS] Alpaca error:', msg.msg, msg.code)
              onStatus('error')
            }
          }
        }

        ws.onclose = () => {
          ws = null
          if (!intentionalClose) {
            onStatus('disconnected')
            scheduleReconnect()
          }
        }

        ws.onerror = (err) => {
          console.error('[WS] WebSocket error:', err)
          // onclose will fire after this, which handles reconnect
        }
      })
      .catch((err) => {
        console.error('[WS] Failed to fetch credentials:', err)
        onStatus('error')
        scheduleReconnect()
      })
  }

  function scheduleReconnect() {
    if (intentionalClose || retryCount >= MAX_RETRIES) {
      if (retryCount >= MAX_RETRIES) {
        console.error('[WS] Max retries reached, giving up')
        onStatus('error')
      }
      return
    }

    retryCount++
    // Exponential backoff with jitter
    const delay = Math.min(
      BASE_DELAY_MS * Math.pow(2, retryCount - 1) + Math.random() * 1000,
      MAX_DELAY_MS,
    )
    console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${retryCount}/${MAX_RETRIES})`)
    retryTimer = setTimeout(connect, delay)
  }

  function disconnect() {
    intentionalClose = true
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    retryCount = 0
    onStatus('disconnected')
  }

  return { connect, disconnect }
}
