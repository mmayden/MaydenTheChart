/**
 * VolumeProfileOverlay — Renders horizontal volume histogram on the chart.
 *
 * Uses a lightweight-charts v5 series primitive (ISeriesPrimitive) to draw
 * directly on the chart canvas. Profile is computed over all loaded bars.
 *
 * Receives chart + candleSeries via props (same pattern as EMAOverlay).
 */

import { useEffect, useRef } from 'react'
import { volumeProfile } from '../../utils/volumeProfile'
import { VolumeProfilePrimitive } from '../../primitives/VolumeProfilePrimitive'

export function VolumeProfileOverlay({ candleSeries, bars, visible = true }) {
  const primitiveRef = useRef(null)

  // Attach primitive on mount
  useEffect(() => {
    if (!candleSeries) return

    const primitive = new VolumeProfilePrimitive()
    candleSeries.attachPrimitive(primitive)
    primitiveRef.current = primitive

    return () => {
      try { candleSeries.detachPrimitive(primitive) } catch { /* series may be destroyed */ }
      primitiveRef.current = null
    }
  }, [candleSeries])

  // Update data when bars change
  useEffect(() => {
    if (!bars?.length || !primitiveRef.current) return
    const profile = volumeProfile(bars)
    primitiveRef.current.setData(profile)
  }, [bars])

  // Toggle visibility
  useEffect(() => {
    if (primitiveRef.current) primitiveRef.current.setVisible(visible)
  }, [visible])

  return null // No DOM — purely draws on the chart canvas
}
