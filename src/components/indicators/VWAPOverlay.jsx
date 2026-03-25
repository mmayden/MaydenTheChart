/**
 * VWAPOverlay — VWAP line + 1σ and 2σ bands.
 * Only shown on intraday timeframes per the trading system rules.
 * Hidden automatically on 4h/1D.
 */

import { useEffect, useRef } from 'react'
import { LineSeries } from 'lightweight-charts'
import { vwapWithBands } from '../../utils/indicators'
import {
  VWAP_COLOR,
  VWAP_BAND1_COLOR,
  VWAP_BAND2_COLOR,
} from '../../constants/chart'

const SERIES_CONFIG = [
  { key: 'vwap',       color: VWAP_COLOR,       lineWidth: 2, lineStyle: 0, label: 'VWAP'      },
  { key: 'band1Upper', color: VWAP_BAND1_COLOR,  lineWidth: 1, lineStyle: 1, label: 'VWAP +1σ'  },
  { key: 'band1Lower', color: VWAP_BAND1_COLOR,  lineWidth: 1, lineStyle: 1, label: 'VWAP -1σ'  },
  { key: 'band2Upper', color: VWAP_BAND2_COLOR,  lineWidth: 1, lineStyle: 2, label: 'VWAP +2σ'  },
  { key: 'band2Lower', color: VWAP_BAND2_COLOR,  lineWidth: 1, lineStyle: 2, label: 'VWAP -2σ'  },
]

export function VWAPOverlay({ chart, bars, visible = true }) {
  const seriesRef = useRef({})
  const disposedRef = useRef(false)

  useEffect(() => {
    if (!chart) return
    disposedRef.current = false

    try {
      for (const cfg of SERIES_CONFIG) {
        const series = chart.addSeries(LineSeries, {
          color:          cfg.color,
          lineWidth:      cfg.lineWidth,
          lineStyle:      cfg.lineStyle,
          priceLineVisible:     false,
          lastValueVisible:     false,
          crosshairMarkerVisible: false,
        })
        seriesRef.current[cfg.key] = series
      }
    } catch { /* chart may be mid-teardown */ }

    return () => {
      disposedRef.current = true
      for (const cfg of SERIES_CONFIG) {
        if (seriesRef.current[cfg.key]) {
          try { chart.removeSeries(seriesRef.current[cfg.key]) } catch (_) {}
        }
      }
      seriesRef.current = {}
    }
  }, [chart])

  useEffect(() => {
    if (disposedRef.current || !bars || bars.length === 0) return

    try {
      const result = vwapWithBands(bars)
      for (const cfg of SERIES_CONFIG) {
        const series = seriesRef.current[cfg.key]
        if (!series) continue
        series.setData(result[cfg.key] ?? [])
      }
    } catch { /* series may have been removed */ }
  }, [bars])

  useEffect(() => {
    if (disposedRef.current) return
    try {
      for (const cfg of SERIES_CONFIG) {
        const series = seriesRef.current[cfg.key]
        if (series) series.applyOptions({ visible })
      }
    } catch { /* series may have been removed */ }
  }, [visible])

  return null
}
