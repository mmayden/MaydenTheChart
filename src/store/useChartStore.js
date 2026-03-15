/**
 * Zustand store — single source of truth for all UI/client state.
 *
 * Server state (bars, quotes) lives in TanStack Query.
 * This store owns: timeframe, symbol, indicator toggles, and UI panel states.
 */

import { create } from 'zustand'
import { DEFAULT_SYMBOL, DEFAULT_TIMEFRAME } from '../constants/chart'

export const useChartStore = create((set) => ({
  // ─── Theme ─────────────────────────────────────────────────────────────────
  theme: (() => { try { return localStorage.getItem('lumpia-theme') ?? 'dark' } catch { return 'dark' } })(),
  setTheme: (theme) => {
    try { localStorage.setItem('lumpia-theme', theme) } catch { /* storage unavailable */ }
    set({ theme })
  },

  // ─── Selection ─────────────────────────────────────────────────────────────
  selectedSymbol: (() => { try { return localStorage.getItem('cheechart-symbol') ?? DEFAULT_SYMBOL } catch { return DEFAULT_SYMBOL } })(),
  selectedTimeframe: DEFAULT_TIMEFRAME,

  setSymbol: (symbol) => {
    try { localStorage.setItem('cheechart-symbol', symbol) } catch { /* storage unavailable */ }
    set({ selectedSymbol: symbol })
  },
  setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

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

  // ─── Sound alerts ─────────────────────────────────────────────────────────
  soundAlerts: (() => { try { return localStorage.getItem('lumpia-sound-alerts') !== 'false' } catch { return true } })(),
  setSoundAlerts: (enabled) => {
    try { localStorage.setItem('lumpia-sound-alerts', String(enabled)) } catch { /* storage unavailable */ }
    set({ soundAlerts: enabled })
  },

  // ─── WebSocket state ───────────────────────────────────────────────────────
  wsStatus: 'disconnected', // 'connecting' | 'authenticated' | 'subscribed' | 'disconnected' | 'error'
  isMarketOpen: false,
  setWsStatus:   (status) => set({ wsStatus: status }),
  setMarketOpen: (open)   => set({ isMarketOpen: open }),

}))
