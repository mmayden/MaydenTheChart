// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useChartStore } from '../../store/useChartStore'
import { useAlertsStore } from '../../store/useAlertsStore'
import { BottomNav } from './BottomNav'

// Wrap with QueryClientProvider since BottomNav uses useQueryClient
function renderNav() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <BottomNav />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useChartStore.setState({
    selectedSymbol: 'QQQ',
    selectedTimeframe: '5Min',
    activePanel: null,
    sidebarOpen: true,
  })
  useAlertsStore.setState({ alerts: [] })
})

describe('BottomNav', () => {
  it('renders timeframe pills', () => {
    renderNav()
    expect(screen.getByText('5m')).toBeTruthy()
    expect(screen.getByText('15m')).toBeTruthy()
    expect(screen.getByText('1D')).toBeTruthy()
  })

  it('highlights the active timeframe', () => {
    renderNav()
    const btn = screen.getByText('5m')
    expect(btn.className).toContain('text-accent')
  })

  it('switches timeframe on pill click', () => {
    renderNav()
    fireEvent.click(screen.getByText('15m'))
    expect(useChartStore.getState().selectedTimeframe).toBe('15Min')
  })

  it('has sidebar toggle button', () => {
    renderNav()
    const btn = screen.getByLabelText('Toggle sidebar')
    expect(btn).toBeTruthy()
  })

  it('toggles sidebar on hamburger click', () => {
    useChartStore.setState({ sidebarOpen: false })
    renderNav()
    fireEvent.click(screen.getByLabelText('Toggle sidebar'))
    expect(useChartStore.getState().sidebarOpen).toBe(true)
  })

  it('has alerts button with aria-label', () => {
    renderNav()
    const btn = screen.getByLabelText('Alerts')
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })

  it('shows alert count badge when alerts are active', () => {
    useAlertsStore.setState({
      alerts: [
        { id: '1', triggered: false },
        { id: '2', triggered: false },
        { id: '3', triggered: true }, // triggered = not active
      ],
    })
    renderNav()
    expect(screen.getByText('2')).toBeTruthy()
    // aria-label includes count
    expect(screen.getByLabelText('Alerts (2 active)')).toBeTruthy()
  })

  it('caps badge display at 9+', () => {
    const alerts = Array.from({ length: 12 }, (_, i) => ({ id: String(i), triggered: false }))
    useAlertsStore.setState({ alerts })
    renderNav()
    expect(screen.getByText('9+')).toBeTruthy()
  })

  it('opens alerts panel on alerts button click', () => {
    renderNav()
    fireEvent.click(screen.getByLabelText('Alerts'))
    expect(useChartStore.getState().activePanel).toBe('alerts')
  })

  it('has watchlist button with aria-pressed', () => {
    renderNav()
    const btn = screen.getByLabelText('Watchlist')
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })

  it('opens watchlist panel on click', () => {
    renderNav()
    fireEvent.click(screen.getByLabelText('Watchlist'))
    expect(useChartStore.getState().activePanel).toBe('watchlist')
  })

  it('has a "more panels" button', () => {
    renderNav()
    expect(screen.getByLabelText('More panels')).toBeTruthy()
  })

  it('shows backtest and journal in the more menu', () => {
    renderNav()
    fireEvent.click(screen.getByLabelText('More panels'))
    expect(screen.getByText('Backtest')).toBeTruthy()
    expect(screen.getByText('Journal')).toBeTruthy()
  })

  it('opens backtest panel from more menu', () => {
    renderNav()
    fireEvent.click(screen.getByLabelText('More panels'))
    fireEvent.click(screen.getByText('Backtest'))
    expect(useChartStore.getState().activePanel).toBe('backtest')
  })

  it('has mobile navigation aria-label', () => {
    renderNav()
    expect(screen.getByLabelText('Mobile navigation')).toBeTruthy()
  })
})
