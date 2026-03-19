import { useEffect } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus within a container element.
 * Tab / Shift+Tab cycle through focusable children without escaping.
 *
 * @param {React.RefObject} containerRef — ref to the dialog/modal element
 * @param {boolean} active — whether the trap is active
 */
export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    // Store the element that had focus before the trap activated
    const previouslyFocused = document.activeElement

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return

      const focusable = [...container.querySelectorAll(FOCUSABLE)]
        .filter((el) => el.offsetParent !== null) // visible only
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first || !container.contains(document.activeElement)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last || !container.contains(document.activeElement)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus when trap deactivates
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [containerRef, active])
}
