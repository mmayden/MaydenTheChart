/**
 * AlertsPanel — Right slide-out panel for managing alerts.
 *
 * Slides in from the right side of the screen.
 * Reads live market context (currentPrice, currentStreak) from the alerts store
 * so it works regardless of which view is active.
 */

import { useState } from 'react'
import { useChartStore } from '../../store/useChartStore'
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
  const open            = useChartStore((s) => s.alertsPanelOpen)
  const setOpen         = useChartStore((s) => s.setAlertsPanelOpen)
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
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-[45]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: 340, backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex flex-col h-full border-l border-gray-800">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide">Alerts</span>
              {activeCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                  {activeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentPrice && (
                <span className="text-xs text-gray-400 font-mono">${currentPrice.toFixed(2)}</span>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Type tabs */}
          <div className="flex border-b border-gray-800">
            {[['price', 'Price Level'], ['candle-streak', 'Candle Streak']].map(([val, label]) => {
              const tabCount = alerts.filter((a) => a.type === val && !a.triggered).length
              return (
                <button
                  key={val}
                  onClick={() => setAlertType(val)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
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
          <form onSubmit={handleAdd} className="px-4 py-3 border-b border-gray-800 flex flex-col gap-2.5">
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
                {currentStreak.direction && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: currentStreak.direction === 'green' ? '#22c55e' : '#ef4444' }}
                    />
                    Current streak:&nbsp;
                    <span className="text-gray-100 font-mono">{currentStreak.count} {currentStreak.direction}</span>
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
                <p className="text-center text-gray-500 text-xs py-8">
                  No {alertType === 'price' ? 'price' : 'streak'} alerts set
                </p>
              )
              return (
                <ul className="divide-y divide-gray-800">
                  {tabAlerts.map((alert) => (
                    <li key={alert.id} className="flex items-center gap-2 px-4 py-3">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: alertDotColor(alert) }}
                      />
                      <span className={`text-xs font-mono flex-1 min-w-0 truncate ${alert.triggered ? 'text-gray-500' : 'text-gray-100'}`}>
                        {alertLabel(alert)}
                      </span>
                      {alert.triggered && (
                        <span className="text-[10px] text-green-500 shrink-0">hit</span>
                      )}
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="text-gray-500 hover:text-red-400 text-xs transition-colors shrink-0 leading-none"
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

          {/* Footer: clear all triggered */}
          {alerts.some((a) => a.triggered) && (
            <div className="px-4 py-3 border-t border-gray-800">
              <button
                onClick={() => {
                  alerts.filter((a) => a.triggered).forEach((a) => removeAlert(a.id))
                }}
                className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
              >
                Clear triggered alerts
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
