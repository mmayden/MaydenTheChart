import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const storage = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key) => storage[key] ?? null),
  setItem: vi.fn((key, val) => { storage[key] = val }),
  removeItem: vi.fn((key) => { delete storage[key] }),
  clear: vi.fn(() => { for (const k in storage) delete storage[k] }),
})

// Must import AFTER mocking localStorage
const { usePresetsStore } = await import('./usePresetsStore')
const { useChartStore } = await import('./useChartStore')
const { DEFAULT_PRESETS, DEFAULT_PRESET_ID } = await import('../constants/presets')

beforeEach(() => {
  localStorage.clear()
  // Reset stores to initial state
  usePresetsStore.setState({
    presets: { ...DEFAULT_PRESETS },
    activePresetId: DEFAULT_PRESET_ID,
  })
  useChartStore.setState({
    indicators: {
      ema: true, vwap: true, rvol: true,
      rsi: true, macd: true, levels: true, sr: true,
    },
    selectedTimeframe: '5Min',
  })
})

describe('usePresetsStore', () => {
  // ── Default presets ──────────────────────────────────────────────
  describe('defaults', () => {
    it('ships with 4 default presets', () => {
      const { presets } = usePresetsStore.getState()
      const defaults = Object.values(presets).filter((p) => p.isDefault)
      expect(defaults).toHaveLength(4)
    })

    it('has full as the default active preset', () => {
      const { activePresetId } = usePresetsStore.getState()
      expect(activePresetId).toBe('full')
    })

    it('each default preset has required fields', () => {
      const { presets } = usePresetsStore.getState()
      for (const preset of Object.values(presets)) {
        expect(preset).toHaveProperty('id')
        expect(preset).toHaveProperty('name')
        expect(preset).toHaveProperty('icon')
        expect(preset).toHaveProperty('indicators')
        expect(preset).toHaveProperty('timeframe')
        expect(preset.isDefault).toBe(true)
      }
    })
  })

  // ── Apply preset ─────────────────────────────────────────────────
  describe('applyPreset', () => {
    it('applies indicator toggles to useChartStore', () => {
      usePresetsStore.getState().applyPreset('clean')
      const { indicators } = useChartStore.getState()
      expect(indicators.ema).toBe(false)
      expect(indicators.vwap).toBe(false)
      expect(indicators.levels).toBe(false)
    })

    it('applies timeframe to useChartStore', () => {
      usePresetsStore.getState().applyPreset('swing')
      expect(useChartStore.getState().selectedTimeframe).toBe('4Hour')
    })

    it('updates activePresetId', () => {
      usePresetsStore.getState().applyPreset('scalp')
      expect(usePresetsStore.getState().activePresetId).toBe('scalp')
    })

    it('persists activePresetId to localStorage', () => {
      usePresetsStore.getState().applyPreset('clean')
      expect(localStorage.setItem).toHaveBeenCalledWith('lumpio-active-preset', 'clean')
    })

    it('does nothing for non-existent preset', () => {
      usePresetsStore.getState().applyPreset('nonexistent')
      expect(usePresetsStore.getState().activePresetId).toBe('full')
    })
  })

  // ── Save current as preset ───────────────────────────────────────
  describe('saveCurrentAsPreset', () => {
    it('creates a new custom preset from current state', () => {
      useChartStore.setState({
        indicators: { ema: true, vwap: false, rvol: false, rsi: true, macd: false, levels: true, sr: false },
        selectedTimeframe: '15Min',
      })

      const id = usePresetsStore.getState().saveCurrentAsPreset('My Setup')
      const preset = usePresetsStore.getState().presets[id]

      expect(preset.name).toBe('My Setup')
      expect(preset.isDefault).toBe(false)
      expect(preset.indicators.vwap).toBe(false)
      expect(preset.indicators.ema).toBe(true)
      expect(preset.timeframe).toBe('15Min')
    })

    it('sets the new preset as active', () => {
      const id = usePresetsStore.getState().saveCurrentAsPreset('Test')
      expect(usePresetsStore.getState().activePresetId).toBe(id)
    })

    it('persists to localStorage', () => {
      usePresetsStore.getState().saveCurrentAsPreset('Persisted')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'lumpio-presets',
        expect.any(String)
      )
    })
  })

  // ── Rename preset ────────────────────────────────────────────────
  describe('renamePreset', () => {
    it('renames a custom preset', () => {
      const id = usePresetsStore.getState().saveCurrentAsPreset('Old Name')
      usePresetsStore.getState().renamePreset(id, 'New Name')
      expect(usePresetsStore.getState().presets[id].name).toBe('New Name')
    })

    it('does not rename default presets', () => {
      usePresetsStore.getState().renamePreset('full', 'Hacked')
      expect(usePresetsStore.getState().presets['full'].name).toBe('Full')
    })
  })

  // ── Delete preset ────────────────────────────────────────────────
  describe('deletePreset', () => {
    it('deletes a custom preset', () => {
      const id = usePresetsStore.getState().saveCurrentAsPreset('Temp')
      usePresetsStore.getState().deletePreset(id)
      expect(usePresetsStore.getState().presets[id]).toBeUndefined()
    })

    it('does not delete default presets', () => {
      usePresetsStore.getState().deletePreset('full')
      expect(usePresetsStore.getState().presets['full']).toBeDefined()
    })

    it('falls back to full if active preset is deleted', () => {
      const id = usePresetsStore.getState().saveCurrentAsPreset('Active')
      expect(usePresetsStore.getState().activePresetId).toBe(id)
      usePresetsStore.getState().deletePreset(id)
      expect(usePresetsStore.getState().activePresetId).toBe('full')
    })

    it('keeps activePresetId unchanged if non-active preset is deleted', () => {
      usePresetsStore.getState().saveCurrentAsPreset('Other')
      usePresetsStore.getState().applyPreset('scalp')
      const { presets } = usePresetsStore.getState()
      const customId = Object.keys(presets).find((k) => !presets[k].isDefault)
      usePresetsStore.getState().deletePreset(customId)
      expect(usePresetsStore.getState().activePresetId).toBe('scalp')
    })
  })

  // ── Update preset ────────────────────────────────────────────────
  describe('updatePreset', () => {
    it('updates a custom preset with current chart state', () => {
      const id = usePresetsStore.getState().saveCurrentAsPreset('Updatable')
      useChartStore.setState({
        indicators: { ema: false, vwap: false, rvol: false, rsi: false, macd: false, levels: false, sr: false },
        selectedTimeframe: '1Day',
      })
      usePresetsStore.getState().updatePreset(id)
      const preset = usePresetsStore.getState().presets[id]
      expect(preset.indicators.ema).toBe(false)
      expect(preset.timeframe).toBe('1Day')
    })

    it('does not update default presets', () => {
      useChartStore.setState({
        indicators: { ema: false, vwap: false, rvol: false, rsi: false, macd: false, levels: false, sr: false },
      })
      usePresetsStore.getState().updatePreset('full')
      expect(usePresetsStore.getState().presets['full'].indicators.ema).toBe(true)
    })
  })

  // ── Mark modified ────────────────────────────────────────────────
  describe('markModified', () => {
    it('sets activePresetId to null', () => {
      usePresetsStore.getState().applyPreset('scalp')
      usePresetsStore.getState().markModified()
      expect(usePresetsStore.getState().activePresetId).toBeNull()
    })
  })

  // ── Ordered presets ──────────────────────────────────────────────
  describe('getOrderedPresets', () => {
    it('returns defaults first, then custom sorted by name', () => {
      usePresetsStore.getState().saveCurrentAsPreset('Zebra')
      usePresetsStore.getState().saveCurrentAsPreset('Alpha')
      const ordered = usePresetsStore.getState().getOrderedPresets()

      const defaultCount = Object.values(DEFAULT_PRESETS).length
      const defaults = ordered.slice(0, defaultCount)
      const custom = ordered.slice(defaultCount)

      expect(defaults.every((p) => p.isDefault)).toBe(true)
      expect(custom[0].name).toBe('Alpha')
      expect(custom[1].name).toBe('Zebra')
    })
  })
})
