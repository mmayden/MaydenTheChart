/**
 * App.jsx — Root layout and routing shell.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  TopNav: Logo | [Chart] [Dashboard] | ⌘K | 🔔 | ⚙         │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │                                                              │
 *   │   <Route> content (ChartView or DashboardView)              │
 *   │                                                              │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Shared overlays: SettingsModal, CommandPalette, AlertsPanel, ToastContainer.
 */

import { Routes, Route } from 'react-router-dom'
import { useChartStore } from './store/useChartStore'
import { useURLState } from './hooks/useURLState'

import { TopNav } from './components/layout/TopNav'
import { AlertsPanel } from './components/panels/AlertsPanel'
import { SettingsModal } from './components/ui/SettingsModal'
import { CommandPalette } from './components/ui/CommandPalette'
import { ToastContainer } from './components/ui/ToastContainer'
import { ChartView } from './views/ChartView'
import { DashboardView } from './views/DashboardView'

export default function App() {
  const theme        = useChartStore((s) => s.theme)
  const settingsOpen = useChartStore((s) => s.settingsOpen)
  const setSettingsOpen = useChartStore((s) => s.setSettingsOpen)

  // Sync URL params with store
  useURLState()

  return (
    <div
      data-theme={theme}
      className="flex flex-col h-screen overflow-hidden font-mono"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Shared overlays */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <CommandPalette />
      <AlertsPanel />
      <ToastContainer />

      {/* Top navigation */}
      <TopNav />

      {/* Route content */}
      <Routes>
        <Route path="/" element={<ChartView />} />
        <Route path="/dashboard" element={<DashboardView />} />
      </Routes>
    </div>
  )
}
