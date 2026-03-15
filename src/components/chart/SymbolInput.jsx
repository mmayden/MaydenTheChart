/**
 * SymbolInput — Editable ticker input with autocomplete and Alpaca validation.
 *
 * Click the symbol to edit. As you type, a dropdown shows matching suggestions
 * sorted by usage frequency (most-selected first). Press Enter or click a
 * suggestion to submit. Validates against Alpaca — if data comes back, the
 * symbol is valid. If not, shows a brief error and reverts.
 *
 * Usage frequency is tracked in localStorage so frequently-used symbols
 * float to the top across sessions.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useChartStore } from '../../store/useChartStore'
import { useToast } from '../../store/useToastStore'
import { fetchBars } from '../../services/alpaca'
import { SYMBOL_SUGGESTIONS } from '../../constants/chart'
import { validateSymbolUsage } from '../../utils/validate'

const SYMBOL_FONT = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '1.3rem',
  fontWeight: 800,
  letterSpacing: '0.12em',
  color: 'var(--symbol-color)',
}

const USAGE_KEY = 'cheechart-symbol-usage'
const MAX_SUGGESTIONS = 8

/** Read usage counts from localStorage. */
function getUsageCounts() {
  try {
    const raw = JSON.parse(localStorage.getItem(USAGE_KEY)) ?? {}
    return validateSymbolUsage(raw)
  } catch {
    return {}
  }
}

/** Increment usage count for a symbol. */
function recordUsage(symbol) {
  const counts = getUsageCounts()
  counts[symbol] = (counts[symbol] ?? 0) + 1
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(counts))
  } catch { /* quota exceeded — non-critical */ }
}

export function SymbolInput() {
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)
  const setSymbol      = useChartStore((s) => s.setSymbol)
  const toastAdd       = useToast((s) => s.add)

  const [editing, setEditing]       = useState(false)
  const [draft, setDraft]           = useState(selectedSymbol)
  const [validating, setValidating] = useState(false)
  const [error, setError]           = useState(null)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const inputRef    = useRef(null)
  const dropdownRef = useRef(null)

  // Filter + sort suggestions by draft text and usage frequency
  const suggestions = useMemo(() => {
    const q = draft.trim().toUpperCase()
    if (!q) return []

    const counts = getUsageCounts()
    return SYMBOL_SUGGESTIONS
      .filter((s) => s.startsWith(q) && s !== q)
      .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
      .slice(0, MAX_SUGGESTIONS)
  }, [draft])

  // Focus + select all when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  // Clear error after 2 seconds
  useEffect(() => {
    if (!error) return
    const id = setTimeout(() => setError(null), 2000)
    return () => clearTimeout(id)
  }, [error])

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIdx(-1)
  }, [suggestions])

  function startEditing() {
    setDraft(selectedSymbol)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setDraft(selectedSymbol)
  }

  const submit = useCallback(async (symbol) => {
    const cleaned = (symbol ?? draft).trim().toUpperCase()

    // No change or empty — just close
    if (!cleaned || cleaned === selectedSymbol) {
      setDraft(selectedSymbol)
      setEditing(false)
      return
    }

    // Validate against Alpaca
    setValidating(true)
    setError(null)
    try {
      const now = new Date()
      const start = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      const bars = await fetchBars(cleaned, '1Day', start.toISOString(), now.toISOString(), 5)

      if (bars.length > 0) {
        recordUsage(cleaned)
        setSymbol(cleaned)
        toastAdd({ message: `Switched to ${cleaned}`, type: 'success', duration: 2500 })
        setEditing(false)
      } else {
        setError(`"${cleaned}" not found`)
        toastAdd({ message: `Symbol "${cleaned}" not found`, type: 'error' })
        setDraft(selectedSymbol)
        setEditing(false)
      }
    } catch {
      setError('Validation failed')
      setDraft(selectedSymbol)
      setEditing(false)
    } finally {
      setValidating(false)
    }
  }, [draft, selectedSymbol, setSymbol, toastAdd])

  function handleKeyDown(e) {
    // Arrow navigation within dropdown
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIdx((i) => Math.max(i - 1, -1))
        return
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      // If a suggestion is highlighted, use it; otherwise use typed text
      const target = highlightIdx >= 0 ? suggestions[highlightIdx] : draft
      submit(target)
    } else if (e.key === 'Escape') {
      cancel()
    }
  }

  function handleSuggestionMouseDown(symbol) {
    // mouseDown instead of click so it fires before onBlur
    submit(symbol)
  }

  // Editing state — show input + dropdown
  if (editing) {
    return (
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!validating) cancel() }}
            disabled={validating}
            maxLength={10}
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none"
            style={{ ...SYMBOL_FONT, padding: '0 0 2px 0', opacity: validating ? 0.5 : 1 }}
          />
          {validating && (
            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && !validating && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 mt-1 rounded border border-gray-700 overflow-hidden z-50 shadow-lg"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            {suggestions.map((sym, i) => (
              <div
                key={sym}
                onMouseDown={() => handleSuggestionMouseDown(sym)}
                onMouseEnter={() => setHighlightIdx(i)}
                className="px-2 py-1 cursor-pointer text-xs font-mono tracking-wider transition-colors"
                style={{
                  backgroundColor: i === highlightIdx ? 'var(--bg-hover, rgba(255,255,255,0.08))' : 'transparent',
                  color: i === highlightIdx ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {/* Highlight the matching prefix */}
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  {sym.slice(0, draft.trim().length)}
                </span>
                <span>{sym.slice(draft.trim().length)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Display state — show symbol + optional error
  return (
    <div>
      <button
        onClick={startEditing}
        title="Click to change symbol"
        className="text-left w-full flex items-center gap-1.5 group cursor-text"
      >
        <span className="symbol-display" style={SYMBOL_FONT}>
          {selectedSymbol}
        </span>
      </button>
      {error && (
        <div className="text-[10px] mt-1 text-red-400 font-mono">{error}</div>
      )}
    </div>
  )
}
