import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAlertsStore } from './useAlertsStore'

beforeEach(() => {
  useAlertsStore.setState({ alerts: [] })
})

describe('useAlertsStore', () => {
  // ─── Default state ──────────────────────────────────────────────────────────

  it('starts with an empty alerts array', () => {
    expect(useAlertsStore.getState().alerts).toEqual([])
  })

  // ─── addAlert ───────────────────────────────────────────────────────────────

  it('addAlert appends an alert with a generated id', () => {
    useAlertsStore.getState().addAlert({ type: 'price', price: 150, condition: 'above' })
    const { alerts } = useAlertsStore.getState()
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      type: 'price',
      price: 150,
      condition: 'above',
      triggered: false,
    })
    expect(alerts[0].id).toBeDefined()
    expect(typeof alerts[0].id).toBe('string')
  })

  it('addAlert sets triggered to false by default', () => {
    useAlertsStore.getState().addAlert({ type: 'price', price: 200, condition: 'below' })
    expect(useAlertsStore.getState().alerts[0].triggered).toBe(false)
  })

  it('multiple alerts can coexist', () => {
    const { addAlert } = useAlertsStore.getState()
    addAlert({ type: 'price', price: 100, condition: 'above' })
    addAlert({ type: 'candle-streak', count: 3, direction: 'green' })
    addAlert({ type: 'price', price: 50, condition: 'below' })

    const { alerts } = useAlertsStore.getState()
    expect(alerts).toHaveLength(3)
    expect(alerts[0].type).toBe('price')
    expect(alerts[1].type).toBe('candle-streak')
    expect(alerts[2].type).toBe('price')
  })

  it('each alert gets a unique id', () => {
    const { addAlert } = useAlertsStore.getState()
    addAlert({ type: 'price', price: 100, condition: 'above' })
    addAlert({ type: 'price', price: 200, condition: 'below' })

    const { alerts } = useAlertsStore.getState()
    expect(alerts[0].id).not.toBe(alerts[1].id)
  })

  // ─── removeAlert ────────────────────────────────────────────────────────────

  it('removeAlert removes the correct alert by id', () => {
    const { addAlert } = useAlertsStore.getState()
    addAlert({ type: 'price', price: 100, condition: 'above' })
    addAlert({ type: 'price', price: 200, condition: 'below' })

    const idToRemove = useAlertsStore.getState().alerts[0].id
    useAlertsStore.getState().removeAlert(idToRemove)

    const { alerts } = useAlertsStore.getState()
    expect(alerts).toHaveLength(1)
    expect(alerts[0].price).toBe(200)
  })

  it('removeAlert with non-existent id is a no-op', () => {
    useAlertsStore.getState().addAlert({ type: 'price', price: 100, condition: 'above' })
    useAlertsStore.getState().removeAlert('non-existent-id')

    expect(useAlertsStore.getState().alerts).toHaveLength(1)
  })

  it('removeAlert on empty array is a no-op', () => {
    useAlertsStore.getState().removeAlert('any-id')
    expect(useAlertsStore.getState().alerts).toEqual([])
  })

  // ─── markTriggered ──────────────────────────────────────────────────────────

  it('markTriggered sets triggered flag on the correct alert', () => {
    const { addAlert } = useAlertsStore.getState()
    addAlert({ type: 'price', price: 100, condition: 'above' })
    addAlert({ type: 'price', price: 200, condition: 'below' })

    const targetId = useAlertsStore.getState().alerts[0].id
    useAlertsStore.getState().markTriggered(targetId)

    const { alerts } = useAlertsStore.getState()
    expect(alerts[0].triggered).toBe(true)
    expect(alerts[1].triggered).toBe(false)
  })

  it('markTriggered does not remove the alert', () => {
    useAlertsStore.getState().addAlert({ type: 'price', price: 100, condition: 'above' })

    const id = useAlertsStore.getState().alerts[0].id
    useAlertsStore.getState().markTriggered(id)

    expect(useAlertsStore.getState().alerts).toHaveLength(1)
  })

  it('markTriggered with non-existent id leaves alerts unchanged', () => {
    useAlertsStore.getState().addAlert({ type: 'price', price: 100, condition: 'above' })
    const alertsBefore = useAlertsStore.getState().alerts

    useAlertsStore.getState().markTriggered('non-existent-id')

    const alertsAfter = useAlertsStore.getState().alerts
    expect(alertsAfter).toHaveLength(1)
    expect(alertsAfter[0].triggered).toBe(false)
  })

  // ─── Candle streak alerts ──────────────────────────────────────────────────

  it('supports candle-streak alert type', () => {
    useAlertsStore.getState().addAlert({ type: 'candle-streak', count: 5, direction: 'red' })
    const alert = useAlertsStore.getState().alerts[0]
    expect(alert).toMatchObject({
      type: 'candle-streak',
      count: 5,
      direction: 'red',
      triggered: false,
    })
  })
})
