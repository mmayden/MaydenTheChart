// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomSheet } from './BottomSheet'

// Mock motion/react — replaces animated components with plain divs
vi.mock('motion/react', async () => {
  const { forwardRef, createElement } = await import('react')
  return {
    AnimatePresence: ({ children }) => children,
    motion: {
      div: forwardRef(function MotionDiv(props, ref) {
        const { children, initial: I, animate: A, exit: E, transition: T, ...rest } = props
        return createElement('div', { ...rest, ref }, children)
      }),
    },
    useReducedMotion: () => false,
  }
})

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true })
})

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <BottomSheet isOpen={false} onClose={vi.fn()}>
        <p>Content</p>
      </BottomSheet>,
    )
    expect(container.textContent).toBe('')
  })

  it('renders children when open', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <p>Panel content</p>
      </BottomSheet>,
    )
    expect(screen.getByText('Panel content')).toBeTruthy()
  })

  it('renders a backdrop that calls onClose on click', () => {
    const onClose = vi.fn()
    const { container } = render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <p>Content</p>
      </BottomSheet>,
    )

    // Backdrop is the first div with the bg-black class
    const backdrop = container.querySelector('.bg-black\\/30')
    expect(backdrop).toBeTruthy()
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders a drag handle', () => {
    const { container } = render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <p>Content</p>
      </BottomSheet>,
    )
    expect(container.querySelector('.bottom-sheet-handle')).toBeTruthy()
  })

  it('has the bottom-sheet class on the sheet element', () => {
    const { container } = render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>
        <p>Content</p>
      </BottomSheet>,
    )
    expect(container.querySelector('.bottom-sheet')).toBeTruthy()
  })

  it('does not call onClose when content area is clicked', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <button>Action</button>
      </BottomSheet>,
    )
    fireEvent.click(screen.getByText('Action'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
