/**
 * SettingsModal — Full settings panel opened by the gear icon.
 *
 * Tabs:
 *   Appearance  — Color scheme selection (Default / Lumpio / Terminal)
 *   Shortcuts   — Keyboard shortcut reference
 */

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react' // eslint-disable-line no-unused-vars -- motion used as JSX namespace (motion.div)
import { useChartStore } from '../../store/useChartStore'
import { ACCENT_PRESETS } from '../../constants/accents'

// ── Theme schemes ───────────────────────────────────────────────────────────
// Preview colors are hardcoded hex values — they show what each theme looks like

const SCHEMES = [
  {
    id: 'dark',
    name: 'Default',
    description: 'Terminal black — easy on the eyes in low light',
    preview: {
      bg:      '#0a0a0a',
      surface: '#0d1117',
      border:  '#1f2937',
      text:    '#f3f4f6',
      muted:   '#6b7280',
      accent:  '#60a5fa',
    },
  },
  {
    id: 'lumpio',
    name: 'Lumpio',
    description: 'Dark espresso & gold — rich, warm, earthy',
    preview: {
      bg:      '#080808',
      surface: '#0E0C0A',
      border:  '#2A1C10',
      text:    '#D0C8B8',
      muted:   '#9A8870',
      accent:  '#C85818',
    },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Sage green on deep black — easy on the eyes',
    preview: {
      bg:      '#060806',
      surface: '#0a100a',
      border:  '#1a2e1a',
      text:    '#a8d8a8',
      muted:   '#4a7a4a',
      accent:  '#50d050',
    },
  },
]

// ── Keyboard shortcuts ──────────────────────────────────────────────────────

const SHORTCUTS = [
  { category: 'Navigation', items: [
    { keys: ['⌘', 'K'],     label: 'Open command palette' },
    { keys: ['Esc'],         label: 'Close panel / modal' },
  ]},
  { category: 'Timeframes', items: [
    { keys: ['1'],  label: '1-minute chart' },
    { keys: ['2'],  label: '5-minute chart' },
    { keys: ['3'],  label: '15-minute chart' },
    { keys: ['4'],  label: '1-hour chart' },
    { keys: ['5'],  label: '4-hour chart' },
    { keys: ['6'],  label: 'Daily chart' },
  ]},
  { category: 'Presets', items: [
    { keys: ['['],  label: 'Previous preset' },
    { keys: [']'],  label: 'Next preset' },
  ]},
  { category: 'Panels', items: [
    { keys: ['A'],  label: 'Toggle Alerts panel' },
    { keys: ['B'],  label: 'Toggle Backtest panel' },
    { keys: ['J'],  label: 'Toggle Journal panel' },
    { keys: ['W'],  label: 'Toggle Watchlist panel' },
  ]},
  { category: 'Actions', items: [
    { keys: ['⌘', '⇧', 'S'],  label: 'Chart snapshot (copy / download)' },
  ]},
]

// ── Sub-components ──────────────────────────────────────────────────────────

function SchemeCard({ scheme, active, onSelect }) {
  const p = scheme.preview
  return (
    <button
      onClick={() => onSelect(scheme.id)}
      className="w-full text-left outline-none cursor-pointer"
      style={{
        background: p.bg,
        border: `2px solid ${active ? p.accent : p.border}`,
        borderRadius: 10,
        padding: 16,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: active ? `0 0 0 3px ${p.accent}44` : 'none',
      }}
    >
      {/* Mini UI preview — uses hardcoded theme preview hex values */}
      <div className="flex gap-1.5 mb-3" style={{ height: 52 }}>
        <div className="shrink-0" style={{ width: 28, borderRadius: 4, background: p.surface, border: `1px solid ${p.border}` }} />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRadius: 4, border: `1px solid ${p.border}` }}>
          <div className="flex items-center gap-0.5" style={{ height: 12, background: p.surface, borderBottom: `1px solid ${p.border}`, paddingLeft: 6 }}>
            <div style={{ width: 16, height: 4, borderRadius: 2, background: p.accent }} />
            <div style={{ width: 10, height: 4, borderRadius: 2, background: p.muted }} />
          </div>
          <div className="flex-1 flex items-center justify-center" style={{ background: '#0a0a0a' }}>
            <div className="flex items-end gap-0.5" style={{ height: 20 }}>
              {[14, 18, 12, 22, 16, 20, 10, 24, 18].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: i % 3 === 0 ? '#ef4444' : '#22c55e', opacity: 0.8 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between items-start">
        <div>
          <div style={{ fontFamily: "'Boogaloo', cursive", fontSize: 16, color: p.accent, marginBottom: 2 }}>
            {scheme.name}
          </div>
          <div style={{ fontSize: 11, color: p.muted, fontFamily: 'monospace', lineHeight: 1.4 }}>
            {scheme.description}
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center" style={{
          width: 18, height: 18, borderRadius: '50%', marginTop: 2,
          background: active ? p.accent : 'transparent',
          border: `2px solid ${active ? p.accent : p.muted}`,
        }}>
          {active && (
            <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
              <polyline points="1,4 4,7 9,1" stroke={p.bg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}

const TABS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'shortcuts',  label: 'Shortcuts' },
]

