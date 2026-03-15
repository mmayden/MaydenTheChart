/**
 * PresetSelector — Sidebar preset switcher.
 *
 * Compact pill grid for default presets, expandable section for custom.
 * "Save Current as..." inline flow. Manage (rename/delete) via icon buttons.
 *
 * Design: sleek, minimal, zero-friction switching. Active preset gets
 * a subtle accent glow. Modified state shown as "Custom *" indicator.
 */

import { useState, useRef, useEffect } from 'react'
import { usePresetsStore } from '../../store/usePresetsStore'
import { useToast } from '../../store/useToastStore'

export function PresetSelector() {
  const activePresetId = usePresetsStore((s) => s.activePresetId)
  const applyPreset    = usePresetsStore((s) => s.applyPreset)
  const saveCurrentAsPreset = usePresetsStore((s) => s.saveCurrentAsPreset)
  const renamePreset   = usePresetsStore((s) => s.renamePreset)
  const deletePreset   = usePresetsStore((s) => s.deletePreset)
  const getOrderedPresets = usePresetsStore((s) => s.getOrderedPresets)
  const toast = useToast()

  const [saving, setSaving]       = useState(false)
  const [saveName, setSaveName]   = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName]   = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const saveInputRef = useRef(null)
  const editInputRef = useRef(null)

  const presets = getOrderedPresets()
  const defaults = presets.filter((p) => p.isDefault)
  const custom   = presets.filter((p) => !p.isDefault)

  // Auto-focus save input
  useEffect(() => {
    if (saving && saveInputRef.current) saveInputRef.current.focus()
  }, [saving])

  // Auto-focus rename input
  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus()
  }, [editingId])

  function handleApply(id) {
    if (id === activePresetId) return
    setConfirmDeleteId(null)
    applyPreset(id)
    const preset = presets.find((p) => p.id === id)
    toast.add({ message: `Switched to ${preset?.name ?? 'preset'}`, type: 'info', duration: 2000 })
  }

  function handleSave() {
    const name = saveName.trim()
    if (!name) return
    saveCurrentAsPreset(name)
    toast.add({ message: `Saved preset "${name}"`, type: 'success', duration: 3000 })
    setSaving(false)
    setSaveName('')
  }

  function handleRename(id) {
    const name = editName.trim()
    if (!name) return
    renamePreset(id, name)
    setEditingId(null)
    setEditName('')
  }

  function handleDelete(id) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    const preset = presets.find((p) => p.id === id)
    deletePreset(id)
    setConfirmDeleteId(null)
    toast.add({ message: `Deleted "${preset?.name}"`, type: 'warning', duration: 3000 })
  }

  return (
    <div className="flex flex-col gap-2">

      {/* ── Default presets: 2x2 pill grid ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-1">
        {defaults.map((preset) => {
          const isActive = preset.id === activePresetId
          return (
            <button
              key={preset.id}
              onClick={() => handleApply(preset.id)}
              className="group relative flex items-center justify-center gap-1 px-1.5 py-1.5 text-[10px] font-mono font-semibold rounded-md border transition-all duration-150"
              style={{
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: isActive ? '0 0 8px var(--accent-dim)' : 'none',
              }}
              title={preset.name}
            >
              <span className="opacity-60 text-[9px]">{preset.icon}</span>
              <span className="truncate">{preset.name}</span>
            </button>
          )
        })}
      </div>

      {/* ── Modified indicator ─────────────────────────────────────── */}
      {activePresetId === null && (
        <div
          className="flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-mono rounded-md border border-dashed"
          style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
        >
          <span className="opacity-60">✦</span>
          Custom (modified)
        </div>
      )}

      {/* ── Custom presets ─────────────────────────────────────────── */}
      {custom.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          <div
            className="text-[9px] tracking-widest uppercase font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Saved
          </div>
          {custom.map((preset) => {
            const isActive = preset.id === activePresetId
            const isEditing = editingId === preset.id

            if (isEditing) {
              return (
                <form
                  key={preset.id}
                  onSubmit={(e) => { e.preventDefault(); handleRename(preset.id) }}
                  className="flex gap-1"
                >
                  <input
                    ref={editInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => { setEditingId(null); setEditName('') }}
                    onKeyDown={(e) => { if (e.key === 'Escape') { setEditingId(null); setEditName('') } }}
                    maxLength={20}
                    className="flex-1 min-w-0 px-2 py-1 text-[10px] font-mono rounded border bg-transparent outline-none"
                    style={{
                      borderColor: 'var(--accent)',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--accent-dim)',
                    }}
                  />
                </form>
              )
            }

            return (
              <div
                key={preset.id}
                className="group flex items-center gap-1 rounded-md transition-all duration-150"
              >
                <button
                  onClick={() => handleApply(preset.id)}
                  className="flex-1 flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono font-semibold rounded-md border text-left transition-all duration-150 min-w-0"
                  style={{
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: isActive ? '0 0 8px var(--accent-dim)' : 'none',
                  }}
                >
                  <span className="opacity-60 text-[9px]">{preset.icon}</span>
                  <span className="truncate">{preset.name}</span>
                </button>

                {/* Manage icons */}
                <div className="flex gap-0.5 shrink-0">
                  {confirmDeleteId === preset.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold transition-colors"
                        style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
                        title="Confirm delete"
                      >
                        Delete?
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1 py-0.5 rounded text-[9px] font-mono transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingId(preset.id); setEditName(preset.name); setConfirmDeleteId(null) }}
                        className="px-1 py-0.5 rounded text-[11px] transition-colors hover:brightness-150"
                        style={{ color: 'var(--text-secondary, var(--text-muted))' }}
                        title="Rename"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="px-1 py-0.5 rounded text-[11px] transition-colors hover:text-red-400"
                        style={{ color: 'var(--text-secondary, var(--text-muted))' }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Save current / Add new ─────────────────────────────────── */}
      {saving ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSave() }}
          className="flex gap-1 mt-1"
        >
          <input
            ref={saveInputRef}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setSaving(false); setSaveName('') } }}
            placeholder="Preset name…"
            maxLength={20}
            className="flex-1 min-w-0 px-2 py-1 text-[10px] font-mono rounded border bg-transparent outline-none placeholder:opacity-40"
            style={{
              borderColor: 'var(--accent)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--accent-dim)',
            }}
          />
          <button
            type="submit"
            disabled={!saveName.trim()}
            className="px-2 py-1 text-[10px] font-mono font-semibold rounded border transition-colors disabled:opacity-30"
            style={{
              borderColor: 'var(--accent)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--accent-dim)',
            }}
          >
            Save
          </button>
        </form>
      ) : (
        <button
          onClick={() => setSaving(true)}
          className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-mono rounded-md border border-dashed transition-all duration-150 hover:border-solid"
          style={{
            borderColor: 'var(--border-mid, var(--border))',
            color: 'var(--text-muted)',
          }}
        >
          <span className="text-[9px]">+</span>
          Save current
        </button>
      )}
    </div>
  )
}
