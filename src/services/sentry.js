/**
 * Sentry initialization — error tracking + session replay + web vitals.
 *
 * Activated by setting VITE_SENTRY_DSN in environment.
 * Does nothing if the variable is absent (safe for local dev).
 *
 * Dynamic import: @sentry/react (~50-100KB) is only loaded when DSN is set,
 * keeping the main bundle lean for users without Sentry configured.
 */

/** @type {typeof import('@sentry/react') | null} */
let _Sentry = null

/** Resolved Sentry module (or null). Used by logger.js. */
export function getSentry() {
  return _Sentry
}

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  const Sentry = await import('@sentry/react')
  _Sentry = Sentry

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
  if (!_Sentry?.getClient?.()) return

  try {
    const { onLCP, onFID, onCLS, onTTFB, onINP } = await import('web-vitals')
    const send = (metric) => {
      _Sentry.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond')
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
