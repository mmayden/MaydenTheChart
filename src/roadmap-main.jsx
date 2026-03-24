/**
 * roadmap-main.jsx — Entry point for the standalone /roadmap page.
 *
 * Separate Vite entry point with its own CSS — fully independent from
 * the main chart app (no chart code, no TanStack Query, no stores, no shared theme).
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RoadmapPage } from './components/pages/RoadmapPage'
import './roadmap.css'

function RoadmapApp() {
  return (
    <div className="flex flex-col h-screen-safe overflow-hidden font-mono pt-safe">
      {/* Header */}
      <nav
        className="flex items-center gap-3 px-4 pl-safe pr-safe border-b border-theme shrink-0 h-11"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <a
          href="/"
          className="flex items-center gap-2 text-theme-muted hover:text-theme transition-colors text-xs font-mono"
          title="Back to Chart"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Chart
        </a>
        <div className="w-px h-5" style={{ backgroundColor: 'var(--border-base)' }} />
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Trading Roadmap
        </span>
      </nav>

      {/* Roadmap content */}
      <RoadmapPage />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RoadmapApp />
  </React.StrictMode>,
)
