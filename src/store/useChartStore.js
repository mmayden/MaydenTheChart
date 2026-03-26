/**
 * Zustand store — single source of truth for all UI/client state.
 *
 * Server state (bars, quotes) lives in TanStack Query.
 * This store owns: timeframe, symbol, indicator toggles, and UI panel states.
 */

import { create } from 'zustand'
import { DEFAULT_SYMBOL, DEFAULT_TIMEFRAME, TIMEFRAME_CONFIG } from '../constants/chart'
import { ACCENT_LOOKUP } from '../constants/accents'
import { SYMBOL_RE } from '../constants/patterns'
import { log } from '../utils/logger'

// ─── Read URL params at module load (synchronous, before first render) ─────
// This ensures the store initializes with URL-specified values so queries
// don't fire with defaults before useURLState's useEffect runs.
const _urlTfLabelToKey = {}
Object.entries(TIMEFRAME_CONFIG).forEach(([key, cfg]) => {
  _urlTfLabelToKey[cfg.label.toLowerCase()] = key
})

function _readURLSymbol() {
  try {
    const s = new URLSearchParams(window.location.search).get('s')?.toUpperCase()
    if (s && SYMBOL_RE.test(s)) return s
  } catch { /* SSR / test env */ }
  try { return localStorage.getItem('lumpio-symbol') ?? DEFAULT_SYMBOL } catch { return DEFAULT_SYMBOL }
}

function _readURLTimeframe() {
  try {
    const tf = new URLSearchParams(window.location.search).get('tf')?.toLowerCase()
    if (tf && _urlTfLabelToKey[tf]) return _urlTfLabelToKey[tf]
  } catch { /* SSR / test env */ }
  return DEFAULT_TIMEFRAME
}

export const useChartStore = create((set) => ({
  // ─── Theme ─────────────────────────────────────────────────────────────────
  theme: (() => { try { return localStorage.getItem('lumpio-theme') ?? 'dark' } catch { return 'dark' } })(),
  setTheme: (theme) => {
    try { localStorage.setItem('lumpio-theme', theme) } catch { /* storage unavailable */ }
    // Clear accent overrides — each theme has its own default accent
    try {
      const root = document.documentElement
      root.style.removeProperty('--accent')
      root.style.removeProperty('--accent-dim')
      root.style.removeProperty('--btn-primary')
      root.style.removeProperty('--btn-primary-hover')
      root.style.removeProperty('--focus-ring')
    } catch { /* no DOM in test env */ }
    try { localStorage.removeItem('lumpio-accent') } catch { /* storage unavailable */ }
    set({ theme, accentId: null })
  },

  // ─── Accent color ─────────────────────────────────────────────────────────
  accentId: (() => { try { return localStorage.getItem('lumpio-accent') ?? null } catch { return null } })(),
  setAccentColor: (id, currentTheme) => {
    try { localStorage.setItem('lumpio-accent', id) } catch { /* storage unavailable */ }
    const colors = ACCENT_LOOKUP[currentTheme]?.[id]
    if (colors) {
      try {
        const root = document.documentElement
        root.style.setProperty('--accent', colors.accent)
        root.style.setProperty('--accent-dim', colors.dim)
        root.style.setProperty('--btn-primary', colors.btn)
        root.style.setProperty('--btn-primary-hover', colors.btnHover)
        root.style.setProperty('--focus-ring', colors.ring)
      } catch { /* no DOM in test env */ }
    }
    set({ accentId: id })
  },

  // ─── Selection ─────────────────────────────────────────────────────────────
  selectedSymbol: _readURLSymbol(),
  selectedTimeframe: _readURLTimeframe(),

  setSymbol: (symbol) => {
    try { localStorage.setItem('lumpio-symbol', symbol) } catch { /* storage unavailable */ }
    log.breadcrumb('navigation', 'Symbol changed', { symbol })
    set({ selectedSymbol: symbol })
  },
  setTimeframe: (timeframe) => {
    log.breadcrumb('navigation', 'Timeframe changed', { timeframe })
    set({ selectedTimeframe: timeframe })
  },

  // ─── Indicator toggles ─────────────────────────────────────────────────────
  indicators: {
    ema:       true,
    vwap:      true,
    rvol:      true,
    rsi:       true,
    macd:      true,
    levels:    true,   // prev day H/L, ODC, ORB
    sr:        true,   // support & resistance levels + swing markers
    bollinger: false,  // Bollinger Bands (off by default to avoid VWAP band overlap)
  },

  toggleIndicator: (key) =>
    set((state) => ({
      indicators: {
        ...state.indicators,
        [key]: !state.indicators[key],
      },
    })),

  /** Bulk-set all indicator toggles (used by preset system). */
  setIndicators: (indicators) => set({ indicators }),

  // ─── UI panel states ───────────────────────────────────────────────────────
  // Right panel: null | 'alerts' | 'backtest' | 'journal' | 'watchlist'
  activePanel:         null,
  settingsOpen:        false,
  commandPaletteOpen:  false,
  sidebarOpen:         (() => { try { return window.innerWidth >= 768 } catch { return true } })(),

  /** Toggle: same panel = close, different panel = switch. */
  setActivePanel:        (panel) => set((s) => ({ activePanel: s.activePanel === panel ? null : panel })),
  closePanel:            () => set({ activePanel: null }),
  setSettingsOpen:       (open) => set({ settingsOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarOpen:        (open) => set({ sidebarOpen: open }),
  toggleSidebar:         () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ─── Tour ────────────────────────────────────────────────────────────────
  tourActive: false,
  startTour: () => set({ tourActive: true }),
  endTour:   () => set({ tourActive: false }),

  // ─── Sound alerts ─────────────────────────────────────────────────────────
  soundAlerts: (() => { try { return localStorage.getItem('lumpio-sound-alerts') !== 'false' } catch { return true } })(),
  setSoundAlerts: (enabled) => {
    try { localStorage.setItem('lumpio-sound-alerts', String(enabled)) } catch { /* storage unavailable */ }
    set({ soundAlerts: enabled })
  },

  // ─── WebSocket state ───────────────────────────────────────────────────────
  wsStatus: 'disconnected', // 'connecting' | 'authenticated' | 'subscribed' | 'disconnected' | 'error'
  isMarketOpen: false,
  setWsStatus:   (status) => set({ wsStatus: status }),
  setMarketOpen: (open)   => set({ isMarketOpen: open }),

}))
