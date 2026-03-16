/**
 * SettingsModal — Full settings panel opened by the gear icon.
 *
 * Tabs:
 *   Appearance  — Color scheme selection (Default / Lumpia / Terminal)
 *   Shortcuts   — Keyboard shortcut reference
 */

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react' // eslint-disable-line no-unused-vars -- motion used as JSX namespace (motion.div)
import { useChartStore } from '../../store/useChartStore'
import { ACCENT_PRESETS } from '../../constants/accents'

// ── Theme schemes ───────────────────────────────────────────────────────────

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
    id: 'lumpia',
    name: 'Lumpia',
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
      style={{
        background: p.bg,
        border: `2px solid ${active ? p.accent : p.border}`,
        borderRadius: 10,
        padding: '16px',
        cursor: 'pointer',
        outline: 'none',
        width: '100%',
        textAlign: 'left',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: active ? `0 0 0 3px ${p.accent}44` : 'none',
      }}
    >
      {/* Mini UI preview */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, height: 52 }}>
        <div style={{ width: 28, borderRadius: 4, background: p.surface, border: `1px solid ${p.border}`, flexShrink: 0 }} />
        <div style={{ flex: 1, borderRadius: 4, border: `1px solid ${p.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 12, background: p.surface, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', paddingLeft: 6, gap: 3 }}>
            <div style={{ width: 16, height: 4, borderRadius: 2, background: p.accent }} />
            <div style={{ width: 10, height: 4, borderRadius: 2, background: p.muted }} />
          </div>
          <div style={{ flex: 1, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 20 }}>
              {[14, 18, 12, 22, 16, 20, 10, 24, 18].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: i % 3 === 0 ? '#ef4444' : '#22c55e', opacity: 0.8 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'Boogaloo', cursive", fontSize: 16, color: p.accent, marginBottom: 2 }}>
            {scheme.name}
          </div>
          <div style={{ fontSize: 11, color: p.muted, fontFamily: 'monospace', lineHeight: 1.4 }}>
            {scheme.description}
          </div>
        </div>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: active ? p.accent : 'transparent',
          border: `2px solid ${active ? p.accent : p.muted}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
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
        style={{
          width: 680,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          borderRadius: 14,
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          fontFamily: 'monospace',
        }}
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ duration: motionDuration, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.04em' }}>Settings</div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 20, lineHeight: 1,
              padding: '4px 6px', borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, padding: '12px 24px 0', borderBottom: '1px solid var(--border)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.04em',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                fontFamily: 'monospace',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* Appearance tab */}
          {activeTab === 'appearance' && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                Color Scheme
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
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
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Accent Color
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {accentPresets.map((preset) => {
                    const isActive = accentId === preset.id || (!accentId && preset.id === accentPresets[0].id)
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setAccentColor(preset.id, theme)}
                        title={preset.id}
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: preset.color, border: 'none', cursor: 'pointer',
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
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Alerts
                </div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>Sound alerts</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Play a subtle ping when alerts trigger</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Shortcuts tab */}
          {activeTab === 'shortcuts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {SHORTCUTS.map((group) => (
                <div key={group.category}>
                  <div style={{
                    fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', marginBottom: 10,
                  }}>
                    {group.category}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                      }}>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{item.label}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {item.keys.map((key, j) => (
                            <kbd key={j} style={{
                              fontSize: 11, fontFamily: 'monospace',
                              padding: '2px 8px', borderRadius: 4,
                              background: 'var(--border)', color: 'var(--text-primary)',
                              border: '1px solid var(--border-mid, var(--border))',
                              minWidth: 24, textAlign: 'center',
                            }}>
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
