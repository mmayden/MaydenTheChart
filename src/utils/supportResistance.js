/**
 * supportResistance.js — Pivot-based support & resistance detection.
 *
 * Algorithm:
 *   1. Scan bars for swing highs and swing lows using a lookback window
 *   2. Cluster nearby pivots (within clusterThreshold %) into zones
 *   3. Zone strength = number of pivots merged (more touches = stronger)
 *
 * All functions are pure — no side effects, no DOM access.
 */

/**
 * Detect swing highs and swing lows.
 *
 * A swing high at bar[i] means bar[i].high is the highest high
 * in the window [i - lookback, i + lookback].
 *
 * A swing low at bar[i] means bar[i].low is the lowest low
 * in the window [i - lookback, i + lookback].
 *
 * @param {Array<{time, high, low}>} bars - sorted oldest → newest
 * @param {number} lookback - bars to check left and right (default 10)
 * @returns {{ swingHighs: Array<{time, price}>, swingLows: Array<{time, price}> }}
 */
export function detectSwingPoints(bars, lookback = 10) {
  if (!bars || bars.length < lookback * 2 + 1) {
    return { swingHighs: [], swingLows: [] }
  }

  const swingHighs = []
  const swingLows = []

  for (let i = lookback; i < bars.length - lookback; i++) {
    let isSwingHigh = true
    let isSwingLow = true

    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue
      if (bars[j].high >= bars[i].high) isSwingHigh = false
      if (bars[j].low <= bars[i].low) isSwingLow = false
      if (!isSwingHigh && !isSwingLow) break
    }

    if (isSwingHigh) swingHighs.push({ time: bars[i].time, price: bars[i].high })
    if (isSwingLow) swingLows.push({ time: bars[i].time, price: bars[i].low })
  }

  return { swingHighs, swingLows }
}

/**
 * Cluster nearby price levels into zones.
 *
 * Pivots within `clusterThreshold` % of each other are merged.
 * The zone price is the average of all merged pivots.
 * Strength = number of pivots in the cluster.
 *
 * @param {Array<{time, price}>} pivots
 * @param {number} clusterThreshold - fraction (e.g. 0.001 = 0.1%)
 * @returns {Array<{price: number, strength: number, times: number[]}>}
 */
export function clusterPivots(pivots, clusterThreshold = 0.001) {
  if (!pivots || pivots.length === 0) return []

  // Sort by price
  const sorted = [...pivots].sort((a, b) => a.price - b.price)
  const clusters = []
  let current = { prices: [sorted[0].price], times: [sorted[0].time] }

  for (let i = 1; i < sorted.length; i++) {
    const avgPrice = current.prices.reduce((s, p) => s + p, 0) / current.prices.length
    const diff = Math.abs(sorted[i].price - avgPrice) / avgPrice

    if (diff <= clusterThreshold) {
      current.prices.push(sorted[i].price)
      current.times.push(sorted[i].time)
    } else {
      clusters.push(current)
      current = { prices: [sorted[i].price], times: [sorted[i].time] }
    }
  }
  clusters.push(current)

  return clusters.map((c) => ({
    price: c.prices.reduce((s, p) => s + p, 0) / c.prices.length,
    strength: c.prices.length,
    times: c.times,
  }))
}

/**
 * Find support and resistance levels from bar data.
 *
 * @param {Array<{time, high, low, close}>} bars - sorted oldest → newest
 * @param {number} lookback - swing detection window (default 10)
 * @param {number} clusterThreshold - clustering proximity (default 0.001 = 0.1%)
 * @returns {{
 *   support:    Array<{price, strength}>,
 *   resistance: Array<{price, strength}>,
 *   swingHighs: Array<{time, price}>,
 *   swingLows:  Array<{time, price}>
 * }}
 */
export function findSupportResistance(bars, lookback = 10, clusterThreshold = 0.001) {
  if (!bars || bars.length < lookback * 2 + 1) {
    return { support: [], resistance: [], swingHighs: [], swingLows: [] }
  }

  const { swingHighs, swingLows } = detectSwingPoints(bars, lookback)
  const lastPrice = bars[bars.length - 1].close

  // Cluster highs → resistance, lows → support
  const resistanceClusters = clusterPivots(swingHighs, clusterThreshold)
  const supportClusters = clusterPivots(swingLows, clusterThreshold)

  // Filter: resistance should be above current price, support below
  // But keep nearby zones too (within 2% of price) for context
  const resistance = resistanceClusters
    .filter((z) => z.price >= lastPrice * 0.998)
    .map((z) => ({ price: parseFloat(z.price.toFixed(2)), strength: z.strength }))
    .sort((a, b) => a.price - b.price)

  const support = supportClusters
    .filter((z) => z.price <= lastPrice * 1.002)
    .map((z) => ({ price: parseFloat(z.price.toFixed(2)), strength: z.strength }))
    .sort((a, b) => b.price - a.price)

  return { support, resistance, swingHighs, swingLows }
}
