/**
 * Zustand store — single source of truth for all UI/client state.
 *
 * Server state (bars, quotes) lives in TanStack Query.
 * This store owns: timeframe, symbol, and which indicators are visible.
 */

import { create } from 'zustand'
import { DEFAULT_SYMBOL, DEFAULT_TIMEFRAME } from '../constants/chart'

export const useChartStore = create((set) => ({
  // ─── Theme ─────────────────────────────────────────────────────────────────
  theme: localStorage.getItem('lumpia-theme') ?? 'dark',
  setTheme: (theme) => {
    localStorage.setItem('lumpia-theme', theme)
    set({ theme })
  },


  // ─── Selection ─────────────────────────────────────────────────────────────
  selectedSymbol:    DEFAULT_SYMBOL,
  selectedTimeframe: DEFAULT_TIMEFRAME,

  setSymbol:    (symbol)    => set({ selectedSymbol: symbol }),
  setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

  // ─── Indicator toggles ─────────────────────────────────────────────────────
  indicators: {
    ema:    true,
    vwap:   true,
    rvol:   true,
    rsi:    true,
    macd:   true,
    levels: true,   // prev day H/L, ODC, ORB
    sr:     true,   // support & resistance levels + swing markers
  },

  toggleIndicator: (key) =>
    set((state) => ({
      indicators: {
        ...state.indicators,
        [key]: !state.indicators[key],
      },
    })),

  // ─── WebSocket state ───────────────────────────────────────────────────────
  wsStatus: 'disconnected', // 'connecting' | 'authenticated' | 'subscribed' | 'disconnected' | 'error'
  isMarketOpen: false,
  setWsStatus:   (status) => set({ wsStatus: status }),
  setMarketOpen: (open)   => set({ isMarketOpen: open }),

  // ─── UI panels ─────────────────────────────────────────────────────────────
  ui: {
    rsiPaneVisible:  true,
    macdPaneVisible: true,
  },

  togglePane: (key) =>
    set((state) => ({
      ui: {
        ...state.ui,
        [key]: !state.ui[key],
      },
    })),
}))
