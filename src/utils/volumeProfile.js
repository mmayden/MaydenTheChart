/**
 * Volume Profile — computes horizontal volume distribution across price levels.
 *
 * Divides the price range into equal-sized bins and aggregates volume at each level.
 * Identifies POC (Point of Control) and Value Area (70% of total volume around POC).
 *
 * Returns { series, signal } per the project indicator contract.
 */

const DEFAULT_NUM_BINS = 70
const VALUE_AREA_PCT = 0.70

/**
 * Compute volume profile from OHLCV bars.
 *
 * @param {Array<{time,open,high,low,close,volume}>} bars
 * @param {number} numBins - Number of price rows (default 70)
 * @returns {{ series: Array, signal: object }}
 */
export function volumeProfile(bars, numBins = DEFAULT_NUM_BINS) {
  if (!bars || bars.length < 2) {
    return { series: [], signal: { value: 0, bias: 'neutral', strength: 'weak' } }
  }

  // 1. Find overall high/low
  let priceHigh = -Infinity
  let priceLow  = Infinity
  for (const bar of bars) {
    if (bar.high > priceHigh) priceHigh = bar.high
    if (bar.low  < priceLow)  priceLow  = bar.low
  }

  if (priceHigh === priceLow || !isFinite(priceHigh) || !isFinite(priceLow)) {
    return { series: [], signal: { value: 0, bias: 'neutral', strength: 'weak' } }
  }

  const binSize = (priceHigh - priceLow) / numBins

  // 2. Initialize bins
  const bins = []
  for (let i = 0; i < numBins; i++) {
    const bottom = priceLow + i * binSize
    const top    = bottom + binSize
    bins.push({
      priceBottom: bottom,
      priceTop:    top,
      priceMid:    (bottom + top) / 2,
      volume:      0,
      bullVolume:  0,
      bearVolume:  0,
    })
  }

  // 3. Distribute each bar's volume across the bins it spans
  let totalVolume = 0
  for (const bar of bars) {
    const vol = bar.volume || 0
    if (vol <= 0) continue
    totalVolume += vol

    const isBull = bar.close >= bar.open

    // Which bins does this bar span?
    const lowBin  = Math.max(0, Math.floor((bar.low - priceLow) / binSize))
    const highBin = Math.min(numBins - 1, Math.floor((bar.high - priceLow) / binSize))

    // Range of price this bar covers
    const barRange = bar.high - bar.low
    if (barRange <= 0) {
      // Single-price bar — all volume goes to one bin
      const idx = Math.min(numBins - 1, Math.max(0, Math.floor((bar.close - priceLow) / binSize)))
      bins[idx].volume += vol
      if (isBull) bins[idx].bullVolume += vol
      else        bins[idx].bearVolume += vol
      continue
    }

    // Distribute proportionally based on overlap
    for (let i = lowBin; i <= highBin; i++) {
      const overlapLow  = Math.max(bar.low, bins[i].priceBottom)
      const overlapHigh = Math.min(bar.high, bins[i].priceTop)
      const overlap     = Math.max(0, overlapHigh - overlapLow)
      const fraction    = overlap / barRange
      const allocated   = vol * fraction

      bins[i].volume += allocated
      if (isBull) bins[i].bullVolume += allocated
      else        bins[i].bearVolume += allocated
    }
  }

  // 4. Find POC (bin with highest total volume)
  let pocIndex = 0
  let pocVolume = 0
  for (let i = 0; i < bins.length; i++) {
    if (bins[i].volume > pocVolume) {
      pocVolume = bins[i].volume
      pocIndex  = i
    }
  }

  // 5. Value Area — expand outward from POC until 70% of total volume captured
  const vaTarget = totalVolume * VALUE_AREA_PCT
  let vaVolume = bins[pocIndex].volume
  let vaLowIdx  = pocIndex
  let vaHighIdx = pocIndex

  while (vaVolume < vaTarget && (vaLowIdx > 0 || vaHighIdx < numBins - 1)) {
    const belowVol = vaLowIdx > 0 ? bins[vaLowIdx - 1].volume : 0
    const aboveVol = vaHighIdx < numBins - 1 ? bins[vaHighIdx + 1].volume : 0

    if (belowVol === 0 && aboveVol === 0) break

    if (belowVol >= aboveVol && vaLowIdx > 0) {
      vaLowIdx--
      vaVolume += bins[vaLowIdx].volume
    } else if (vaHighIdx < numBins - 1) {
      vaHighIdx++
      vaVolume += bins[vaHighIdx].volume
    } else {
      vaLowIdx--
      vaVolume += bins[vaLowIdx].volume
    }
  }

  const vaHigh = bins[vaHighIdx].priceTop
  const vaLow  = bins[vaLowIdx].priceBottom
  const poc    = bins[pocIndex]

  // 6. Mark bins with their position relative to VA
  const profileBins = bins.map((bin, i) => ({
    ...bin,
    isPOC:     i === pocIndex,
    inVA:      i >= vaLowIdx && i <= vaHighIdx,
  }))

  // 7. Signal — bias based on where current price sits relative to POC
  const lastClose = bars[bars.length - 1].close
  const bias = lastClose > poc.priceMid ? 'bull' : lastClose < poc.priceMid ? 'bear' : 'neutral'
  const totalBullVol = bins.reduce((s, b) => s + b.bullVolume, 0)
  const totalBearVol = bins.reduce((s, b) => s + b.bearVolume, 0)
  const volRatio = totalBullVol / (totalBearVol || 1)
  const strength = volRatio > 1.5 || volRatio < 0.67 ? 'strong' : volRatio > 1.2 || volRatio < 0.83 ? 'moderate' : 'weak'

  return {
    series: profileBins,
    signal: {
      value:    poc.priceMid,
      bias,
      strength,
      poc:      poc.priceMid,
      vaHigh,
      vaLow,
      totalVolume,
    },
  }
}
