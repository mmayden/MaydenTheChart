/**
 * BottomSheet — Draggable bottom sheet for mobile panels.
 *
 * Snap points: half (50%) and expanded (90%) of viewport height.
 * Drag handle at top. Drag down past threshold to dismiss.
 * Uses GPU-accelerated transform for 60fps. Respects prefers-reduced-motion.
 *
 * Props:
 *   isOpen      — whether the sheet is visible
 *   onClose     — called when dismissed (drag down or backdrop tap)
 *   children    — panel content
 */

import { useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react' // eslint-disable-line no-unused-vars -- motion used as JSX namespace

const SNAP_HALF     = 0.5   // 50% of viewport
const SNAP_EXPANDED = 0.9   // 90% of viewport
const DISMISS_THRESHOLD = 0.25 // drag below 25% = close

export function BottomSheet({ isOpen, onClose, children }) {
  const sheetRef     = useRef(null)
  const dragState    = useRef({ startY: 0, startHeight: 0, dragging: false })
  const currentSnap  = useRef(SNAP_HALF)
  const prefersReduced = useReducedMotion()

  // Set sheet height to a snap point
  const snapTo = useCallback((fraction) => {
    currentSnap.current = fraction
    if (sheetRef.current) {
      const h = Math.round(window.innerHeight * fraction)
      sheetRef.current.style.height = `${h}px`
      sheetRef.current.style.transition = prefersReduced ? 'none' : 'height 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
    }
  }, [prefersReduced])

  // Reset to half snap when opening
  useEffect(() => {
    if (isOpen) {
      // Small delay to let AnimatePresence mount the element
      requestAnimationFrame(() => snapTo(SNAP_HALF))
    }
  }, [isOpen, snapTo])

  // Drag handlers
  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    dragState.current = {
      startY: touch.clientY,
      startHeight: sheetRef.current?.offsetHeight ?? 0,
      dragging: true,
    }
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }, [])

  const onTouchMove = useCallback((e) => {
    if (!dragState.current.dragging) return
    const dy = dragState.current.startY - e.touches[0].clientY
    const newHeight = Math.max(0, Math.min(window.innerHeight * 0.95, dragState.current.startHeight + dy))
    if (sheetRef.current) sheetRef.current.style.height = `${newHeight}px`
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!dragState.current.dragging) return
    dragState.current.dragging = false

    const height = sheetRef.current?.offsetHeight ?? 0
    const fraction = height / window.innerHeight

    if (fraction < DISMISS_THRESHOLD) {
      onClose()
    } else if (fraction < (SNAP_HALF + SNAP_EXPANDED) / 2) {
      snapTo(SNAP_HALF)
    } else {
      snapTo(SNAP_EXPANDED)
    }
  }, [onClose, snapTo])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            className="fixed inset-0 bg-black/30 z-[49]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            className="bottom-sheet"
            initial={{ height: 0 }}
            animate={{ height: Math.round(window.innerHeight * SNAP_HALF) }}
            exit={{ height: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ willChange: 'height' }}
          >
            {/* Drag handle */}
            <div
              className="flex items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="bottom-sheet-handle" />
            </div>

            {/* Content */}
            <div
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
              style={{ height: 'calc(100% - 28px)' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
