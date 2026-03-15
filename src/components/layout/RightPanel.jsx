/**
 * RightPanel — Generic slide-out panel container (right side of chart).
 *
 * Renders the active panel content based on useChartStore.activePanel.
 * Only one panel open at a time. On mobile (<768px), becomes full-screen overlay.
 * Panel components are lazy-loaded for code splitting.
 *
 * Panel values: null | 'alerts' | 'backtest' | 'journal' | 'watchlist'
 */

import { lazy, Suspense } from 'react'
import { useChartStore } from '../../store/useChartStore'

// Lazy-load panel components — only loaded when the user first opens them
const AlertsPanel    = lazy(() => import('../panels/AlertsPanel').then(m => ({ default: m.AlertsPanel })))
const BacktestPanel  = lazy(() => import('../panels/BacktestPanel').then(m => ({ default: m.BacktestPanel })))
const JournalPanel   = lazy(() => import('../panels/JournalPanel').then(m => ({ default: m.JournalPanel })))
const WatchlistPanel = lazy(() => import('../panels/WatchlistPanel').then(m => ({ default: m.WatchlistPanel })))

const PANELS = {
  alerts:    { title: 'Alerts',    Component: AlertsPanel },
  backtest:  { title: 'Backtest',  Component: BacktestPanel },
  journal:   { title: 'Journal',   Component: JournalPanel },
  watchlist: { title: 'Watchlist', Component: WatchlistPanel },
}

function PanelSkeleton() {
  return (
    <div className="flex items-center justify-center h-32">
      <div
        className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
      />
    </div>
  )
}

export function RightPanel() {
  const activePanel = useChartStore((s) => s.activePanel)
  const closePanel  = useChartStore((s) => s.closePanel)

  const isOpen = activePanel !== null
  const panel  = activePanel ? PANELS[activePanel] : null

  return (
    <>
      {/* Backdrop (mobile full-screen, desktop subtle) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[45] md:hidden"
          onClick={closePanel}
        />
      )}

      {/* Panel container */}
      <div
        className={`
          fixed top-0 right-0 h-full z-50
          md:relative md:z-auto md:top-auto md:right-auto md:h-auto
          transition-all duration-300 ease-out
          ${isOpen
            ? 'translate-x-0 w-full md:w-[340px] md:min-w-[340px]'
            : 'translate-x-full md:translate-x-0 w-0 md:w-0 md:min-w-0'
          }
        `}
        style={{ backgroundColor: isOpen ? 'var(--bg-surface)' : 'transparent' }}
      >
        {isOpen && panel && (
          <div className="flex flex-col h-full border-l border-theme w-full md:w-[340px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
              <span className="text-sm font-bold tracking-wide">{panel.title}</span>
              <button
                onClick={closePanel}
                className="text-theme-muted hover:text-theme transition-colors text-lg leading-none touch-target"
              >
                ×
              </button>
            </div>

            {/* Panel content (lazy-loaded with Suspense) */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <Suspense fallback={<PanelSkeleton />}>
                <panel.Component />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
