/**
 * DataTab — Backup & Restore tab content inside SettingsModal.
 *
 * Export: download all user data as a versioned JSON file.
 * Import: file picker + drag-drop with preview summary and confirm.
 * Reset: clear all cheechart-* keys (double-click confirm).
 */

import { useState, useRef, useCallback } from 'react'
import { exportBackup, parseBackupFile, applyBackup } from '../../utils/backup'
import { useToast } from '../../store/useToastStore'

// ── Helpers ──────────────────────────────────────────────────────────────────

function summaryText(summary) {
  const parts = []
  if (summary.presets > 0) parts.push(`${summary.presets} preset${summary.presets > 1 ? 's' : ''}`)
  if (summary.alerts > 0) parts.push(`${summary.alerts} alert${summary.alerts > 1 ? 's' : ''}`)
  if (summary.journal > 0) parts.push(`${summary.journal} journal entr${summary.journal > 1 ? 'ies' : 'y'}`)
  if (summary.watchlist > 0) parts.push(`${summary.watchlist} watchlist symbol${summary.watchlist > 1 ? 's' : ''}`)
  if (summary.annotations > 0) parts.push(`${summary.annotations} annotation${summary.annotations > 1 ? 's' : ''}`)
  if (summary.preferences > 0) parts.push('preferences')
  return parts.length > 0 ? parts.join(', ') : 'No data found'
}

// ── Component ────────────────────────────────────────────────────────────────

export function DataTab() {
  const addToast = useToast((s) => s.add)
  const fileInputRef = useRef(null)

  const [dragOver, setDragOver] = useState(false)
  const [importState, setImportState] = useState('idle') // idle | validating | confirming | importing | done | error
  const [parsedBackup, setParsedBackup] = useState(null) // { data, summary }
  const [importError, setImportError] = useState(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  // ── Export ──────────────────────────────────────────────────────────────

  function handleExport() {
    try {
      const filename = exportBackup()
      addToast({ type: 'success', message: `Backup saved as ${filename}` })
    } catch {
      addToast({ type: 'error', message: 'Failed to export backup' })
    }
  }

  // ── Import ─────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file) => {
    if (!file) return

    // Basic extension/type check
    const name = file.name || ''
    if (!name.endsWith('.json') && !file.type.includes('json')) {
      setImportState('error')
      setImportError('Please select a .json file')
      return
    }

    setImportState('validating')
    setImportError(null)

    const result = await parseBackupFile(file)
    if (!result.ok) {
      setImportState('error')
      setImportError(result.reason)
      return
    }

    setParsedBackup(result)
    setImportState('confirming')
  }, [])

  function handleConfirmImport() {
    if (!parsedBackup) return
    setImportState('importing')

    try {
      const summary = applyBackup(parsedBackup.data)
      setImportState('done')
      const parts = []
      if (summary.presets > 0) parts.push(`${summary.presets} presets`)
      if (summary.alerts > 0) parts.push(`${summary.alerts} alerts`)
      if (summary.journal > 0) parts.push(`${summary.journal} journal entries`)
      if (summary.watchlist > 0) parts.push(`${summary.watchlist} watchlist symbols`)
      if (summary.annotations > 0) parts.push(`${summary.annotations} annotations`)
      const msg = parts.length > 0 ? `Imported: ${parts.join(', ')}` : 'Backup applied'
      addToast({ type: 'success', message: `${msg}. Reloading...` })

      // Reload to rehydrate all stores cleanly
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      setImportState('error')
      setImportError('Failed to apply backup')
    }
  }

  function handleCancelImport() {
    setImportState('idle')
    setParsedBackup(null)
    setImportError(null)
  }

  // ── Drag & drop ────────────────────────────────────────────────────────

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  // ── Reset ──────────────────────────────────────────────────────────────

  function handleReset() {
    if (!resetConfirm) {
      setResetConfirm(true)
      setTimeout(() => setResetConfirm(false), 3000)
      return
    }
    // Clear all cheechart-* keys
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('cheechart-')) keys.push(key)
    }
    keys.forEach((k) => localStorage.removeItem(k))
    addToast({ type: 'success', message: 'All data cleared. Reloading...' })
    setTimeout(() => window.location.reload(), 1000)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const sectionLabel = {
    fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 10,
  }

  const sectionBox = {
    padding: '16px', borderRadius: 8,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Export ─────────────────────────────────────────────────── */}
      <div>
        <div style={sectionLabel}>Export</div>
        <div style={sectionBox}>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
            Download backup
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Save all presets, alerts, journal entries, watchlist, annotations, and preferences as a JSON file.
          </div>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: 'var(--btn-primary)', color: '#fff', border: 'none',
              cursor: 'pointer', fontFamily: 'monospace',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--btn-primary)'}
          >
            Export Backup
          </button>
        </div>
      </div>

      {/* ── Import ────────────────────────────────────────────────── */}
      <div>
        <div style={sectionLabel}>Import</div>
        <div style={sectionBox}>

          {importState === 'idle' && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
                Restore from backup
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                Import a previously exported backup file. Data is merged with existing — nothing is overwritten.
              </div>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '24px 16px',
                  borderRadius: 8,
                  border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                  background: dragOver ? 'var(--accent-dim)' : 'transparent',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ fontSize: 12, color: dragOver ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 4 }}>
                  {dragOver ? 'Drop file here' : 'Click or drag a .json backup file'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Max 5MB</div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }}
              />
            </>
          )}

          {importState === 'validating' && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>
              Validating backup file...
            </div>
          )}

          {importState === 'confirming' && parsedBackup && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 8 }}>
                Ready to import
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-muted)', marginBottom: 12,
                padding: '10px 12px', borderRadius: 6, background: 'var(--bg-base)',
                border: '1px solid var(--border)', lineHeight: 1.6, fontFamily: 'monospace',
              }}>
                {summaryText(parsedBackup.summary)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleConfirmImport}
                  style={{
                    flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: 'var(--btn-primary)', color: '#fff', border: 'none',
                    cursor: 'pointer', fontFamily: 'monospace',
                  }}
                >
                  Import & Reload
                </button>
                <button
                  onClick={handleCancelImport}
                  style={{
                    padding: '8px 16px', borderRadius: 6, fontSize: 12,
                    background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontFamily: 'monospace',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {importState === 'importing' && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>
              Applying backup...
            </div>
          )}

          {importState === 'done' && (
            <div style={{ fontSize: 12, color: 'var(--color-bull)', padding: '16px 0', textAlign: 'center' }}>
              Backup imported successfully. Reloading...
            </div>
          )}

          {importState === 'error' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-bear)', marginBottom: 8 }}>
                {importError || 'Import failed'}
              </div>
              <button
                onClick={handleCancelImport}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11,
                  background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)',
                  cursor: 'pointer', fontFamily: 'monospace',
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Danger zone ───────────────────────────────────────────── */}
      <div>
        <div style={sectionLabel}>Danger zone</div>
        <div style={{ ...sectionBox, borderColor: 'var(--color-bear, #ef4444)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
            Reset all data
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Permanently delete all presets, alerts, journal entries, watchlist, annotations, and preferences.
            This cannot be undone — export a backup first.
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: resetConfirm ? 'var(--color-bear, #ef4444)' : 'transparent',
              color: resetConfirm ? '#fff' : 'var(--color-bear, #ef4444)',
              border: '1px solid var(--color-bear, #ef4444)',
              cursor: 'pointer', fontFamily: 'monospace',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {resetConfirm ? 'Click again to confirm reset' : 'Reset All Data'}
          </button>
        </div>
      </div>
    </div>
  )
}
