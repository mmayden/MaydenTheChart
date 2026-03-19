/**
 * useLongPress — Detects long-press (500ms) on touch devices.
 *
 * Returns a ref callback to attach to the target element.
 * Calls `onLongPress({ clientX, clientY })` when the user holds a touch
 * for 500ms without moving more than 10px.
 *
 * Does not interfere with normal taps, scrolls, or pans.
 */

import { useRef, useCallback } from 'react'

const LONG_PRESS_MS = 500
const MOVE_THRESHOLD = 10

export function useLongPress(onLongPress) {
  const timerRef  = useRef(null)
  const startRef  = useRef(null)
  const firedRef  = useRef(false)

  const clear = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = null
    startRef.current = null
    firedRef.current = false
  }, [])

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    startRef.current = { x: touch.clientX, y: touch.clientY }
    firedRef.current = false

    timerRef.current = setTimeout(() => {
      firedRef.current = true
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(30)
      onLongPress({
        clientX: startRef.current.x,
        clientY: startRef.current.y,
      })
    }, LONG_PRESS_MS)
  }, [onLongPress])

  const onTouchMove = useCallback((e) => {
    if (!startRef.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - startRef.current.x
    const dy = touch.clientY - startRef.current.y
    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
      clear()
    }
  }, [clear])

  const onTouchEnd = useCallback(() => {
    clear()
  }, [clear])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
