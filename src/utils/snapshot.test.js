import { describe, it, expect, vi } from 'vitest'
import { captureSnapshot, downloadSnapshot } from './snapshot'

describe('captureSnapshot', () => {
  it('returns a blob from a canvas', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' })
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillText: vi.fn(),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    }
    const canvas = {
      getContext: () => mockCtx,
      width: 800,
      height: 600,
      toBlob: (cb) => cb(mockBlob),
    }

    const blob = await captureSnapshot(canvas, { symbol: 'QQQ', timeframe: '5m' })
    expect(blob).toBe(mockBlob)
    expect(mockCtx.fillText).toHaveBeenCalledOnce()
    // Watermark should contain symbol and timeframe
    const text = mockCtx.fillText.mock.calls[0][0]
    expect(text).toContain('QQQ')
    expect(text).toContain('5m')
    expect(text).toContain('cheechart.space')
  })

  it('returns null if canvas context unavailable', async () => {
    const canvas = { getContext: () => null }
    const result = await captureSnapshot(canvas, {})
    expect(result).toBeNull()
  })
})

describe('downloadSnapshot', () => {
  it('does nothing if blob is null', () => {
    // downloadSnapshot guards on !blob, so this should be a no-op
    expect(() => downloadSnapshot(null)).not.toThrow()
    expect(() => downloadSnapshot(undefined)).not.toThrow()
  })
})
