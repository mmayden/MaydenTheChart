/**
 * AlertsPanel — Alert management content for the right panel.
 *
 * Supports two alert types: price-level and candle-streak.
 * The RightPanel shell handles open/close/backdrop.
 */

import { useState } from 'react'
import { useAlertsStore } from '../../store/useAlertsStore'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

export function AlertsPanel() {
  const { alerts, addAlert, removeAlert, currentPrice, currentStreak, barsLength } = useAlertsStore()

  const [alertType,   setAlertType]   = useState('price')
  const [priceInput,  setPriceInput]  = useState('')
  const [condition,   setCondition]   = useState('above')
  const [streakCount, setStreakCount] = useState('6')
  const [streakDir,   setStreakDir]   = useState('either')

  const activeCount = alerts.filter((a) => !a.triggered).length

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
      addAlert({ type: 'candle-streak', count: n, direction: streakDir, barsLengthAtCreation: barsLength })
    }
  }

  const canSubmit = alertType === 'price'
    ? !!priceInput && parseFloat(priceInput) > 0
    : parseInt(streakCount, 10) >= 2

  return (
    <div className="flex flex-col h-full">
      {/* Active count + current price */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-theme-muted">{activeCount} active</span>
        </div>
        {currentPrice && (
          <span className="text-xs text-theme-muted font-mono">${currentPrice.toFixed(2)}</span>
        )}
      </div>

      {/* Type tabs */}
      <div className="flex border-b border-theme shrink-0">
        {[['price', 'Price Level'], ['candle-streak', 'Candle Streak']].map(([val, label]) => {
          const tabCount = alerts.filter((a) => a.type === val && !a.triggered).length
          return (
            <button
              key={val}
              onClick={() => setAlertType(val)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                alertType === val
                  ? 'text-accent border-b-2 border-accent -mb-px bg-blue-500/5'
                  : 'text-theme-muted hover:text-theme'
              }`}
            >
              {label}
              {tabCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-accent text-[9px] font-bold">
                  {tabCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleAdd} className="px-4 py-3 border-b border-theme flex flex-col gap-2.5 shrink-0">
        {alertType === 'price' ? (
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Price"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="flex-1 bg-[#0a0a0a] border border-theme-mid rounded px-2 py-1.5 text-xs text-theme placeholder-theme-muted focus:outline-none focus:border-accent font-mono"
            />
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="bg-[#0a0a0a] border border-theme-mid rounded px-2 py-1.5 text-xs text-theme focus:outline-none focus:border-accent"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
        ) : (
          <>
            <p className="text-xs text-theme-muted leading-relaxed">
              Alert when N candles close in a row of the same color.
            </p>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 flex-1 bg-[#0a0a0a] border border-theme-mid rounded px-2 py-1.5">
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={streakCount}
                  onChange={(e) => setStreakCount(e.target.value)}
                  className="w-10 bg-transparent text-xs text-theme focus:outline-none font-mono text-center"
                />
                <span className="text-xs text-theme-muted">candles</span>
              </div>
              <select
                value={streakDir}
                onChange={(e) => setStreakDir(e.target.value)}
                className="bg-[#0a0a0a] border border-theme-mid rounded px-2 py-1.5 text-xs text-theme focus:outline-none focus:border-accent"
              >
                <option value="either">Either color</option>
                <option value="green">Green only</option>
                <option value="red">Red only</option>
              </select>
            </div>
            {currentStreak.direction && (
              <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: currentStreak.direction === 'green' ? '#22c55e' : '#ef4444' }}
                />
                Current streak:&nbsp;
                <span className="text-theme font-mono">{currentStreak.count} {currentStreak.direction}</span>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded transition-colors"
        >
          Set Alert
        </button>
      </form>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        {(() => {
          const tabAlerts = alerts.filter((a) => a.type === alertType)
          if (tabAlerts.length === 0) return (
            <p className="text-center text-theme-muted text-xs py-8">
              No {alertType === 'price' ? 'price' : 'streak'} alerts set
            </p>
          )
          return (
            <ul className="divide-y divide-theme">
              {tabAlerts.map((alert) => (
                <li key={alert.id} className="flex items-center gap-2 px-4 py-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: alertDotColor(alert) }}
                  />
                  <span className={`text-xs font-mono flex-1 min-w-0 truncate ${alert.triggered ? 'text-theme-muted' : 'text-theme'}`}>
                    {alertLabel(alert)}
                  </span>
                  {alert.triggered && (
                    <span className="text-[10px] text-green-500 shrink-0">hit</span>
                  )}
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-theme-muted hover:text-red-400 text-xs transition-colors shrink-0 leading-none"
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )
        })()}
      </div>

      {alerts.some((a) => a.triggered) && (
        <div className="px-4 py-3 border-t border-theme shrink-0">
          <button
            onClick={() => {
              alerts.filter((a) => a.triggered).forEach((a) => removeAlert(a.id))
            }}
            className="w-full text-xs text-theme-muted hover:text-theme transition-colors py-1"
          >
            Clear triggered alerts
          </button>
        </div>
      )}
    </div>
  )
}
