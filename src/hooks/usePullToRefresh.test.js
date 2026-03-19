// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePullToRefresh } from './usePullToRefresh'

// ─── Touch simulation helpers ───────────────────────────────────────────────

function touch(type, clientY) {
  const event = new Event(type, { bubbles: true })
  event.touches = [{ clientY }]
  document.dispatchEvent(event)
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Mark as touch device
  window.ontouchstart = true
  // Always at top of page
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
})

afterEach(() => {
  delete window.ontouchstart
  vi.restoreAllMocks()
})

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('usePullToRefresh', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => usePullToRefresh({ onRefresh: vi.fn() }))
    expect(result.current.pullProgress).toBe(0)
    expect(result.current.isRefreshing).toBe(false)
  })

  it('tracks pull progress during drag', () => {
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh: vi.fn(), threshold: 100 }),
    )

    act(() => {
      touch('touchstart', 0)
      touch('touchmove', 50) // 50% of threshold
    })
    expect(result.current.pullProgress).toBe(0.5)
  })

  it('clamps progress to 1', () => {
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh: vi.fn(), threshold: 60 }),
    )

    act(() => {
      touch('touchstart', 0)
      touch('touchmove', 200) // way past threshold
    })
    expect(result.current.pullProgress).toBe(1)
  })

  it('resets progress on upward swipe', () => {
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh: vi.fn(), threshold: 60 }),
    )

    act(() => {
      touch('touchstart', 100)
      touch('touchmove', 50) // dy < 0 = upward
    })
    expect(result.current.pullProgress).toBe(0)
  })

  it('triggers onRefresh when pulled past threshold', async () => {
    const onRefresh = vi.fn(() => Promise.resolve())
    renderHook(() =>
      usePullToRefresh({ onRefresh, threshold: 60 }),
    )

    // touchmove sets state → useEffect syncs pullProgressRef
    // Must flush before touchend reads the ref
    act(() => {
      touch('touchstart', 0)
      touch('touchmove', 60)
    })

    await act(async () => {
      touch('touchend', 60)
    })

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not trigger when pull is below threshold', async () => {
    const onRefresh = vi.fn()
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, threshold: 60 }),
    )

    await act(async () => {
      touch('touchstart', 0)
      touch('touchmove', 30) // only 50% of threshold
      touch('touchend', 30)
    })

    expect(onRefresh).not.toHaveBeenCalled()
    expect(result.current.pullProgress).toBe(0) // reset on release
  })

  it('resets progress after refresh completes', async () => {
    let resolveRefresh
    const onRefresh = vi.fn(() => new Promise((r) => { resolveRefresh = r }))
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, threshold: 60 }),
    )

    act(() => {
      touch('touchstart', 0)
      touch('touchmove', 60)
    })

    await act(async () => {
      touch('touchend', 60)
    })

    expect(result.current.isRefreshing).toBe(true)

    await act(async () => {
      resolveRefresh()
    })

    expect(result.current.isRefreshing).toBe(false)
    expect(result.current.pullProgress).toBe(0)
  })

  it('ignores touch when page is scrolled down', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
    const onRefresh = vi.fn()
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, threshold: 60 }),
    )

    act(() => {
      touch('touchstart', 0)
      touch('touchmove', 100)
      touch('touchend', 100)
    })

    expect(result.current.pullProgress).toBe(0)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('is a no-op on non-touch devices', () => {
    delete window.ontouchstart
    const onRefresh = vi.fn()
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, threshold: 60 }),
    )

    act(() => {
      touch('touchstart', 0)
      touch('touchmove', 100)
      touch('touchend', 100)
    })

    expect(result.current.pullProgress).toBe(0)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('cleans up listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() =>
      usePullToRefresh({ onRefresh: vi.fn() }),
    )

    unmount()

    const removedEvents = removeSpy.mock.calls.map((c) => c[0])
    expect(removedEvents).toContain('touchstart')
    expect(removedEvents).toContain('touchmove')
    expect(removedEvents).toContain('touchend')
  })
})
