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
        className="flex items-center justify-between px-5 pl-safe pr-safe border-b border-theme shrink-0 h-12"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 text-theme-muted hover:text-accent transition-colors text-xs font-mono group"
            title="Back to Chart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </a>
          <div className="w-px h-4" style={{ backgroundColor: 'var(--border-mid)' }} />
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Trading Roadmap
          </span>
        </div>
        <a
          href="/"
          className="text-[11px] font-mono tracking-wider hover:text-accent transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          cheechart
        </a>
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
