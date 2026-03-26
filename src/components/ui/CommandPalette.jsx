/**
 * CommandPalette — Cmd+K search overlay.
 *
 * Quick access to: symbols, timeframes, indicators, presets, panels, settings.
 * Modern command palette pattern (VS Code, Linear, Notion, Vercel).
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react' // eslint-disable-line no-unused-vars -- motion used as JSX namespace
import { useChartStore } from '../../store/useChartStore'
import { usePresetsStore } from '../../store/usePresetsStore'
import { SYMBOL_SUGGESTIONS, TIMEFRAME_CONFIG, TIMEFRAME_ORDER } from '../../constants/chart'

// ── Command definitions ─────────────────────────────────────────────────────

function buildCommands() {
  const { setSymbol, setTimeframe, toggleIndicator, indicators, setSettingsOpen, setActivePanel } = useChartStore.getState()
  const { applyPreset, getOrderedPresets } = usePresetsStore.getState()

  const commands = []

  // Symbols
  SYMBOL_SUGGESTIONS.forEach((s) => {
    commands.push({
      id: `symbol:${s}`,
      label: s,
      category: 'Symbol',
      action: () => setSymbol(s),
    })
  })

  // Timeframes
  TIMEFRAME_ORDER.forEach((tf) => {
    commands.push({
      id: `tf:${tf}`,
      label: `${TIMEFRAME_CONFIG[tf].label} — ${tf}`,
      category: 'Timeframe',
      action: () => setTimeframe(tf),
    })
  })

  // Indicators
  const indicatorNames = {
    ema: 'EMA (9/48/200)', vwap: 'VWAP + Bands', rvol: 'Relative Volume',
    levels: 'Prev H/L + ORB', sr: 'Support & Resistance', rsi: 'RSI',
    macd: 'MACD', bollinger: 'Bollinger Bands',
  }
  Object.entries(indicatorNames).forEach(([key, name]) => {
    commands.push({
      id: `ind:${key}`,
      label: `${indicators[key] ? 'Hide' : 'Show'} ${name}`,
      category: 'Indicator',
      action: () => toggleIndicator(key),
    })
  })

  // Presets
  getOrderedPresets().forEach((p) => {
    commands.push({
      id: `preset:${p.id}`,
      label: p.name,
      category: 'Preset',
      action: () => applyPreset(p.id),
    })
  })

  // Panels
  commands.push(
    { id: 'panel:backtest',  label: 'Open Backtest',  category: 'Panel', action: () => setActivePanel('backtest') },
    { id: 'panel:journal',   label: 'Open Journal',   category: 'Panel', action: () => setActivePanel('journal') },
    { id: 'panel:watchlist', label: 'Open Watchlist',  category: 'Panel', action: () => setActivePanel('watchlist') },
    { id: 'panel:alerts',    label: 'Open Alerts',     category: 'Panel', action: () => setActivePanel('alerts') },
  )

  // Actions
  commands.push(
    { id: 'action:settings',  label: 'Open Settings',   category: 'Action', action: () => setSettingsOpen(true) },
    { id: 'action:snapshot',  label: 'Chart Snapshot',   category: 'Action', action: () => window.dispatchEvent(new CustomEvent('lumpio:snapshot')) },
  )

  return commands
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const open    = useChartStore((s) => s.commandPaletteOpen)
  const setOpen = useChartStore((s) => s.setCommandPaletteOpen)
  const prefersReduced = useReducedMotion()

  const [query, setQuery]           = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef  = useRef(null)
  const listRef   = useRef(null)

  // Build commands fresh each time palette opens
  const commands = useMemo(() => {
    if (!open) return []
    return buildCommands()
  }, [open])

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 20)
    const q = query.toLowerCase()
    return commands
      .filter((c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      .slice(0, 20)
  }, [query, commands])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && filtered[selectedIdx]) {
        e.preventDefault()
        filtered[selectedIdx].action()
        setOpen(false)
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, selectedIdx, setOpen])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  // Reset index when query changes
  useEffect(() => { setSelectedIdx(0) }, [query])

  // Group by category + build flat index map for keyboard navigation
  const { grouped, flatIndexMap } = useMemo(() => {
    const g = {}
    const idxMap = new Map()
    let idx = 0
    filtered.forEach((cmd) => {
      if (!g[cmd.category]) g[cmd.category] = []
      g[cmd.category].push(cmd)
      idxMap.set(cmd.id, idx++)
    })
    return { grouped: g, flatIndexMap: idxMap }
  }, [filtered])

  const motionDuration = prefersReduced ? 0 : 0.2

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette"
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDuration }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Palette */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-xl border border-theme-mid shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-base)' }}
            initial={{ scale: 0.95, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -8 }}
            transition={{ duration: motionDuration, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-theme">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-theme-muted shrink-0">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, symbols, indicators..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-theme placeholder-theme-muted focus:outline-none font-mono"
              />
              <kbd className="text-[10px] text-theme-muted bg-theme-border px-1.5 py-0.5 rounded font-mono">ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-center text-theme-muted text-xs py-6">No results found</p>
              ) : (
                Object.entries(grouped).map(([category, cmds]) => (
                  <div key={category}>
                    <div className="px-4 pt-2 pb-1 text-[10px] tracking-widest text-theme-muted uppercase font-semibold">
                      {category}
                    </div>
                    {cmds.map((cmd) => {
                      const idx = flatIndexMap.get(cmd.id)
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => { cmd.action(); setOpen(false) }}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                            idx === selectedIdx
                              ? 'bg-accent-dim text-accent'
                              : 'text-theme hover:bg-theme-hover'
                          }`}
                        >
                          <span className="font-mono text-xs">{cmd.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-theme text-[10px] text-theme-muted">
              <span><kbd className="bg-theme-border px-1 rounded">↑↓</kbd> navigate</span>
              <span><kbd className="bg-theme-border px-1 rounded">↵</kbd> select</span>
              <span><kbd className="bg-theme-border px-1 rounded">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
