/**
 * usePullToRefresh — Pull-down gesture to refresh data on touch devices.
 *
 * Activates when user pulls down from the top of the page (scrollTop === 0).
 * Shows a spinner indicator, triggers the provided onRefresh callback.
 * Touch-only — no-op on desktop. Uses transform-based animation for 60fps.
 *
 * @param {Object} opts
 * @param {Function} opts.onRefresh — async callback to run on pull-to-refresh
 * @param {number}   [opts.threshold=60] — px to pull before triggering
 * @returns {{ pullProgress: number, isRefreshing: boolean }}
 */

import { useState, useRef, useEffect, useCallback } from 'react'

const isTouchDevice = () => typeof window !== 'undefined' && 'ontouchstart' in window

export function usePullToRefresh({ onRefresh, threshold = 60 } = {}) {
  const [pullProgress, setPullProgress] = useState(0) // 0–1
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const pullProgressRef = useRef(0)
  const isRefreshingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  // Keep refs in sync with latest values
  onRefreshRef.current = onRefresh
  isRefreshingRef.current = isRefreshing

  // Sync pullProgress to ref whenever state changes
  useEffect(() => {
    pullProgressRef.current = pullProgress
  }, [pullProgress])

  const handleRefresh = useCallback(async () => {
    if (!onRefreshRef.current || isRefreshingRef.current) return
    setIsRefreshing(true)
    try {
      await onRefreshRef.current()
    } finally {
      setIsRefreshing(false)
      setPullProgress(0)
    }
  }, [])

  useEffect(() => {
    if (!isTouchDevice()) return

    function onTouchStart(e) {
      // Only activate when at the very top of the page
      if (window.scrollY > 0 || isRefreshingRef.current) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    function onTouchMove(e) {
      if (!pulling.current || isRefreshingRef.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy < 0) {
        pulling.current = false
        setPullProgress(0)
        return
      }
      const progress = Math.min(1, dy / threshold)
      setPullProgress(progress)
    }

    function onTouchEnd() {
      if (!pulling.current) return
      pulling.current = false
      if (pullProgressRef.current >= 1) {
        handleRefresh()
      } else {
        setPullProgress(0)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [threshold, handleRefresh])

  return { pullProgress, isRefreshing }
}
