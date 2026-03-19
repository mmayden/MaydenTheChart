/**
 * Zustand store for Trade Replay mode.
 *
 * Manages replay state: date selection, bar-by-bar stepping, speed control,
 * simulated paper trades, and running P&L.
 *
 * When isReplaying is true, App.jsx passes getVisibleBars() to the chart
 * instead of live bars, and disables live feed / infinite scroll.
 */

import { create } from 'zustand'
import { log } from '../utils/logger'

export const useReplayStore = create((set, get) => ({
  // ─── Replay state ────────────────────────────────────────────────────────
  isReplaying:     false,
  replayBars:      [],        // full set of bars for the replay session
  currentStep:     0,         // index into replayBars (0 = first bar visible)
  speed:           1,         // playback speed: 1x, 2x, 5x, 10x
  isPlaying:       false,     // auto-advance active

  // ─── Simulated trades ────────────────────────────────────────────────────
  trades:          [],        // completed: { type, entryPrice, entryStep, exitPrice, exitStep, pnlPct }
  openPosition:    null,      // current open: { type, entryPrice, entryStep } | null

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Start a replay with pre-fetched bars.
   * @param {Object[]} bars - Full day's bars (sorted oldest→newest)
   */
  startReplay: (bars) => {
    if (!bars?.length) return
    log.info('Replay', `Starting replay with ${bars.length} bars`)
    set({
      isReplaying: true,
      replayBars:  bars,
      currentStep: 0,
      speed:       1,
      isPlaying:   false,
      trades:      [],
      openPosition: null,
    })
  },

  stopReplay: () => {
    log.info('Replay', 'Stopped replay')
    set({
      isReplaying: false,
      replayBars:  [],
      currentStep: 0,
      isPlaying:   false,
      trades:      [],
      openPosition: null,
    })
  },

  stepForward: () => {
    const { currentStep, replayBars } = get()
    if (currentStep < replayBars.length - 1) {
      set({ currentStep: currentStep + 1 })
    } else {
      // Reached end — stop auto-play
      set({ isPlaying: false })
    }
  },

  stepBack: () => {
    const { currentStep } = get()
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 })
    }
  },

  jumpToStart: () => set({ currentStep: 0 }),

  jumpToEnd: () => {
    const { replayBars } = get()
    set({ currentStep: Math.max(0, replayBars.length - 1), isPlaying: false })
  },

  setSpeed: (speed) => set({ speed }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  // ─── Trading ─────────────────────────────────────────────────────────────

  placeBuy: () => {
    const { openPosition, currentStep, replayBars } = get()
    if (openPosition) return // already in a position
    const bar = replayBars[currentStep]
    if (!bar) return

    log.info('Replay', `BUY at $${bar.close.toFixed(2)} (step ${currentStep})`)
    set({
      openPosition: { type: 'long', entryPrice: bar.close, entryStep: currentStep },
    })
  },

  placeSell: () => {
    const { openPosition, currentStep, replayBars, trades } = get()
    if (!openPosition) return // no position to close
    const bar = replayBars[currentStep]
    if (!bar) return

    const exitPrice = bar.close
    const pnlPct = ((exitPrice - openPosition.entryPrice) / openPosition.entryPrice) * 100

    log.info('Replay', `SELL at $${exitPrice.toFixed(2)} (P&L: ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`)
    set({
      openPosition: null,
      trades: [
        ...trades,
        {
          type:       'long',
          entryPrice: openPosition.entryPrice,
          entryStep:  openPosition.entryStep,
          exitPrice,
          exitStep:   currentStep,
          pnlPct,
        },
      ],
    })
  },

  // ─── Computed getters ────────────────────────────────────────────────────

  /** Bars visible up to current step (for chart rendering). */
  getVisibleBars: () => {
    const { replayBars, currentStep } = get()
    return replayBars.slice(0, currentStep + 1)
  },

  /** Running P&L: sum of closed + unrealized on open. */
  getRunningPnL: () => {
    const { trades, openPosition, currentStep, replayBars } = get()
    let total = trades.reduce((sum, t) => sum + t.pnlPct, 0)

    if (openPosition && replayBars[currentStep]) {
      const currentPrice = replayBars[currentStep].close
      const unrealized = ((currentPrice - openPosition.entryPrice) / openPosition.entryPrice) * 100
      total += unrealized
    }

    return Math.round(total * 100) / 100
  },

  /** Trade stats summary. */
  getStats: () => {
    const { trades } = get()
    if (!trades.length) return { count: 0, wins: 0, winRate: 0, totalPnl: 0 }

    const wins = trades.filter((t) => t.pnlPct > 0).length
    const totalPnl = trades.reduce((sum, t) => sum + t.pnlPct, 0)

    return {
      count:    trades.length,
      wins,
      winRate:  Math.round((wins / trades.length) * 100),
      totalPnl: Math.round(totalPnl * 100) / 100,
    }
  },
}))
