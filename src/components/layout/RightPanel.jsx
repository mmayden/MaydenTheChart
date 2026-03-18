/**
 * RightPanel — Generic slide-out panel container (right side of chart).
 *
 * Renders the active panel content based on useChartStore.activePanel.
 * Only one panel open at a time. On mobile (<768px), becomes full-screen overlay.
 * Panel components are lazy-loaded for code splitting.
 *
 * Layout approach: persistent wrapper div always in DOM for smooth width
 * transitions (chart resizes seamlessly). Content inside uses AnimatePresence
 * for fade transitions when switching between panels.
 *
 * Panel values: null | 'alerts' | 'backtest' | 'journal' | 'watchlist'
 */

import { lazy, Suspense } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react' // eslint-disable-line no-unused-vars -- motion used as JSX namespace
import { useChartStore } from '../../store/useChartStore'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { BottomSheet } from '../ui/BottomSheet'

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
    <div className="flex flex-col gap-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded skeleton-shimmer shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 rounded skeleton-shimmer" style={{ width: `${70 + (i % 3) * 10}%` }} />
            <div className="h-2.5 rounded skeleton-shimmer" style={{ width: `${40 + (i % 4) * 12}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RightPanel() {
  const activePanel = useChartStore((s) => s.activePanel)
  const closePanel  = useChartStore((s) => s.closePanel)
  const prefersReduced = useReducedMotion()
  const isMobile = useIsMobile()

  const isOpen = activePanel !== null
  const panel  = activePanel ? PANELS[activePanel] : null

  // Mobile: render panel content inside a bottom sheet
  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={closePanel}>
        {isOpen && panel && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme shrink-0">
              <span className="text-sm font-bold tracking-wide">{panel.title}</span>
              <button
                onClick={closePanel}
                className="text-theme-muted hover:text-theme transition-colors text-lg leading-none touch-target"
              >
                ×
              </button>
            </div>
            {/* Panel content */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-safe">
              <Suspense fallback={<PanelSkeleton />}>
                <panel.Component />
              </Suspense>
            </div>
          </>
        )}
      </BottomSheet>
    )
  }

  // Desktop: side panel with width transition
  return (
    <>
      {/* Panel wrapper — always in DOM so width transitions are seamless. */}
      <div
        className={[
          'shrink-0 overflow-hidden relative',
          prefersReduced
            ? ''
            : 'transition-[width,min-width] duration-300 ease-out',
          isOpen
            ? 'w-[340px] min-w-[340px]'
            : 'w-0 min-w-0 pointer-events-none',
        ].join(' ')}
        style={{ backgroundColor: isOpen ? 'var(--bg-surface)' : 'transparent' }}
      >
        <AnimatePresence mode="wait">
          {isOpen && panel && (
            <motion.div
              key={activePanel}
              className="flex flex-col h-full border-l border-theme w-[340px]"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReduced ? undefined : { opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.15 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
