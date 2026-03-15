/**
 * useAlertsStore — Zustand store for all alert types.
 *
 * Alert shapes:
 *   Price Level:    { id, type:'price',          price, condition:'above'|'below',       triggered }
 *   Candle Streak:  { id, type:'candle-streak',  count, direction:'green'|'red'|'either', triggered }
 *
 * Also stores live market context (currentPrice, currentStreak) so the
 * AlertsPanel can display them without needing direct access to bar data.
 */

import { create } from 'zustand'

export const useAlertsStore = create((set) => ({
  alerts: [],

  // ─── Live market context (updated by useAlertChecker) ─────────────────────
  currentPrice:  null,
  currentStreak: { count: 0, direction: null },
  barsLength:    0,

  setCurrentPrice:  (price)  => set({ currentPrice: price }),
  setCurrentStreak: (streak) => set({ currentStreak: streak }),
  setBarsLength:    (len)    => set({ barsLength: len }),

  // ─── Alert CRUD ───────────────────────────────────────────────────────────
  // alertData = everything except id + triggered
  addAlert: (alertData) =>
    set((state) => ({
      alerts: [...state.alerts, {
        id: crypto.randomUUID(),
        triggered: false,
        ...alertData,
      }],
    })),

  removeAlert: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

  markTriggered: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, triggered: true } : a)),
    })),
}))
