/**
 * VolumeProfilePrimitive — lightweight-charts v5 ISeriesPrimitive implementation.
 *
 * Draws horizontal volume histogram bars directly on the chart canvas.
 * Attached to the candle series via `series.attachPrimitive(primitive)`.
 *
 * Renders in drawBackground so candles paint on top of the profile.
 */

import {
  VP_BULL_COLOR,
  VP_BEAR_COLOR,
  VP_POC_COLOR,
  VP_VA_OPACITY,
  VP_OUTSIDE_OPACITY,
  VP_MAX_WIDTH_FRACTION,
} from '../constants/chart'

// ─── Renderer ───────────────────────────────────────────────────────────────

class VolumeProfileRenderer {
  constructor(data) {
    this._data = data
  }

  drawBackground(target) {
    const { bins, pocVolume, series } = this._data
    if (!bins || bins.length === 0 || !series) return

    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      const chartWidth = mediaSize.width
      const maxBarWidth = chartWidth * VP_MAX_WIDTH_FRACTION

      for (const bin of bins) {
        const yTop    = series.priceToCoordinate(bin.priceTop)
        const yBottom = series.priceToCoordinate(bin.priceBottom)
        if (yTop === null || yBottom === null) continue

        const y      = Math.min(yTop, yBottom)
        const height = Math.max(Math.abs(yBottom - yTop), 1)

        // Bar width proportional to volume relative to POC
        const widthFraction = pocVolume > 0 ? bin.volume / pocVolume : 0
        const totalWidth    = maxBarWidth * widthFraction

        // Split into bull (left) and bear (right) portions
        const bullFraction = bin.volume > 0 ? bin.bullVolume / bin.volume : 0.5
        const bullWidth    = totalWidth * bullFraction
        const bearWidth    = totalWidth - bullWidth

        // Draw from right edge leftward
        const rightEdge = chartWidth - 4  // 4px margin from right edge

        // Determine opacity based on VA/POC status
        let opacity
        if (bin.isPOC) {
          opacity = 1.0
        } else if (bin.inVA) {
          opacity = VP_VA_OPACITY
        } else {
          opacity = VP_OUTSIDE_OPACITY
        }

        ctx.globalAlpha = opacity

        // Bull volume (drawn first, furthest from edge)
        if (bullWidth > 0.5) {
          ctx.fillStyle = VP_BULL_COLOR
          ctx.fillRect(rightEdge - totalWidth, y, bullWidth, height)
        }

        // Bear volume (drawn second, closest to edge)
        if (bearWidth > 0.5) {
          ctx.fillStyle = VP_BEAR_COLOR
          ctx.fillRect(rightEdge - bearWidth, y, bearWidth, height)
        }

        // POC highlight — thin bright line at POC row
        if (bin.isPOC) {
          ctx.fillStyle = VP_POC_COLOR
          ctx.globalAlpha = 0.9
          ctx.fillRect(rightEdge - totalWidth, y, totalWidth, Math.max(height, 2))
        }
      }

      ctx.globalAlpha = 1.0
    })
  }
}

// ─── Pane View ──────────────────────────────────────────────────────────────

class VolumeProfilePaneView {
  constructor(primitive) {
    this._primitive = primitive
    this._renderer = null
  }

  zOrder() {
    return 'bottom'
  }

  renderer() {
    if (!this._primitive._visible || !this._primitive._profileData) return null

    const bins      = this._primitive._profileData.series
    const pocVolume = this._primitive._pocVolume
    const series    = this._primitive._series

    this._renderer = new VolumeProfileRenderer({ bins, pocVolume, series })
    return this._renderer
  }
}

// ─── Primitive ──────────────────────────────────────────────────────────────

export class VolumeProfilePrimitive {
  constructor() {
    this._profileData  = null
    this._pocVolume    = 0
    this._visible      = true
    this._chart        = null
    this._series       = null
    this._requestUpdate = null
    this._paneView     = new VolumeProfilePaneView(this)
  }

  // Lifecycle — called by lightweight-charts when attached to a series
  attached({ chart, series, requestUpdate }) {
    this._chart        = chart
    this._series       = series
    this._requestUpdate = requestUpdate
  }

  detached() {
    this._chart        = null
    this._series       = null
    this._requestUpdate = null
  }

  // Called by the overlay component when bars change
  setData(profileResult) {
    this._profileData = profileResult
    // Find POC volume for normalization
    this._pocVolume = 0
    if (profileResult?.series) {
      for (const bin of profileResult.series) {
        if (bin.volume > this._pocVolume) this._pocVolume = bin.volume
      }
    }
    this._requestUpdate?.()
  }

  setVisible(v) {
    this._visible = v
    this._requestUpdate?.()
  }

  // ISeriesPrimitive interface
  updateAllViews() {
    // No-op — data is set externally via setData()
  }

  paneViews() {
    return [this._paneView]
  }

  // Don't affect price scale auto-scaling
  autoscaleInfo() {
    return null
  }
}
