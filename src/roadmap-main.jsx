/**
 * roadmap-main.jsx — Entry point for the standalone /roadmap page.
 *
 * Separate Vite entry point with its own CSS — fully independent from
 * the main chart app (no chart code, no TanStack Query, no stores, no shared theme).
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RoadmapPage } from './components/pages/RoadmapPage'
import Logo from './components/ui/Logo'
import './roadmap.css'

function RoadmapApp() {
  return (
    <div className="flex flex-col h-screen-safe overflow-hidden font-mono pt-safe">
      {/* Header */}
      <nav
        className="flex items-center border-b border-theme shrink-0 h-11 px-4 md:px-8"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <a
          href="/"
          className="flex items-center gap-1.5 text-theme-muted hover:text-theme transition-colors text-xs font-mono group"
          title="Back to Chart"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </a>
        <div className="w-px h-4 mx-3" style={{ backgroundColor: 'var(--border-mid)' }} />
        <a href="/" className="hover:opacity-80 transition-opacity shrink-0" title="Back to Lumpio">
          <Logo />
        </a>
        <div className="flex-1" />
        <span
          className="text-sm font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #00d4aa, #ff8c32)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
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
