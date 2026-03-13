/**
 * Validates that all required VITE_* environment variables are present.
 * Called once at app startup in main.jsx before anything else renders.
 * Throws a clear, actionable error message if any are missing.
 */

const REQUIRED_VARS = [
  'VITE_ALPACA_API_KEY',
  'VITE_ALPACA_SECRET_KEY',
  'VITE_ALPACA_BASE_URL',
  'VITE_ALPACA_DATA_URL',
]

export function validateEnv() {
  const missing = REQUIRED_VARS.filter(
    (key) => !import.meta.env[key] || import.meta.env[key].startsWith('your_')
  )

  if (missing.length > 0) {
    throw new Error(
      `MaydenTheChart: Missing required environment variables.\n\n` +
        `Missing or placeholder values:\n` +
        missing.map((k) => `  • ${k}`).join('\n') +
        `\n\nCopy .env.example to .env and fill in your Alpaca paper trading keys.\n` +
        `Get keys at: https://app.alpaca.markets`
    )
  }
}
