/**
 * useAlertChecker — Checks price and candle-streak alerts against live bar data.
 *
 * Extracted from NotificationBell to separate business logic from UI.
 * Fires browser notifications when alerts trigger.
 */

import { useEffect } from 'react'
import { useAlertsStore } from '../store/useAlertsStore'
import { useChartStore } from '../store/useChartStore'

function getStreak(bars) {
  if (!bars?.length) return { count: 0, direction: null }
  const last    = bars[bars.length - 1]
  const lastDir = last.close >= last.open ? 'green' : 'red'
  let count = 1
  for (let i = bars.length - 2; i >= 0; i--) {
    const dir = bars[i].close >= bars[i].open ? 'green' : 'red'
    if (dir === lastDir) count++
    else break
  }
  return { count, direction: lastDir }
}

function fireNotification(title, body) {
  const send = () => new Notification(title, { body })
  if (Notification.permission === 'granted') {
    send()
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((p) => { if (p === 'granted') send() })
  }
}

/**
 * Checks all active alerts against current bars. Call once in the component
 * that owns the bars data (NotificationBell).
 *
 * @param {Array} bars — current bar data
 * @param {string} timeframe — current timeframe label (for notification text)
 */
export function useAlertChecker(bars, timeframe) {
  const { alerts, markTriggered } = useAlertsStore()
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)
  const currentPrice   = bars?.[bars.length - 1]?.close ?? null

  // Check price alerts
  useEffect(() => {
    if (!currentPrice) return
    alerts.forEach((alert) => {
      if (alert.triggered || alert.type !== 'price') return
      const hit =
        (alert.condition === 'above' && currentPrice >= alert.price) ||
        (alert.condition === 'below' && currentPrice <= alert.price)
      if (!hit) return
      markTriggered(alert.id)
      fireNotification(
        'Lumpia — Price Alert',
        `${selectedSymbol} ${alert.condition === 'above' ? 'crossed above' : 'crossed below'} $${alert.price.toFixed(2)} · now $${currentPrice.toFixed(2)}`
      )
    })
  }, [currentPrice, alerts, markTriggered, selectedSymbol])

  // Check candle-streak alerts
  useEffect(() => {
    if (!bars?.length) return
    const streak = getStreak(bars)
    alerts.forEach((alert) => {
      if (alert.triggered || alert.type !== 'candle-streak') return
      if (bars.length <= alert.barsLengthAtCreation) return
      const dirMatch = alert.direction === 'either' || alert.direction === streak.direction
      if (dirMatch && streak.count >= alert.count) {
        markTriggered(alert.id)
        const dot = streak.direction === 'green' ? '🟢' : '🔴'
        fireNotification(
          'Lumpia — Candle Streak',
          `${streak.count} consecutive ${streak.direction} candles on ${timeframe ?? ''} ${dot}`
        )
      }
    })
  }, [bars, alerts, markTriggered, timeframe])

  return { currentPrice, getStreak }
}
