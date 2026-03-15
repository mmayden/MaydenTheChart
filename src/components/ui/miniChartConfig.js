/**
 * Shared configuration for RSI and MACD mini chart instances.
 */

import { CHART_BG_COLOR, GRID_COLOR, CROSSHAIR_COLOR } from '../../constants/chart'

export const MINI_CHART_OPTS = {
  layout: {
    background: { color: CHART_BG_COLOR },
    textColor:  CROSSHAIR_COLOR,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  grid: {
    vertLines: { color: '#111827' },
    horzLines: { color: '#111827' },
  },
  crosshair: {
    vertLine: { color: CROSSHAIR_COLOR, labelBackgroundColor: GRID_COLOR },
    horzLine: { color: CROSSHAIR_COLOR, labelBackgroundColor: GRID_COLOR },
  },
  rightPriceScale: { borderColor: GRID_COLOR },
  timeScale:       { borderColor: GRID_COLOR, timeVisible: true, secondsVisible: false, visible: false },
  handleScroll:    false,
  handleScale:     false,
}
