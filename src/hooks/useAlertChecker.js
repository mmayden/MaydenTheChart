/**
 * useAlertChecker — Checks price and candle-streak alerts against live bar data.
 *
 * Extracted from NotificationBell to separate business logic from UI.
 * Fires browser notifications when alerts trigger.
 * Updates alertsStore with currentPrice and currentStreak so the
 * AlertsPanel can display live data without needing bars directly.
 */

import { useEffect } from 'react'
import { useAlertsStore } from '../store/useAlertsStore'
import { useChartStore } from '../store/useChartStore'
import { ALERT_SOUND_FREQ, ALERT_SOUND_DURATION } from '../constants/chart'

export function getStreak(bars) {
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

/** Play a subtle ping via Web Audio API (no audio file needed). */
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = ALERT_SOUND_FREQ
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ALERT_SOUND_DURATION)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + ALERT_SOUND_DURATION)
  } catch { /* audio unavailable */ }
}

function fireNotification(title, body) {
  // Guard: Notification API may be unavailable (some mobile browsers, iframes)
  if (typeof Notification === 'undefined') return

  const send = () => new Notification(title, { body })
  if (Notification.permission === 'granted') {
    send()
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((p) => { if (p === 'granted') send() })
  }

  // Play sound if enabled
  const soundEnabled = useChartStore.getState().soundAlerts
  if (soundEnabled) playAlertSound()
}

/**
 * Checks all active alerts against current bars. Call once in the component
 * that owns the bars data (App.jsx).
 *
 * @param {Array} bars — current bar data
 * @param {string} timeframe — current timeframe label (for notification text)
 */
export function useAlertChecker(bars, timeframe) {
  const { alerts, markTriggered, setCurrentPrice, setCurrentStreak, setBarsLength } = useAlertsStore()
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)
  const currentPrice   = bars?.[bars.length - 1]?.close ?? null

  // Push live context into the store for AlertsPanel
  useEffect(() => {
    setCurrentPrice(currentPrice)
  }, [currentPrice, setCurrentPrice])

  useEffect(() => {
    if (bars?.length) {
      setCurrentStreak(getStreak(bars))
      setBarsLength(bars.length)
    }
  }, [bars, setCurrentStreak, setBarsLength])

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
        'Cheechart — Price Alert',
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
          'Cheechart — Candle Streak',
          `${streak.count} consecutive ${streak.direction} candles on ${timeframe ?? ''} ${dot}`
        )
      }
    })
  }, [bars, alerts, markTriggered, timeframe])

  return { currentPrice, getStreak }
}
