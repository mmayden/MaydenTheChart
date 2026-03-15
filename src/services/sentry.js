/**
 * Sentry initialization — error tracking + session replay.
 *
 * Activated by setting VITE_SENTRY_DSN in environment.
 * Does nothing if the variable is absent (safe for local dev).
 */

import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.DEV ? 'development' : 'production',
    // Free tier: 5K errors/month — sample aggressively
    sampleRate: 1.0,
    // Session replay (free tier: 50 sessions/month)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration(),
    ],
  })
}