// ── Main component ──────────────────────────────────────────────────────────

export function SettingsModal({ onClose }) {
  const theme          = useChartStore((s) => s.theme)
  const setTheme       = useChartStore((s) => s.setTheme)
  const accentId       = useChartStore((s) => s.accentId)
  const setAccentColor = useChartStore((s) => s.setAccentColor)
  const soundAlerts    = useChartStore((s) => s.soundAlerts)
  const setSoundAlerts = useChartStore((s) => s.setSoundAlerts)
  const [activeTab, setActiveTab] = useState('appearance')
  const prefersReduced = useReducedMotion()

  const motionDuration = prefersReduced ? 0 : 0.2

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const accentPresets = ACCENT_PRESETS[theme] ?? ACCENT_PRESETS.dark

  return (
    /* Backdrop */
    <motion.div
      onClick={onClose}
      className="settings-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: motionDuration }}
    >
      {/* Modal card */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
        data-theme={theme}
        className="settings-card"
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ duration: motionDuration, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="text-[17px] font-bold tracking-wide">Settings</div>
          <button onClick={onClose} className="settings-close-btn">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 pt-3 border-b border-theme">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="settings-tab-btn"
              data-active={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Appearance tab */}
          {activeTab === 'appearance' && (
            <div>
              <div className="settings-section-label mb-3.5">
                Color Scheme
              </div>
              <div className="grid grid-cols-3 gap-3">
                {SCHEMES.map((s) => (
                  <SchemeCard
                    key={s.id}
                    scheme={s}
                    active={theme === s.id}
                    onSelect={setTheme}
                  />
                ))}
              </div>

              {/* Accent color picker */}
              <div className="mt-6">
                <div className="settings-section-label mb-2.5">
                  Accent Color
                </div>
                <div className="flex gap-2 flex-wrap">
                  {accentPresets.map((preset) => {
                    const isActive = accentId === preset.id || (!accentId && preset.id === accentPresets[0].id)
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setAccentColor(preset.id, theme)}
                        title={preset.id}
                        className="border-none cursor-pointer rounded-full"
                        style={{
                          width: 32, height: 32,
                          background: preset.color,
                          outline: isActive ? `2px solid ${preset.color}` : '2px solid transparent',
                          outlineOffset: 3,
                          transition: 'outline-color 0.15s, transform 0.15s',
                          transform: isActive ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Sound alerts toggle */}
              <div className="mt-6">
                <div className="settings-section-label mb-2.5">
                  Alerts
                </div>
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div>
                    <div className="text-xs text-theme">Sound alerts</div>
                    <div className="text-[10px] text-theme-muted mt-0.5">Play a subtle ping when alerts trigger</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Shortcuts tab */}
          {activeTab === 'shortcuts' && (
            <div className="flex flex-col gap-6">
              {SHORTCUTS.map((group) => (
                <div key={group.category}>
                  <div className="settings-section-label mb-2.5">
                    {group.category}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {group.items.map((item, i) => (
                      <div key={i} className="settings-shortcut-row">
                        <span className="text-xs text-theme">{item.label}</span>
                        <div className="flex gap-1">
                          {item.keys.map((key, j) => (
                            <kbd key={j} className="settings-kbd">
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  )
}
