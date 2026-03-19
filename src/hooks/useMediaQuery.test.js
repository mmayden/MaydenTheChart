// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery, useIsMobile, useIsTablet, useIsLandscape } from './useMediaQuery'

// ─── matchMedia mock ────────────────────────────────────────────────────────

let listeners = []
let currentMatches = false

function mockMatchMedia(query) {
  const mql = {
    matches: currentMatches,
    media: query,
    addEventListener: vi.fn((_, cb) => listeners.push(cb)),
    removeEventListener: vi.fn((_, cb) => {
      listeners = listeners.filter((l) => l !== cb)
    }),
  }
  return mql
}

beforeEach(() => {
  listeners = []
  currentMatches = false
  window.matchMedia = vi.fn(mockMatchMedia)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── useMediaQuery ──────────────────────────────────────────────────────────

describe('useMediaQuery', () => {
  it('returns false when query does not match', () => {
    currentMatches = false
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)
  })

  it('returns true when query matches', () => {
    currentMatches = true
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(true)
  })

  it('updates when media query changes', () => {
    currentMatches = false
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)

    // Simulate viewport change
    act(() => {
      listeners.forEach((cb) => cb({ matches: true }))
    })
    expect(result.current).toBe(true)
  })

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    // matchMedia is called twice: once in useState initializer, once in useEffect
    const mql = window.matchMedia.mock.results[1].value
    expect(mql.addEventListener).toHaveBeenCalledTimes(1)

    unmount()
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1)
  })

  it('re-subscribes when query string changes', () => {
    const { rerender } = renderHook(
      ({ q }) => useMediaQuery(q),
      { initialProps: { q: '(max-width: 767px)' } },
    )
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')

    rerender({ q: '(min-width: 768px)' })
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)')
  })
})

// ─── Convenience hooks ──────────────────────────────────────────────────────

describe('useIsMobile', () => {
  it('queries max-width: 767px', () => {
    renderHook(() => useIsMobile())
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })
})

describe('useIsTablet', () => {
  it('queries 768px–1023px range', () => {
    renderHook(() => useIsTablet())
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px) and (max-width: 1023px)')
  })
})

describe('useIsLandscape', () => {
  it('queries orientation: landscape', () => {
    renderHook(() => useIsLandscape())
    expect(window.matchMedia).toHaveBeenCalledWith('(orientation: landscape)')
  })
})
