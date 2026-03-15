/**
 * TopNav — Shared top navigation bar.
 *
 * Layout:
 *   [☰ mobile] [Logo]  --- spacer ---  [panel toggles] [⌘K search] [⚙ Settings]
 *
 * Panel toggle icons replace the old Chart/Dashboard navigation tabs.
 */

import Logo from '../ui/Logo'
import { useChartStore } from '../../store/useChartStore'
import { useAlertsStore } from '../../store/useAlertsStore'

const PANEL_BUTTONS = [
  {
    id: 'watchlist',
    title: 'Watchlist',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'backtest',
    title: 'Backtest',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'journal',
    title: 'Journal',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
]

export function TopNav() {
  const activePanel          = useChartStore((s) => s.activePanel)
  const setActivePanel       = useChartStore((s) => s.setActivePanel)
  const setSettingsOpen      = useChartStore((s) => s.setSettingsOpen)
  const setCommandPaletteOpen = useChartStore((s) => s.setCommandPaletteOpen)
  const toggleSidebar        = useChartStore((s) => s.toggleSidebar)

  const alerts      = useAlertsStore((s) => s.alerts)
  const activeCount = alerts.filter((a) => !a.triggered).length

  return (
    <nav
      className="flex items-center gap-2 px-3 h-11 border-b border-theme shrink-0"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center w-8 h-8 rounded nav-icon hover:bg-theme-hover transition-colors touch-target"
        title="Toggle sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <Logo />

      <div className="flex-1" />

      {/* Panel toggle icons — order: Alerts, Watchlist, Backtest, Journal */}
      <div className="flex items-center gap-0.5">
        {/* Alerts bell (with badge) — first position */}
        <button
          onClick={() => setActivePanel('alerts')}
          className="relative flex items-center justify-center w-8 h-8 rounded transition-colors touch-target hover:bg-theme-hover"
          style={{
            color: 'var(--alert-color)',
            backgroundColor: activePanel === 'alerts' ? 'var(--alert-active-bg)' : undefined,
          }}
          title="Alerts"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {activeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">
              {activeCount > 9 ? '9+' : activeCount}
            </span>
          )}
        </button>

        {PANEL_BUTTONS.map(({ id, title, icon }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={`flex items-center justify-center w-8 h-8 rounded transition-colors touch-target ${
              activePanel === id
                ? 'text-accent'
                : 'nav-icon hover:bg-theme-hover'
            }`}
            style={activePanel === id ? { backgroundColor: 'var(--nav-active-bg)' } : undefined}
            title={title}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-theme-border mx-1" />

      {/* Command palette trigger */}
      <button
        data-tour="cmd-k"
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center justify-center w-7 h-7 rounded nav-icon hover:bg-theme-hover transition-colors touch-target"
        title="Search (⌘K)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {/* Settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="flex items-center justify-center w-7 h-7 rounded nav-icon hover:bg-theme-hover transition-colors touch-target"
        title="Settings"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </nav>
  )
}
