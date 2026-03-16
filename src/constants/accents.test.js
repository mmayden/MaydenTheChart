import { describe, it, expect } from 'vitest'
import { ACCENT_PRESETS, buildAccentLookup, ACCENT_LOOKUP } from './accents'

describe('ACCENT_PRESETS', () => {
  it('has entries for all three themes', () => {
    expect(Object.keys(ACCENT_PRESETS)).toEqual(expect.arrayContaining(['dark', 'terminal', 'lumpia']))
  })

  it('each theme has 6 accent presets', () => {
    for (const [, presets] of Object.entries(ACCENT_PRESETS)) {
      expect(presets).toHaveLength(6)
    }
  })

  it('each preset has required color fields', () => {
    const requiredKeys = ['id', 'color', 'dim', 'btn', 'btnHover', 'ring']
    for (const [, presets] of Object.entries(ACCENT_PRESETS)) {
      for (const preset of presets) {
        for (const key of requiredKeys) {
          expect(preset).toHaveProperty(key)
          expect(typeof preset[key]).toBe('string')
        }
      }
    }
  })

  it('all color values are valid hex colors', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/
    for (const [, presets] of Object.entries(ACCENT_PRESETS)) {
      for (const preset of presets) {
        expect(preset.color).toMatch(hexRegex)
        expect(preset.dim).toMatch(hexRegex)
        expect(preset.btn).toMatch(hexRegex)
        expect(preset.btnHover).toMatch(hexRegex)
        expect(preset.ring).toMatch(hexRegex)
      }
    }
  })

  it('each preset id is unique within its theme', () => {
    for (const [, presets] of Object.entries(ACCENT_PRESETS)) {
      const ids = presets.map((p) => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('buildAccentLookup', () => {
  it('returns nested object indexed by theme then id', () => {
    const lookup = buildAccentLookup()
    expect(lookup.dark).toBeDefined()
    expect(lookup.terminal).toBeDefined()
    expect(lookup.lumpia).toBeDefined()
  })

  it('maps preset fields to correct lookup keys', () => {
    const lookup = buildAccentLookup()
    const blue = lookup.dark.blue
    expect(blue).toBeDefined()
    expect(blue).toHaveProperty('accent')
    expect(blue).toHaveProperty('dim')
    expect(blue).toHaveProperty('btn')
    expect(blue).toHaveProperty('btnHover')
    expect(blue).toHaveProperty('ring')
    // accent should be the preset's color field
    const preset = ACCENT_PRESETS.dark.find((p) => p.id === 'blue')
    expect(blue.accent).toBe(preset.color)
  })

  it('includes all accent ids per theme', () => {
    const lookup = buildAccentLookup()
    for (const [theme, presets] of Object.entries(ACCENT_PRESETS)) {
      for (const preset of presets) {
        expect(lookup[theme][preset.id]).toBeDefined()
      }
    }
  })
})

describe('ACCENT_LOOKUP', () => {
  it('is pre-built and matches buildAccentLookup output', () => {
    const fresh = buildAccentLookup()
    expect(ACCENT_LOOKUP).toEqual(fresh)
  })
})
