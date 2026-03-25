/**
 * BottomNav — Mobile-only bottom navigation bar.
 *
 * Layout:
 *   [☰ Sidebar] [5m ▾] [🔔 Alerts] [📋 Watchlist] [📊 Backtest] [📓 Journal]
 *
 * Hidden on md+ (desktop). Fixed to bottom with safe-area clearance.
 * Timeframe is a single dropdown button. All panels are direct buttons (no "more" menu).
 */

import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChartStore } from '../../store/useChartStore'
import { usePresetsStore } from '../../store/usePresetsStore'
import { useAlertsStore } from '../../store/useAlertsStore'
import { TIMEFRAME_ORDER, TIMEFRAME_CONFIG } from '../../constants/chart'

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

  const [tfOpen, setTfOpen] = useState(false)
  const tfRef = useRef(null)

  // Close timeframe popover on outside tap
  useEffect(() => {
    if (!tfOpen) return
    function handleTouch(e) {
      if (tfRef.current && !tfRef.current.contains(e.target)) setTfOpen(false)
    }
    document.addEventListener('pointerdown', handleTouch)
    return () => document.removeEventListener('pointerdown', handleTouch)
  }, [tfOpen])

  function handleTimeframe(tf) {
    setTimeframe(tf)
    markModified()
    queryClient.invalidateQueries({ queryKey: ['bars', selectedSymbol, tf] })
    setTfOpen(false)
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

      {/* Timeframe dropdown */}
      <div className="relative" ref={tfRef}>
        <button
          onClick={() => setTfOpen((o) => !o)}
          className={[
            'flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md shrink-0 transition-colors touch-target',
            'text-accent bg-accent-dim border border-accent',
          ].join(' ')}
          aria-label={`Timeframe: ${TIMEFRAME_CONFIG[selectedTimeframe].label}`}
          aria-expanded={tfOpen}
        >
          {TIMEFRAME_CONFIG[selectedTimeframe].label}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform ${tfOpen ? 'rotate-180' : ''}`}>
            <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {tfOpen && (
          <div
            className="absolute bottom-full left-0 mb-2 rounded-lg border border-theme-mid shadow-xl py-1 z-50"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            {TIMEFRAME_ORDER.map((tf) => {
              const active = tf === selectedTimeframe
              return (
                <button
                  key={tf}
                  onClick={() => handleTimeframe(tf)}
                  className={[
                    'flex items-center w-full px-4 py-2.5 text-xs font-mono font-semibold transition-colors text-left touch-target whitespace-nowrap',
                    active
                      ? 'text-accent bg-accent-dim'
                      : 'text-theme hover:bg-theme-hover',
                  ].join(' ')}
                >
                  {TIMEFRAME_CONFIG[tf].label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

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

      {/* Backtest */}
      <button
        onClick={() => setActivePanel('backtest')}
        className="flex items-center justify-center w-10 h-10 rounded shrink-0 touch-target"
        style={{
          color: 'var(--backtest-color)',
          backgroundColor: activePanel === 'backtest' ? 'var(--backtest-active-bg)' : undefined,
        }}
        aria-label="Backtest"
        aria-pressed={activePanel === 'backtest'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </button>

      {/* Journal */}
      <button
        onClick={() => setActivePanel('journal')}
        className="flex items-center justify-center w-10 h-10 rounded shrink-0 touch-target"
        style={{
          color: 'var(--journal-color)',
          backgroundColor: activePanel === 'journal' ? 'var(--journal-active-bg)' : undefined,
        }}
        aria-label="Journal"
        aria-pressed={activePanel === 'journal'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      </button>
    </nav>
  )
}
