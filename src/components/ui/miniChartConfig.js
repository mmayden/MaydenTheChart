/**
 * Shared configuration for RSI and MACD mini chart instances.
 */

import { CHART_BG_COLOR, CROSSHAIR_COLOR } from '../../constants/chart'

export const MINI_CHART_OPTS = {
  layout: {
    background: { color: CHART_BG_COLOR },
    textColor:  '#6b7280',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:   10,
  },
  grid: {
    vertLines: { visible: false },
    horzLines: { color: '#111827', style: 1 },  // dotted
  },
  crosshair: {
    vertLine: { color: CROSSHAIR_COLOR, labelBackgroundColor: '#1f2937' },
    horzLine: { color: CROSSHAIR_COLOR, labelBackgroundColor: '#1f2937' },
  },
  rightPriceScale: { borderColor: 'transparent', borderVisible: false, minimumWidth: 55 },
  timeScale:       { borderColor: 'transparent', borderVisible: false, timeVisible: true, secondsVisible: false, visible: false },
  handleScroll:    false,
  handleScale:     false,
}
