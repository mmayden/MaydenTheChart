/**
 * SymbolInput — Editable ticker input with live Alpaca validation.
 *
 * Click the symbol to edit. Type any ticker, press Enter to submit.
 * Validates against Alpaca by fetching a small sample of bars — if
 * data comes back, the symbol is valid. If not, shows a brief error
 * message and reverts to the previous symbol.
 */

import { useState, useRef, useEffect } from 'react'
import { useChartStore } from '../../store/useChartStore'
import { fetchBars } from '../../services/alpaca'

const SYMBOL_FONT = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '1.3rem',
  fontWeight: 800,
  letterSpacing: '0.12em',
  color: 'var(--text-primary)',
}

export function SymbolInput() {
  const selectedSymbol = useChartStore((s) => s.selectedSymbol)
  const setSymbol      = useChartStore((s) => s.setSymbol)

  const [editing, setEditing]       = useState(false)
  const [draft, setDraft]           = useState(selectedSymbol)
  const [validating, setValidating] = useState(false)
  const [error, setError]           = useState(null)
  const inputRef = useRef(null)

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

  function startEditing() {
    setDraft(selectedSymbol)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setDraft(selectedSymbol)
  }

  async function submit() {
    const cleaned = draft.trim().toUpperCase()

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
      const start = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days back
      const bars = await fetchBars(cleaned, '1Day', start.toISOString(), now.toISOString(), 5)

      if (bars.length > 0) {
        setSymbol(cleaned)
        setEditing(false)
      } else {
        setError(`"${cleaned}" not found`)
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
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      cancel()
    }
  }

  // Editing state — show input
  if (editing) {
    return (
      <div>
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
        <span
          style={{
            ...SYMBOL_FONT,
            borderBottom: '1px dashed transparent',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = 'var(--text-muted)'}
          onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
        >
          {selectedSymbol}
        </span>
      </button>
      {error && (
        <div className="text-[10px] mt-1 text-red-400 font-mono">{error}</div>
      )}
    </div>
  )
}
