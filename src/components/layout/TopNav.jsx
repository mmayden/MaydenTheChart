/**
 * TopNav — Shared top navigation bar across all views.
 *
 * Layout:
 *   [☰ mobile] [Logo] [Chart] [Dashboard]  --- spacer ---  [⌘K search] [🔔 Bell] [⚙ Settings]
 */

import { useLocation, useNavigate } from 'react-router-dom'
import Logo from '../ui/Logo'
import { useChartStore } from '../../store/useChartStore'
import { useAlertsStore } from '../../store/useAlertsStore'

const NAV_ITEMS = [
  { path: '/',          label: 'Chart' },
  { path: '/dashboard', label: 'Dashboard' },
]

export function TopNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const toggleAlertsPanel     = useChartStore((s) => s.toggleAlertsPanel)
  const alertsPanelOpen       = useChartStore((s) => s.alertsPanelOpen)
  const setSettingsOpen       = useChartStore((s) => s.setSettingsOpen)
  const setCommandPaletteOpen = useChartStore((s) => s.setCommandPaletteOpen)
  const toggleSidebar         = useChartStore((s) => s.toggleSidebar)

  const alerts      = useAlertsStore((s) => s.alerts)
  const activeCount = alerts.filter((a) => !a.triggered).length

  const isChart = location.pathname === '/'

  return (
    <nav
      className="flex items-center gap-2 px-3 h-11 border-b border-gray-800 shrink-0"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Mobile hamburger — only on chart view */}
      {isChart && (
        <button
          onClick={toggleSidebar}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
          title="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      <Logo />

      {/* Navigation tabs */}
      <div className="flex items-center gap-1 ml-3">
        {NAV_ITEMS.map(({ path, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                active
                  ? 'text-blue-400 bg-blue-950'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex-1" />

      {/* Command palette trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors text-xs"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="hidden md:inline">Search</span>
        <kbd className="text-[10px] bg-gray-800 px-1 rounded font-mono">⌘K</kbd>
      </button>

      {/* Alerts bell */}
      <button
        onClick={toggleAlertsPanel}
        className={`relative flex items-center justify-center w-8 h-8 rounded transition-colors ${
          alertsPanelOpen
            ? 'bg-yellow-500/10 text-yellow-300'
            : 'text-yellow-400 hover:bg-gray-800 hover:text-yellow-300'
        }`}
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

      {/* Settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
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
