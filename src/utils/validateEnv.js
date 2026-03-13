/**
 * Validates app environment on startup.
 *
 * API keys are now server-only (no VITE_ prefix) — they live in the
 * serverless functions and are never bundled into the browser.
 *
 * This function is kept as a startup hook for any future client-side
 * env checks, and to log that the app is running.
 */

export function validateEnv() {
  // No client-side env vars to validate anymore.
  // Alpaca keys are server-only (in /api/ serverless functions).
  // If the proxy is misconfigured, the API calls will fail gracefully
  // and TanStack Query will show the error state in the UI.
}
