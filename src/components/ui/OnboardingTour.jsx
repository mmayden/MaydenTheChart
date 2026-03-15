/**
 * OnboardingTour — 4-step tooltip tour for first-time visitors.
 *
 * Steps:
 *   1. Day Type Banner  — "Today's market type"
 *   2. ATR Gauge         — "Range budget used"
 *   3. Presets           — "One-click indicator switching"
 *   4. Cmd+K            — "Power-user navigation"
 *
 * Uses `data-tour` attributes on target elements + getBoundingClientRect()
 * positioning. Saves `cheechart-onboarding-done` to localStorage on
 * completion or skip. Desktop only — mobile gets a welcome toast instead.
 */

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../store/useToastStore'

const STORAGE_KEY = 'cheechart-onboarding-done'

const STEPS = [
  {
    target: '[data-tour="day-type"]',
    title: 'Day Type',
    body: 'Shows today\'s market classification — trend, range, or reversal — based on prior day levels.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="atr-gauge"]',
    title: 'ATR Gauge',
    body: 'Tracks how much of the daily range budget has been consumed. Helps size expectations.',
    placement: 'right',
  },
  {
    target: '[data-tour="presets"]',
    title: 'Presets',
    body: 'Switch indicator sets with one click. Use [ ] keys to cycle through them.',
    placement: 'right',
  },
  {
    target: '[data-tour="cmd-k"]',
    title: 'Command Palette',
    body: 'Press Cmd+K to quickly search symbols, switch timeframes, toggle indicators, and more.',
    placement: 'bottom',
  },
]

function getRect(selector) {
  const el = document.querySelector(selector)
  if (!el) return null
  return el.getBoundingClientRect()
}

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [rect, setRect] = useState(null)
  const toast = useToast()

  // Check if tour should show
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return

    // Mobile — show a welcome toast instead of the tour
    if (window.innerWidth < 768) {
      localStorage.setItem(STORAGE_KEY, '1')
      toast.add({ message: 'Welcome to Cheechart! Use the top bar to explore panels and tools.', type: 'info', duration: 6000 })
      return
    }

    // Delay tour start to let the UI settle
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [toast])

  // Position tooltip on current step target
  useEffect(() => {
    if (!visible) return
    const current = STEPS[step]
    if (!current) return

    function updateRect() {
      setRect(getRect(current.target))
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [visible, step])

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }, [])

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) {
      finish()
    } else {
      setStep((s) => s + 1)
    }
  }, [step, finish])

  const skip = useCallback(() => {
    finish()
  }, [finish])

  if (!visible || !rect) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Calculate tooltip position based on placement, clamped to viewport
  const tooltipStyle = {}
  const OFFSET = 12
  const TOOLTIP_W = 288 // w-72 = 18rem = 288px
  const TOOLTIP_H = 180 // approximate max tooltip height
  const PADDING = 12

  function clampX(centerX) {
    return Math.max(PADDING, Math.min(centerX, window.innerWidth - TOOLTIP_W - PADDING))
  }
  function clampY(centerY) {
    return Math.max(PADDING, Math.min(centerY, window.innerHeight - TOOLTIP_H - PADDING))
  }

  switch (current.placement) {
    case 'bottom': {
      tooltipStyle.top = Math.min(rect.bottom + OFFSET, window.innerHeight - TOOLTIP_H - PADDING)
      tooltipStyle.left = clampX(rect.left + rect.width / 2 - TOOLTIP_W / 2)
      break
    }
    case 'right': {
      tooltipStyle.top = clampY(rect.top + rect.height / 2 - TOOLTIP_H / 2)
      tooltipStyle.left = rect.right + OFFSET
      break
    }
    case 'left': {
      tooltipStyle.top = clampY(rect.top + rect.height / 2 - TOOLTIP_H / 2)
      tooltipStyle.right = window.innerWidth - rect.left + OFFSET
      break
    }
    default: { // top
      tooltipStyle.bottom = Math.min(window.innerHeight - rect.top + OFFSET, window.innerHeight - PADDING)
      tooltipStyle.left = clampX(rect.left + rect.width / 2 - TOOLTIP_W / 2)
      break
    }
  }

  return (
    <>
      {/* Semi-transparent overlay with cutout for target element */}
      <div
        className="fixed inset-0 z-[200]"
        style={{ pointerEvents: 'none' }}
      >
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - 4}
                y={rect.top - 4}
                width={rect.width + 8}
                height={rect.height + 8}
                rx="6"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%" height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#tour-mask)"
          />
        </svg>
      </div>

      {/* Tooltip card */}
      <div
        className="fixed z-[201] w-72 rounded-lg border border-theme-mid shadow-xl"
        style={{
          ...tooltipStyle,
          backgroundColor: 'var(--bg-surface)',
          pointerEvents: 'auto',
        }}
      >
        <div className="p-4">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-widest text-theme-muted uppercase font-semibold">
              Step {step + 1} of {STEPS.length}
            </span>
            <button
              onClick={skip}
              className="text-[10px] text-theme-muted hover:text-theme transition-colors"
            >
              Skip tour
            </button>
          </div>

          {/* Content */}
          <div className="text-sm font-semibold text-theme mb-1">{current.title}</div>
          <p className="text-xs text-theme-muted leading-relaxed">{current.body}</p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            {/* Dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? 'bg-accent' : 'bg-theme-border'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="px-3 py-1 text-xs font-semibold rounded border border-accent text-accent hover:bg-accent-dim transition-colors"
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
