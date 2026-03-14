/**
 * NotificationBell — Price alert bell in the header.
 *
 * Supports two alert types:
 *   Price Level   — fires when price crosses above/below a set value
 *   Candle Streak — fires when N candles in a row are the same color
 *
 * Fires a browser Notification on trigger. Badge shows active alert count.
 */

import { useState, useEffect, useRef } from 'react'
import { useAlertsStore } from '../../store/useAlertsStore'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function alertLabel(alert) {
  if (alert.type === 'price') {
    const arrow = alert.condition === 'above' ? '↑' : '↓'
    return `$${alert.price.toFixed(2)} ${arrow} ${alert.condition}`
  }
  const dir = alert.direction === 'either' ? 'any' : alert.direction
  return `${alert.count}+ consecutive ${dir}`
}

function alertDotColor(alert) {
  if (alert.triggered) return '#4b5563'
  if (alert.type === 'candle-streak') {
    if (alert.direction === 'green')  return '#22c55e'
    if (alert.direction === 'red')    return '#ef4444'
    return '#eab308'
  }
  return alert.condition === 'above' ? '#22c55e' : '#ef4444'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationBell({ bars, timeframe }) {
  const [open,       setOpen]       = useState(false)
  const [alertType,  setAlertType]  = useState('price')
  const [priceInput, setPriceInput] = useState('')
  const [condition,  setCondition]  = useState('above')
  const [streakCount, setStreakCount] = useState('6')
  const [streakDir,   setStreakDir]   = useState('either')
  const panelRef = useRef(null)

  const { alerts, addAlert, removeAlert, markTriggered } = useAlertsStore()
  const activeCount  = alerts.filter((a) => !a.triggered).length
  const currentPrice = bars?.[bars.length - 1]?.close ?? null

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── Check price alerts ─────────────────────────────────────────────────────
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
        'Loompia — Price Alert',
        `QQQ ${alert.condition === 'above' ? 'crossed above' : 'crossed below'} $${alert.price.toFixed(2)} · now $${currentPrice.toFixed(2)}`
      )
    })
  }, [currentPrice, alerts, markTriggered])

  // ── Check candle-streak alerts ─────────────────────────────────────────────
  // barsLengthAtCreation ensures we only fire on NEW bars, not existing data.
  useEffect(() => {
    if (!bars?.length) return
    const streak = getStreak(bars)
    alerts.forEach((alert) => {
      if (alert.triggered || alert.type !== 'candle-streak') return
      // Skip until at least one new bar has arrived since this alert was set
      if (bars.length <= alert.barsLengthAtCreation) return
      const dirMatch = alert.direction === 'either' || alert.direction === streak.direction
      if (dirMatch && streak.count >= alert.count) {
        markTriggered(alert.id)
        const dot = streak.direction === 'green' ? '🟢' : '🔴'
        fireNotification(
          'Loompia — Candle Streak',
          `${streak.count} consecutive ${streak.direction} candles on ${timeframe ?? ''} ${dot}`
        )
      }
    })
  }, [bars, alerts, markTriggered, timeframe])

  // ── Form submit ───────────────────────────────────────────────────────────
  function handleAdd(e) {
    e.preventDefault()
    if (Notification.permission === 'default') Notification.requestPermission()
    if (alertType === 'price') {
      const p = parseFloat(priceInput)
      if (!p || p <= 0) return
      addAlert({ type: 'price', price: p, condition })
      setPriceInput('')
    } else {
      const n = parseInt(streakCount, 10)
      if (!n || n < 2) return
      addAlert({ type: 'candle-streak', count: n, direction: streakDir, barsLengthAtCreation: bars?.length ?? 0 })
    }
  }

  const canSubmit = alertType === 'price'
    ? !!priceInput && parseFloat(priceInput) > 0
    : parseInt(streakCount, 10) >= 2

  return (
    <div className="relative" ref={panelRef}>

      {/* ── Bell button ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded hover:bg-gray-800 text-yellow-400 hover:text-yellow-300 transition-colors"
        title="Alerts"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ───────────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 bg-[#0d1117] border border-gray-600 rounded-lg shadow-2xl z-50 overflow-hidden"
          style={{ width: 280 }}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-700 flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-gray-200 uppercase">Alerts</span>
            {currentPrice && (
              <span className="text-xs text-gray-400 font-mono">${currentPrice.toFixed(2)}</span>
            )}
          </div>

          {/* Type tabs — list below is filtered to match active tab */}
          <div className="flex border-b border-gray-700">
            {[['price', 'Price Level'], ['candle-streak', 'Candle Streak']].map(([val, label]) => {
              const tabCount = alerts.filter((a) => a.type === val && !a.triggered).length
              return (
                <button
                  key={val}
                  onClick={() => setAlertType(val)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    alertType === val
                      ? 'text-blue-400 border-b-2 border-blue-500 -mb-px bg-blue-500/5'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {label}
                  {tabCount > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold">
                      {tabCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleAdd} className="px-4 py-3 border-b border-gray-700 flex flex-col gap-2.5">

            {alertType === 'price' ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="flex-1 bg-[#0a0a0a] border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="bg-[#0a0a0a] border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Alert when N candles close in a row of the same color.
                </p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 flex-1 bg-[#0a0a0a] border border-gray-600 rounded px-2 py-1.5">
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={streakCount}
                      onChange={(e) => setStreakCount(e.target.value)}
                      className="w-10 bg-transparent text-xs text-gray-100 focus:outline-none font-mono text-center"
                    />
                    <span className="text-xs text-gray-400">candles</span>
                  </div>
                  <select
                    value={streakDir}
                    onChange={(e) => setStreakDir(e.target.value)}
                    className="bg-[#0a0a0a] border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="either">Either color</option>
                    <option value="green">Green only</option>
                    <option value="red">Red only</option>
                  </select>
                </div>
                {/* Live streak readout */}
                {bars?.length > 0 && (() => {
                  const s = getStreak(bars)
                  const dot = s.direction === 'green' ? '#22c55e' : '#ef4444'
                  return (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                      Current streak:&nbsp;<span className="text-gray-100 font-mono">{s.count} {s.direction}</span>
                    </div>
                  )
                })()}
              </>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-1.5 rounded transition-colors"
            >
              Set Alert
            </button>
          </form>

          {/* Alert list */}
          <div className="max-h-48 overflow-y-auto">
            {(() => {
              const tabAlerts = alerts.filter((a) => a.type === alertType)
              if (tabAlerts.length === 0) return (
                <p className="text-center text-gray-500 text-xs py-5">No {alertType === 'price' ? 'price' : 'streak'} alerts set</p>
              )
              return (
                <ul className="divide-y divide-gray-800">
                  {tabAlerts.map((alert) => (
                    <li key={alert.id} className="flex items-center gap-2 px-4 py-2.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: alertDotColor(alert) }}
                      />
                      <span className={`text-xs font-mono flex-1 min-w-0 truncate ${alert.triggered ? 'text-gray-500' : 'text-gray-100'}`}>
                        {alertLabel(alert)}
                      </span>
                      {alert.triggered && (
                        <span className="text-[10px] text-green-500 shrink-0">✓ hit</span>
                      )}
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="text-gray-500 hover:text-red-400 text-xs transition-colors shrink-0 leading-none"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )
            })()}
          </div>

        </div>
      )}
    </div>
  )
}
