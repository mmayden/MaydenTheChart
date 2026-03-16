/**
 * ToastContainer — Renders active toast notifications (bottom-right, stacked).
 *
 * Drop this once in App.jsx:
 *   import { ToastContainer } from './components/ui/ToastContainer'
 *   <ToastContainer />
 *
 * Toasts slide in from the right and fade out on dismiss.
 * The container itself is pointer-events:none so clicks pass through gaps.
 */

import { useToast } from '../../store/useToastStore'

const BORDER_COLORS = {
  info:    'var(--color-info)',
  success: 'var(--color-bull)',
  warning: 'var(--color-warn)',
  error:   'var(--color-bear)',
}

export function ToastContainer() {
  const toasts = useToast((s) => s.toasts)
  const remove = useToast((s) => s.remove)

  return (
    <>
      {/* keyframes injected once */}
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes toast-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; transform: translateX(40%); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
          maxWidth: '360px',
          width: '100%',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: 'color-mix(in srgb, var(--bg-base, #171717) 92%, transparent)',
              borderLeft: `3px solid ${BORDER_COLORS[t.type] ?? BORDER_COLORS.info}`,
              borderRadius: '4px',
              padding: '0.5rem 0.75rem',
              fontFamily: 'monospace',
              fontSize: '11px',
              lineHeight: 1.4,
              color: 'var(--text-primary, #e5e5e5)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              animation: 'toast-slide-in 0.25s ease-out forwards',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #737373)',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
              }}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
