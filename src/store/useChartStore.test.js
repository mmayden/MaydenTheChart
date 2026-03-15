import { describe, it, expect, beforeEach } from 'vitest'
import { useChartStore } from './useChartStore'

const defaultState = {
  theme: 'dark',
  selectedSymbol: 'QQQ',
  selectedTimeframe: '5Min',
  activePanel: null,
  indicators: {
    ema: true,
    vwap: true,
    rvol: true,
    rsi: true,
    macd: true,
    levels: true,
    sr: true,
  },
  wsStatus: 'disconnected',
  isMarketOpen: false,
}

beforeEach(() => {
  useChartStore.setState(defaultState)
})

describe('useChartStore', () => {
  // ─── Default state ──────────────────────────────────────────────────────────

  it('has correct default state values', () => {
    const state = useChartStore.getState()
    expect(state.theme).toBe('dark')
    expect(state.selectedSymbol).toBe('QQQ')
    expect(state.selectedTimeframe).toBe('5Min')
    expect(state.wsStatus).toBe('disconnected')
    expect(state.isMarketOpen).toBe(false)
  })

  it('has all indicators enabled by default', () => {
    const { indicators } = useChartStore.getState()
    expect(indicators.ema).toBe(true)
    expect(indicators.vwap).toBe(true)
    expect(indicators.rvol).toBe(true)
    expect(indicators.rsi).toBe(true)
    expect(indicators.macd).toBe(true)
    expect(indicators.levels).toBe(true)
    expect(indicators.sr).toBe(true)
  })

  // ─── setSymbol ──────────────────────────────────────────────────────────────

  it('setSymbol updates selectedSymbol', () => {
    useChartStore.getState().setSymbol('AAPL')
    expect(useChartStore.getState().selectedSymbol).toBe('AAPL')
  })

  it('setSymbol persists across multiple calls', () => {
    useChartStore.getState().setSymbol('AAPL')
    useChartStore.getState().setSymbol('TSLA')
    expect(useChartStore.getState().selectedSymbol).toBe('TSLA')
  })

  // ─── setTimeframe ──────────────────────────────────────────────────────────

  it('setTimeframe updates selectedTimeframe', () => {
    useChartStore.getState().setTimeframe('1Min')
    expect(useChartStore.getState().selectedTimeframe).toBe('1Min')
  })

  // ─── toggleIndicator ───────────────────────────────────────────────────────

  it('toggleIndicator turns off an enabled indicator', () => {
    useChartStore.getState().toggleIndicator('ema')
    expect(useChartStore.getState().indicators.ema).toBe(false)
  })

  it('toggleIndicator turns on a disabled indicator', () => {
    useChartStore.getState().toggleIndicator('ema')
    useChartStore.getState().toggleIndicator('ema')
    expect(useChartStore.getState().indicators.ema).toBe(true)
  })

  it('toggleIndicator only affects the targeted key', () => {
    useChartStore.getState().toggleIndicator('rsi')
    const { indicators } = useChartStore.getState()
    expect(indicators.rsi).toBe(false)
    expect(indicators.ema).toBe(true)
    expect(indicators.vwap).toBe(true)
    expect(indicators.macd).toBe(true)
  })

  it('toggleIndicator works for every indicator key', () => {
    const keys = ['ema', 'vwap', 'rvol', 'rsi', 'macd', 'levels', 'sr']
    for (const key of keys) {
      useChartStore.getState().toggleIndicator(key)
      expect(useChartStore.getState().indicators[key]).toBe(false)
    }
  })

  // ─── setTheme ───────────────────────────────────────────────────────────────

  it('setTheme changes theme to light', () => {
    useChartStore.getState().setTheme('light')
    expect(useChartStore.getState().theme).toBe('light')
  })

  it('setTheme changes theme back to dark', () => {
    useChartStore.getState().setTheme('light')
    useChartStore.getState().setTheme('dark')
    expect(useChartStore.getState().theme).toBe('dark')
  })

  // ─── WebSocket state ────────────────────────────────────────────────────────

  it('setWsStatus updates wsStatus', () => {
    useChartStore.getState().setWsStatus('authenticated')
    expect(useChartStore.getState().wsStatus).toBe('authenticated')
  })

  it('setMarketOpen updates isMarketOpen', () => {
    useChartStore.getState().setMarketOpen(true)
    expect(useChartStore.getState().isMarketOpen).toBe(true)
  })

  // ─── activePanel ───────────────────────────────────────────────────────────

  it('activePanel defaults to null', () => {
    expect(useChartStore.getState().activePanel).toBeNull()
  })

  it('setActivePanel opens a panel', () => {
    useChartStore.getState().setActivePanel('alerts')
    expect(useChartStore.getState().activePanel).toBe('alerts')
  })

  it('setActivePanel toggles same panel off', () => {
    useChartStore.getState().setActivePanel('alerts')
    useChartStore.getState().setActivePanel('alerts')
    expect(useChartStore.getState().activePanel).toBeNull()
  })

  it('setActivePanel switches to different panel', () => {
    useChartStore.getState().setActivePanel('alerts')
    useChartStore.getState().setActivePanel('backtest')
    expect(useChartStore.getState().activePanel).toBe('backtest')
  })

  it('closePanel sets activePanel to null', () => {
    useChartStore.getState().setActivePanel('journal')
    useChartStore.getState().closePanel()
    expect(useChartStore.getState().activePanel).toBeNull()
  })

  // ─── Independence ──────────────────────────────────────────────────────────

  it('setting symbol does not affect timeframe or indicators', () => {
    useChartStore.getState().setSymbol('SPY')
    const state = useChartStore.getState()
    expect(state.selectedTimeframe).toBe('5Min')
    expect(state.indicators.ema).toBe(true)
  })
})
