/**
 * Weekly gap detection — identifies unfilled gaps between weekly candles.
 *
 * Trading rule (Rule 3): Weekly gaps almost always fill (same day or within 5-10 days).
 * Rare weekly gaps sitting below price are structurally bearish.
 *
 * A gap exists when there's no price overlap between consecutive weekly candles:
 *   - Gap up:   week[i+1].low  > week[i].high  (gap bottom = week[i].high, gap top = week[i+1].low)
 *   - Gap down: week[i+1].high < week[i].low   (gap top = week[i].low, gap bottom = week[i+1].high)
 *
 * A gap is "filled" when any bar's price range crosses through the entire gap zone.
 */

/**
 * Detect weekly gaps from weekly bar data.
 *
 * @param {Object[]} weeklyBars - Weekly candles [{ time, open, high, low, close }], sorted oldest→newest
 * @returns {Object[]} Array of gap objects: { top, bottom, time, direction, gapSize }
 */
export function detectWeeklyGaps(weeklyBars) {
  if (!weeklyBars || weeklyBars.length < 2) return []

  const gaps = []

  for (let i = 0; i < weeklyBars.length - 1; i++) {
    const curr = weeklyBars[i]
    const next = weeklyBars[i + 1]

    // Gap up: next bar's low is above current bar's high
    if (next.low > curr.high) {
      gaps.push({
        top:       next.low,
        bottom:    curr.high,
        time:      next.time,     // start of the gap week
        direction: 'up',
        gapSize:   next.low - curr.high,
      })
    }

    // Gap down: next bar's high is below current bar's low
    if (next.high < curr.low) {
      gaps.push({
        top:       curr.low,
        bottom:    next.high,
        time:      next.time,
        direction: 'down',
        gapSize:   curr.low - next.high,
      })
    }
  }

  return gaps
}

/**
 * Check which gaps have been filled by subsequent price action.
 *
 * A gap is filled when any bar's low ≤ gap.bottom AND high ≥ gap.top
 * (i.e., price traversed the entire gap zone within a single bar or across bars).
 *
 * For partial fills, we track the furthest penetration.
 *
 * @param {Object[]} gaps - Output from detectWeeklyGaps()
 * @param {Object[]} bars - Any-timeframe bars to check fill status against, sorted oldest→newest
 * @returns {Object[]} gaps with added fields: { filled, fillTime, fillPct }
 */
export function checkGapFills(gaps, bars) {
  if (!gaps.length || !bars?.length) return gaps.map((g) => ({ ...g, filled: false, fillTime: null, fillPct: 0 }))

  return gaps.map((gap) => {
    let filled = false
    let fillTime = null
    let maxPenetration = 0

    for (const bar of bars) {
      // Only check bars after the gap formed
      if (bar.time < gap.time) continue

      // Calculate how much of the gap has been penetrated
      const gapRange = gap.top - gap.bottom
      if (gapRange <= 0) continue

      let penetration = 0
      if (gap.direction === 'up') {
        // Gap up — price needs to come DOWN into the gap (bar.low must enter gap zone)
        if (bar.low <= gap.top) {
          penetration = Math.min(gap.top - bar.low, gapRange)
        }
      } else {
        // Gap down — price needs to come UP into the gap (bar.high must enter gap zone)
        if (bar.high >= gap.bottom) {
          penetration = Math.min(bar.high - gap.bottom, gapRange)
        }
      }

      const pct = penetration / gapRange
      if (pct > maxPenetration) {
        maxPenetration = pct
      }

      // Full fill: price crossed through entire gap
      if (pct >= 0.999) {
        filled = true
        fillTime = bar.time
        maxPenetration = 1
        break
      }
    }

    return {
      ...gap,
      filled,
      fillTime,
      fillPct: Math.round(maxPenetration * 100) / 100,
    }
  })
}
