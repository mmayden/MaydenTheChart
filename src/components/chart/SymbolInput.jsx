/**
 * SymbolInput — Editable ticker input in the sidebar.
 *
 * Displays the current symbol as bold text. Click to edit, type a new
 * ticker, press Enter to switch. Escape or blur cancels. Auto-uppercases
 * input and strips whitespace. Updates Zustand store on submit.
 */

import { useState, useRef, useEffect } from 'react'
import { useChartStore } from '../../store/useChartStore'

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

  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(selectedSymbol)
  const inputRef = useRef(null)

  // Focus + select all when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEditing() {
    setDraft(selectedSymbol)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setDraft(selectedSymbol)
  }

  function submit() {
    const cleaned = draft.trim().toUpperCase()
    if (cleaned && cleaned !== selectedSymbol) {
      setSymbol(cleaned)
    }
    setDraft(cleaned || selectedSymbol)
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      cancel()
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        onBlur={submit}
        maxLength={10}
        spellCheck={false}
        autoComplete="off"
        className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none"
        style={{ ...SYMBOL_FONT, padding: '0 0 2px 0' }}
      />
    )
  }

  return (
    <button
      onClick={startEditing}
      title="Click to change symbol"
      className="text-left w-full group cursor-text"
    >
      <span
        style={{
          ...SYMBOL_FONT,
          borderBottom: '1px dashed transparent',
          transition: 'border-color 0.15s',
        }}
        className="group-hover:border-gray-500"
        // Apply hover border via inline workaround since Tailwind can't target inline styles
        onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = 'var(--text-muted)'}
        onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
      >
        {selectedSymbol}
      </span>
    </button>
  )
}
