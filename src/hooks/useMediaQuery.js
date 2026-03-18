/**
 * useMediaQuery — Reactive media query hook.
 *
 * Wraps window.matchMedia with React state so components re-render
 * when the viewport crosses a breakpoint. SSR-safe (defaults to false).
 *
 * Convenience exports:
 *   useIsMobile()    — max-width: 767px
 *   useIsTablet()    — 768px–1023px
 *   useIsLandscape() — orientation: landscape
 */

import { useState, useEffect } from 'react'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    function onChange(e) { setMatches(e.matches) }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useIsMobile()    { return useMediaQuery('(max-width: 767px)') }
export function useIsTablet()    { return useMediaQuery('(min-width: 768px) and (max-width: 1023px)') }
export function useIsLandscape() { return useMediaQuery('(orientation: landscape)') }
