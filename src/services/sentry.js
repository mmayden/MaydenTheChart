/**
 * Sentry initialization — error tracking + session replay + web vitals.
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
    // Performance monitoring — sample 20% of transactions
    tracesSampleRate: 0.2,
    // Session replay (free tier: 50 sessions/month)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration(),
      Sentry.browserTracingIntegration(),
    ],
  })
}

/**
 * Report web vitals (LCP, FID, CLS, TTFB, INP) to Sentry as custom measurements.
 * Called once from main.jsx after app mounts. No-op if web-vitals not installed
 * or Sentry is not active.
 */
export async function reportWebVitals() {
  if (!Sentry.getClient?.()) return

  try {
    const { onLCP, onFID, onCLS, onTTFB, onINP } = await import('web-vitals')
    const send = (metric) => {
      Sentry.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond')
    }
    onLCP(send)
    onFID(send)
    onCLS(send)
    onTTFB(send)
    onINP(send)
  } catch {
    // web-vitals not installed — skip silently
  }
}
