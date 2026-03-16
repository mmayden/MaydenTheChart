import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from './useToastStore'

beforeEach(() => {
  useToast.setState({ toasts: [] })
  vi.restoreAllMocks()
})

describe('useToastStore', () => {
  // ─── Default state ──────────────────────────────────────────────────────────

  it('starts with an empty toasts array', () => {
    expect(useToast.getState().toasts).toEqual([])
  })

  // ─── add ────────────────────────────────────────────────────────────────────

  it('add() appends a toast with generated id', () => {
    useToast.getState().add({ message: 'hello' })
    const { toasts } = useToast.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toMatchObject({ message: 'hello', type: 'info' })
    expect(typeof toasts[0].id).toBe('string')
    expect(toasts[0].createdAt).toBeGreaterThan(0)
  })

  it('add() defaults type to info', () => {
    useToast.getState().add({ message: 'test' })
    expect(useToast.getState().toasts[0].type).toBe('info')
  })

  it('add() respects custom type', () => {
    useToast.getState().add({ message: 'err', type: 'error' })
    expect(useToast.getState().toasts[0].type).toBe('error')
  })

  it('multiple toasts coexist', () => {
    const { add } = useToast.getState()
    add({ message: 'first' })
    add({ message: 'second', type: 'success' })
    add({ message: 'third', type: 'warning' })

    const { toasts } = useToast.getState()
    expect(toasts).toHaveLength(3)
    expect(toasts[0].message).toBe('first')
    expect(toasts[2].type).toBe('warning')
  })

  it('each toast gets a unique id', () => {
    const { add } = useToast.getState()
    add({ message: 'a' })
    add({ message: 'b' })
    const { toasts } = useToast.getState()
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })

  it('enforces max 5 visible toasts', () => {
    const { add } = useToast.getState()
    for (let i = 0; i < 7; i++) {
      add({ message: `toast ${i}` })
    }
    const { toasts } = useToast.getState()
    expect(toasts).toHaveLength(5)
    // oldest should be dropped — remaining are the last 5
    expect(toasts[0].message).toBe('toast 2')
    expect(toasts[4].message).toBe('toast 6')
  })

  it('auto-removes toast after duration', () => {
    vi.useFakeTimers()
    useToast.getState().add({ message: 'temp', duration: 1000 })
    expect(useToast.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(1000)
    expect(useToast.getState().toasts).toHaveLength(0)
    vi.useRealTimers()
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  it('remove() deletes the correct toast by id', () => {
    const { add } = useToast.getState()
    add({ message: 'keep' })
    add({ message: 'remove me' })

    const idToRemove = useToast.getState().toasts[1].id
    useToast.getState().remove(idToRemove)

    const { toasts } = useToast.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('keep')
  })

  it('remove() with non-existent id is a no-op', () => {
    useToast.getState().add({ message: 'stays' })
    useToast.getState().remove('non-existent')
    expect(useToast.getState().toasts).toHaveLength(1)
  })

  it('remove() on empty array is a no-op', () => {
    useToast.getState().remove('any-id')
    expect(useToast.getState().toasts).toEqual([])
  })
})
