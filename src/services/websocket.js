/**
 * WebSocket connection manager — provider-agnostic shell.
 *
 * Handles connection lifecycle, reconnection with exponential backoff + jitter,
 * and credential fetching. Provider-specific protocol (auth messages, bar parsing,
 * subscription format) is delegated to the provider adapter.
 *
 * Currently uses the Alpaca adapter (src/services/providers/alpaca.js).
 */

import axios from 'axios'
import { getWSUrl, handleWSMessages } from './providers/alpaca'
import { log } from '../utils/logger'

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
 * Create and manage a WebSocket connection for live market data.
 *
 * @param {Object} options
 * @param {(bar: Object) => void} options.onBar        — called with each normalized bar
 * @param {(status: string) => void} options.onStatus   — 'connecting' | 'authenticated' | 'subscribed' | 'disconnected' | 'error'
 * @param {() => string} [options.getSymbol]            — returns the current symbol to subscribe to (default: 'QQQ')
 * @returns {{ connect: Function, disconnect: Function }}
 */
export function createSocket({ onBar, onStatus, getSymbol }) {
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
          log.error('WS', 'Invalid credentials from /api/ws-auth')
          onStatus('error')
          return
        }

        ws = new WebSocket(getWSUrl())

        ws.onmessage = (event) => {
          let messages
          try {
            messages = JSON.parse(event.data)
          } catch (e) {
            log.warn('WS', 'Failed to parse message', e)
            return
          }

          if (!Array.isArray(messages)) return

          // Delegate protocol handling to provider adapter
          handleWSMessages(messages, {
            ws,
            key,
            secret,
            getSymbol,
            onBar,
            onStatus,
            onAuthSuccess: () => { retryCount = 0 },
          })
        }

        ws.onclose = () => {
          ws = null
          if (!intentionalClose) {
            onStatus('disconnected')
            scheduleReconnect()
          }
        }

        ws.onerror = (err) => {
          log.error('WS', 'WebSocket error', err)
          // onclose will fire after this, which handles reconnect
        }
      })
      .catch((err) => {
        log.error('WS', 'Failed to fetch credentials', err)
        onStatus('error')
        scheduleReconnect()
      })
  }

  function scheduleReconnect() {
    if (intentionalClose) return
    if (retryCount >= MAX_RETRIES) {
      log.error('WS', 'Max retries reached, scheduling recovery in 5 minutes')
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
    log.debug('WS', `Reconnecting in ${Math.round(delay)}ms (attempt ${retryCount}/${MAX_RETRIES})`)
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
