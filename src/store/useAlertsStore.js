/**
 * useAlertsStore — Zustand store for all alert types.
 *
 * Alert shapes:
 *   Price Level:    { id, type:'price',          price, condition:'above'|'below',       triggered }
 *   Candle Streak:  { id, type:'candle-streak',  count, direction:'green'|'red'|'either', triggered }
 */

import { create } from 'zustand'

export const useAlertsStore = create((set) => ({
  alerts: [],

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
