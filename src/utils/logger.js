/**
 * Structured logger — replaces scattered console.* calls.
 *
 * Levels: debug < info < warn < error
 *   - Development: all levels logged
 *   - Production:  warn + error only
 *
 * Usage:
 *   import { log } from '../utils/logger'
 *   log.info('WS', 'Connected', { symbol: 'QQQ' })
 *   log.error('bars', 'Fetch failed', err)
 *
 * All output is prefixed with [tag] for easy filtering in devtools / Vercel logs.
 * Errors are forwarded to Sentry when available (via captureException).
 *
 * Sentry is resolved lazily via getSentry() — no static import of @sentry/react,
 * so this module doesn't pull in the ~50-100KB Sentry bundle.
 */

import { getSentry } from '../services/sentry'

const IS_DEV = import.meta.env.DEV

const LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 }
const MIN_LEVEL = IS_DEV ? 'debug' : 'warn'

function shouldLog(level) {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL]
}

function fmt(tag) {
  return `[${tag}]`
}

function sentryCapture(tag, message, extra) {
  try {
    const Sentry = getSentry()
    if (!Sentry?.getClient?.()) return
    if (extra instanceof Error) {
      Sentry.captureException(extra, { tags: { component: tag }, extra: { message } })
    } else {
      Sentry.captureMessage(`[${tag}] ${message}`, {
        level: 'error',
        tags: { component: tag },
        extra: extra != null ? { detail: String(extra) } : undefined,
      })
    }
  } catch {
    // Sentry not initialized — no-op
  }
}

export const log = {
  debug(tag, message, ...args) {
    if (!shouldLog('debug')) return
    console.debug(fmt(tag), message, ...args) // eslint-disable-line no-console
  },

  info(tag, message, ...args) {
    if (!shouldLog('info')) return
    console.info(fmt(tag), message, ...args) // eslint-disable-line no-console
  },

  warn(tag, message, ...args) {
    if (!shouldLog('warn')) return
    console.warn(fmt(tag), message, ...args)
  },

  error(tag, message, ...args) {
    if (!shouldLog('error')) return
    console.error(fmt(tag), message, ...args)
    sentryCapture(tag, message, args[0])
  },

  /** Add a Sentry breadcrumb for user actions / state changes. No-op if Sentry not loaded. */
  breadcrumb(category, message, data) {
    try {
      const Sentry = getSentry()
      if (!Sentry?.getClient?.()) return
      Sentry.addBreadcrumb({ category, message, data, level: 'info' })
    } catch {
      // no-op
    }
  },
}
