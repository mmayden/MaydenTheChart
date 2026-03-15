/**
 * main.jsx — App entry point.
 *
 * Wraps the app in:
 *   - ErrorBoundary (crash recovery)
 *   - QueryClientProvider (server state)
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './services/queryClient'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { initSentry } from './services/sentry'
import App from './App'
import './index.css'

// Initialize Sentry error tracking (no-op if VITE_SENTRY_DSN is not set)
initSentry()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app works fine without it
    })
  })
}
