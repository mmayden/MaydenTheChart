/**
 * Alpaca WebSocket connection manager.
 *
 * Connects to wss://stream.data.alpaca.markets/v2/iex, authenticates,
 * subscribes to minute bars, and calls back with normalized bar data.
 *
 * Handles reconnection with exponential backoff + jitter.
 */

import axios from 'axios'
import { normalizeBar } from '../utils/normalizeBar'

const WS_URL = 'wss://stream.data.alpaca.markets/v2/iex'
const MAX_RETRIES = 10
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000
const DEBUG = import.meta.env.DEV

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
 * Create and manage an Alpaca WebSocket connection.
 *
 * @param {Object} options
 * @param {(bar: Object) => void} options.onBar        — called with each normalized bar
 * @param {(status: string) => void} options.onStatus   — 'connecting' | 'authenticated' | 'subscribed' | 'disconnected' | 'error'
 * @param {() => string} [options.getSymbol]            — returns the current symbol to subscribe to (default: 'QQQ')
 * @returns {{ connect: Function, disconnect: Function }}
 */
export function createAlpacaSocket({ onBar, onStatus, getSymbol }) {
  let ws = null
  let retryCount = 0
  let retryTimer = null
  let intentionalClose = false

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
          DEBUG && console.error('[WS] Invalid credentials from /api/ws-auth')
          onStatus('error')
          return
        }

        ws = new WebSocket(WS_URL)

        ws.onmessage = (event) => {
          let messages
          try {
            messages = JSON.parse(event.data)
          } catch (e) {
            DEBUG && console.warn('[WS] Failed to parse message:', e.message)
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
              const symbol = typeof getSymbol === 'function' ? getSymbol() : 'QQQ'
              ws.send(JSON.stringify({
                action: 'subscribe',
                bars: [symbol],
              }))
            }

            // Subscription confirmation
            if (msg.T === 'subscription') {
              onStatus('subscribed')
            }

            // Bar data
            if (msg.T === 'b') {
              onBar(normalizeBar(msg))
            }

            // Auth error
            if (msg.T === 'error') {
              DEBUG && console.error('[WS] Alpaca error:', msg.msg, msg.code)
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
          DEBUG && console.error('[WS] WebSocket error:', err)
          // onclose will fire after this, which handles reconnect
        }
      })
      .catch((err) => {
        DEBUG && console.error('[WS] Failed to fetch credentials:', err)
        onStatus('error')
        scheduleReconnect()
      })
  }

  function scheduleReconnect() {
    if (intentionalClose) return
    if (retryCount >= MAX_RETRIES) {
      DEBUG && console.error('[WS] Max retries reached, scheduling recovery in 5 minutes')
      onStatus('error')
      // Auto-recovery: reset retry counter and try again after 5 minutes
      retryTimer = setTimeout(() => {
        retryCount = 0
        connect()
      }, 5 * 60 * 1000)
      return
    }

    retryCount++
    // Exponential backoff with jitter
    const delay = Math.min(
      BASE_DELAY_MS * Math.pow(2, retryCount - 1) + Math.random() * 1000,
      MAX_DELAY_MS,
    )
    DEBUG && console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${retryCount}/${MAX_RETRIES})`)
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
