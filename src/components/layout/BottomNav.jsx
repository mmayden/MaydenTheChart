/**
 * BottomNav — Mobile-only bottom navigation bar.
 *
 * Layout:
 *   [☰ Sidebar] [1m 5m 15m 1h 4h 1D] [🔔 Alerts] [📋 Watchlist] [••• More]
 *
 * Hidden on md+ (desktop). Fixed to bottom with safe-area clearance.
 * Timeframe pills are horizontally scrollable. Panel toggles reuse store actions.
 */

import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChartStore } from '../../store/useChartStore'
import { usePresetsStore } from '../../store/usePresetsStore'
import { useAlertsStore } from '../../store/useAlertsStore'
import { TIMEFRAME_ORDER, TIMEFRAME_CONFIG } from '../../constants/chart'

const MORE_PANELS = [
  { id: 'backtest', label: 'Backtest' },
  { id: 'journal',  label: 'Journal' },
]

export function BottomNav() {
  const selectedTimeframe = useChartStore((s) => s.selectedTimeframe)
  const selectedSymbol    = useChartStore((s) => s.selectedSymbol)
  const setTimeframe      = useChartStore((s) => s.setTimeframe)
  const activePanel       = useChartStore((s) => s.activePanel)
  const setActivePanel    = useChartStore((s) => s.setActivePanel)
  const toggleSidebar     = useChartStore((s) => s.toggleSidebar)
  const markModified      = usePresetsStore((s) => s.markModified)
  const alerts            = useAlertsStore((s) => s.alerts)
  const activeCount       = alerts.filter((a) => !a.triggered).length
  const queryClient       = useQueryClient()

  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)

  // Close "more" popover on outside tap
  useEffect(() => {
    if (!moreOpen) return
    function handleTouch(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('pointerdown', handleTouch)
    return () => document.removeEventListener('pointerdown', handleTouch)
  }, [moreOpen])

  function handleTimeframe(tf) {
    setTimeframe(tf)
    markModified()
    queryClient.invalidateQueries({ queryKey: ['bars', selectedSymbol, tf] })
  }

  return (
    <nav
      className="bottom-nav md:hidden flex items-center gap-1 px-2 pl-safe pr-safe"
      aria-label="Mobile navigation"
    >
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center w-10 h-10 rounded shrink-0 touch-target"
        style={{ color: 'var(--nav-icon)' }}
        aria-label="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Timeframe pills — horizontally scrollable */}
      <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 px-1">
          {TIMEFRAME_ORDER.map((tf) => {
            const active = tf === selectedTimeframe
            return (
              <button
                key={tf}
                onClick={() => handleTimeframe(tf)}
                className={[
                  'px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md shrink-0 transition-colors touch-target',
                  active
                    ? 'text-accent bg-accent-dim border border-accent'
                    : 'text-theme-muted bg-transparent border border-transparent',
                ].join(' ')}
              >
                {TIMEFRAME_CONFIG[tf].label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Alerts bell */}
      <button
        onClick={() => setActivePanel('alerts')}
        className="relative flex items-center justify-center w-10 h-10 rounded shrink-0 touch-target"
        style={{
          color: 'var(--alert-color)',
          backgroundColor: activePanel === 'alerts' ? 'var(--alert-active-bg)' : undefined,
        }}
        aria-label={`Alerts${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
        aria-pressed={activePanel === 'alerts'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {activeCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-badge text-[8px] font-bold text-white leading-none">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </button>

      {/* Watchlist */}
      <button
        onClick={() => setActivePanel('watchlist')}
        className="flex items-center justify-center w-10 h-10 rounded shrink-0 touch-target"
        style={{
          color: 'var(--watchlist-color)',
          backgroundColor: activePanel === 'watchlist' ? 'var(--watchlist-active-bg)' : undefined,
        }}
        aria-label="Watchlist"
        aria-pressed={activePanel === 'watchlist'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>

      {/* More (Backtest + Journal) */}
      <div className="relative" ref={moreRef}>
        <button
          onClick={() => setMoreOpen((o) => !o)}
          className="flex items-center justify-center w-10 h-10 rounded shrink-0 touch-target"
          style={{ color: 'var(--nav-icon)' }}
          aria-label="More panels"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {moreOpen && (
          <div
            className="absolute bottom-full right-0 mb-2 w-36 rounded-lg border border-theme-mid shadow-xl py-1 z-50"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            {MORE_PANELS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setActivePanel(id); setMoreOpen(false) }}
                className={[
                  'flex items-center gap-2 w-full px-3 py-2.5 text-xs font-mono transition-colors text-left touch-target',
                  activePanel === id ? 'text-accent bg-accent-dim' : 'text-theme hover:bg-theme-hover',
                ].join(' ')}
                style={activePanel === id ? undefined : { color: `var(--${id}-color)` }}
              >
                {label}
              </button>
            ))}
            {/* Roadmap — separate page */}
            <a
              href="/roadmap"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-mono text-theme-muted hover:text-theme hover:bg-theme-hover transition-colors text-left touch-target"
            >
              Roadmap
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}
