/**
 * BollingerOverlay — Bollinger Bands (20-period SMA ± 2σ).
 *
 * Renders middle (SMA), upper, and lower bands on the chart.
 * Complementary to VWAP bands — shows statistical extremes for mean reversion.
 */

import { useEffect, useRef } from 'react'
import { bollingerBands } from '../../utils/indicators'
import { BOLLINGER_MIDDLE_COLOR, BOLLINGER_BAND_COLOR } from '../../constants/chart'

export function BollingerOverlay({ chart, bars, visible }) {
  const middleRef = useRef(null)
  const upperRef  = useRef(null)
  const lowerRef  = useRef(null)

  useEffect(() => {
    if (!chart || !visible) return

    const middle = chart.addLineSeries({
      color: BOLLINGER_MIDDLE_COLOR,
      lineWidth: 1,
      lineStyle: 0,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    const upper = chart.addLineSeries({
      color: BOLLINGER_BAND_COLOR,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    const lower = chart.addLineSeries({
      color: BOLLINGER_BAND_COLOR,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    middleRef.current = middle
    upperRef.current  = upper
    lowerRef.current  = lower

    return () => {
      try {
        chart.removeSeries(middle)
        chart.removeSeries(upper)
        chart.removeSeries(lower)
      } catch { /* chart may be destroyed */ }
      middleRef.current = null
      upperRef.current  = null
      lowerRef.current  = null
    }
  }, [chart, visible])

  useEffect(() => {
    if (!visible || !bars?.length) return
    if (!middleRef.current || !upperRef.current || !lowerRef.current) return

    const { middle, upper, lower } = bollingerBands(bars)
    middleRef.current.setData(middle)
    upperRef.current.setData(upper)
    lowerRef.current.setData(lower)
  }, [bars, visible])

  return null
}
