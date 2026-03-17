/**
 * WelcomeBanner — First-visit dismissible banner.
 *
 * Shows once for new visitors. Dismissed state persisted to localStorage.
 * "Free charting — unlimited indicators, no signup, no ads."
 */

import { useState } from 'react'

const LS_KEY = 'cheechart-welcome-dismissed'

function isDismissed() {
  try { return localStorage.getItem(LS_KEY) === '1' } catch { return false }
}

export function WelcomeBanner() {
  const [visible, setVisible] = useState(() => !isDismissed())

  if (!visible) return null

  function dismiss() {
    try { localStorage.setItem(LS_KEY, '1') } catch { /* storage unavailable */ }
    setVisible(false)
  }

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 text-xs font-mono border-b border-theme shrink-0"
      style={{ backgroundColor: 'var(--bg-surface)' }}
      role="banner"
    >
      <span className="text-theme">
        <span className="text-accent font-semibold">Cheechart</span>
        {' — Free charting with unlimited indicators, no signup, no ads.'}
      </span>
      <button
        onClick={dismiss}
        className="text-theme-muted hover:text-theme transition-colors px-1.5 py-0.5 rounded"
        aria-label="Dismiss welcome banner"
      >
        &times;
      </button>
    </div>
  )
}
