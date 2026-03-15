/**
 * SettingsModal — Full settings panel opened by the gear icon.
 * Centered overlay with sections for app configuration.
 * Currently: Color Scheme selection.
 */

import { useEffect } from 'react'
import { useChartStore } from '../../store/useChartStore'

const SCHEMES = [
  {
    id: 'dark',
    name: 'Dark',
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
        {/* Sidebar strip */}
        <div style={{ width: 28, borderRadius: 4, background: p.surface, border: `1px solid ${p.border}`, flexShrink: 0 }} />
        {/* Main area */}
        <div style={{ flex: 1, borderRadius: 4, border: `1px solid ${p.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header bar */}
          <div style={{ height: 12, background: p.surface, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', paddingLeft: 6, gap: 3 }}>
            <div style={{ width: 16, height: 4, borderRadius: 2, background: p.accent }} />
            <div style={{ width: 10, height: 4, borderRadius: 2, background: p.muted }} />
          </div>
          {/* Chart area — always dark */}
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
        {/* Active indicator */}
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

export function SettingsModal({ onClose }) {
  const theme    = useChartStore((s) => s.theme)
  const setTheme = useChartStore((s) => s.setTheme)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      {/* Modal card */}
      <div
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
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.04em' }}>Settings</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Appearance</div>
          </div>
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

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* Color Scheme section */}
          <div style={{ marginBottom: 8 }}>
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
          </div>

        </div>
      </div>
    </div>
  )
}
