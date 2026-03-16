import { describe, it, expect, vi, beforeEach } from 'vitest'
import { captureSnapshot, copyToClipboard, downloadSnapshot } from './snapshot'

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

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('uses clipboard API when available', async () => {
    const blob = new Blob(['test'], { type: 'image/png' })
    const writeFn = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write: writeFn } })
    vi.stubGlobal('ClipboardItem', class { constructor(data) { this.data = data } })

    const result = await copyToClipboard(blob)
    expect(result).toBe('clipboard')
    expect(writeFn).toHaveBeenCalledOnce()
  })

  it('falls back to download when clipboard unavailable', async () => {
    const blob = new Blob(['test'], { type: 'image/png' })
    vi.stubGlobal('navigator', { clipboard: undefined })

    // Mock DOM for downloadSnapshot
    const clickFn = vi.fn()
    const mockAnchor = { href: '', download: '', style: {}, click: clickFn, remove: vi.fn() }
    const mockBody = { appendChild: vi.fn() }
    vi.stubGlobal('document', { createElement: () => mockAnchor, body: mockBody })
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:test', revokeObjectURL: vi.fn() })

    const result = await copyToClipboard(blob, 'test.png')
    expect(result).toBe('download')
    expect(clickFn).toHaveBeenCalledOnce()
  })

  it('falls back to download when clipboard.write throws', async () => {
    const blob = new Blob(['test'], { type: 'image/png' })
    vi.stubGlobal('navigator', { clipboard: { write: vi.fn().mockRejectedValue(new Error('denied')) } })
    vi.stubGlobal('ClipboardItem', class { constructor(data) { this.data = data } })

    const clickFn = vi.fn()
    const mockAnchor = { href: '', download: '', style: {}, click: clickFn, remove: vi.fn() }
    const mockBody = { appendChild: vi.fn() }
    vi.stubGlobal('document', { createElement: () => mockAnchor, body: mockBody })
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:test', revokeObjectURL: vi.fn() })

    const result = await copyToClipboard(blob, 'test.png')
    expect(result).toBe('download')
  })

  it('falls back to download when blob is null', async () => {
    const result = await copyToClipboard(null)
    expect(result).toBe('download')
  })
})

describe('downloadSnapshot', () => {
  it('does nothing if blob is null', () => {
    expect(() => downloadSnapshot(null)).not.toThrow()
    expect(() => downloadSnapshot(undefined)).not.toThrow()
  })
})
