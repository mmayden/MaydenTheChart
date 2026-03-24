/**
 * roadmap-main.jsx — Entry point for the standalone /roadmap page.
 *
 * Separate Vite entry point — shares CSS and constants with the main app
 * but loads independently (no chart code, no TanStack Query, no stores).
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RoadmapPage } from './components/pages/RoadmapPage'
import './index.css'

// Apply theme from localStorage (shared with main app)
const theme = (() => {
  try { return localStorage.getItem('cheechart-theme') ?? 'dark' } catch { return 'dark' }
})()

// Apply accent from localStorage (shared with main app)
function applyAccent() {
  try {
    const id = localStorage.getItem('cheechart-accent')
    if (!id) return
    // Dynamic import to avoid bundling accent constants unless needed
    import('./constants/accents').then(({ ACCENT_LOOKUP }) => {
      const colors = ACCENT_LOOKUP[theme]?.[id]
      if (colors) {
        const root = document.documentElement
        root.style.setProperty('--accent', colors.accent)
        root.style.setProperty('--accent-dim', colors.dim)
        root.style.setProperty('--btn-primary', colors.btn)
        root.style.setProperty('--btn-primary-hover', colors.btnHover)
        root.style.setProperty('--focus-ring', colors.ring)
      }
    })
  } catch { /* no accent */ }
}

applyAccent()

function RoadmapApp() {
  return (
    <div
      data-theme={theme}
      className="flex flex-col h-screen-safe overflow-hidden font-mono pt-safe"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
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
