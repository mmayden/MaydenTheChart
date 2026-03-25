/**
 * BollingerOverlay — Bollinger Bands (20-period SMA ± 2σ).
 *
 * Renders middle (SMA), upper, and lower bands on the chart.
 * Complementary to VWAP bands — shows statistical extremes for mean reversion.
 */

import { useEffect, useRef } from 'react'
import { LineSeries } from 'lightweight-charts'
import { bollingerBands } from '../../utils/indicators'
import { BOLLINGER_MIDDLE_COLOR, BOLLINGER_BAND_COLOR } from '../../constants/chart'

export function BollingerOverlay({ chart, bars, visible }) {
  const middleRef = useRef(null)
  const upperRef  = useRef(null)
  const lowerRef  = useRef(null)
  const disposedRef = useRef(false)

  // Create series once when chart is available
  useEffect(() => {
    if (!chart) return
    disposedRef.current = false

    try {
      const middle = chart.addSeries(LineSeries, {
        color: BOLLINGER_MIDDLE_COLOR,
        lineWidth: 1,
        lineStyle: 0,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      })
      const upper = chart.addSeries(LineSeries, {
        color: BOLLINGER_BAND_COLOR,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      })
      const lower = chart.addSeries(LineSeries, {
        color: BOLLINGER_BAND_COLOR,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      })

      middleRef.current = middle
      upperRef.current  = upper
      lowerRef.current  = lower
    } catch { /* chart may be mid-teardown */ }

    return () => {
      disposedRef.current = true
      try {
        if (middleRef.current) chart.removeSeries(middleRef.current)
        if (upperRef.current)  chart.removeSeries(upperRef.current)
        if (lowerRef.current)  chart.removeSeries(lowerRef.current)
      } catch { /* chart may be destroyed */ }
      middleRef.current = null
      upperRef.current  = null
      lowerRef.current  = null
    }
  }, [chart])

  // Update data when bars change
  useEffect(() => {
    if (disposedRef.current || !bars?.length) return
    if (!middleRef.current || !upperRef.current || !lowerRef.current) return

    try {
      const { middle, upper, lower } = bollingerBands(bars)
      middleRef.current.setData(middle)
      upperRef.current.setData(upper)
      lowerRef.current.setData(lower)
    } catch { /* series may have been removed */ }
  }, [bars])

  // Toggle visibility without re-creating series
  useEffect(() => {
    if (disposedRef.current) return
    try {
      if (middleRef.current) middleRef.current.applyOptions({ visible })
      if (upperRef.current)  upperRef.current.applyOptions({ visible })
      if (lowerRef.current)  lowerRef.current.applyOptions({ visible })
    } catch { /* series may have been removed */ }
  }, [visible])

  return null
}
