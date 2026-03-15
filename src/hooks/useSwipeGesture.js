/**
 * useSwipeGesture — Lightweight horizontal swipe detection hook.
 *
 * Only active on touch devices. Fires onSwipeLeft/onSwipeRight when a
 * horizontal swipe exceeds the threshold and is the dominant axis.
 *
 * @param {Object} opts
 * @param {Function} opts.onSwipeLeft  — called on left swipe
 * @param {Function} opts.onSwipeRight — called on right swipe
 * @param {number}   opts.threshold    — minimum px to trigger (default 50)
 */

import { useEffect, useRef } from 'react'

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 50 } = {}) {
  const startRef = useRef(null)

  useEffect(() => {
    // Only attach on touch devices
    if (!('ontouchstart' in window)) return

    function handleTouchStart(e) {
      const touch = e.touches[0]
      startRef.current = { x: touch.clientX, y: touch.clientY }
    }

    function handleTouchEnd(e) {
      if (!startRef.current) return
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - startRef.current.x
      const deltaY = touch.clientY - startRef.current.y
      startRef.current = null

      // Must be horizontally dominant
      if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY)) return

      // Don't swipe on scrollable content inside panels
      const target = e.target
      if (target.closest('[data-no-swipe]') || target.closest('.overflow-y-auto') || target.closest('.overflow-x-auto')) return

      if (deltaX > 0) {
        onSwipeRight?.()
      } else {
        onSwipeLeft?.()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, threshold])
}
