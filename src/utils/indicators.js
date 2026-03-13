/**
 * indicators.js — Pure math for every indicator in MaydenTheChart.
 *
 * CONTRACT: Every exported function returns BOTH:
 *   series: [{ time, value }]  — ready for lightweight-charts series.setData()
 *   signal: { value, bias, strength } — ready for backtester / confluenceScore()
 *
 * This is non-negotiable. The live chart and backtester share identical math.
 * Never duplicate indicator logic elsewhere.
 *
 * All functions are pure — same inputs always produce same outputs.
 * No side effects, no external dependencies, no DOM access.
 */

// ─── EMA — Exponential Moving Average ────────────────────────────────────────

/**
 * Compute EMA for an array of bars.
 *
 * @param {Array<{time, close}>} bars - sorted oldest → newest
 * @param {number} period
 * @returns {{ series: Array<{time, value}>, signal: {value, bias, strength} }}
 */
export function ema(bars, period) {
  if (!bars || bars.length < period) {
    return { series: [], signal: { value: null, bias: 'neutral', strength: 'weak' } }
  }

  const multiplier = 2 / (period + 1)
  const series = []

  // Seed: SMA of first `period` closes
  let emaValue = bars.slice(0, period).reduce((sum, b) => sum + b.close, 0) / period
  series.push({ time: bars[period - 1].time, value: emaValue })

  for (let i = period; i < bars.length; i++) {
    emaValue = bars[i].close * multiplier + emaValue * (1 - multiplier)
    series.push({ time: bars[i].time, value: emaValue })
  }

  const lastBar   = bars[bars.length - 1]
  const lastEma   = series[series.length - 1].value
  const bias      = lastBar.close > lastEma ? 'bull' : lastBar.close < lastEma ? 'bear' : 'neutral'
  const pctDiff   = Math.abs((lastBar.close - lastEma) / lastEma)
  const strength  = pctDiff > 0.005 ? 'strong' : pctDiff > 0.002 ? 'moderate' : 'weak'

  return { series, signal: { value: lastEma, bias, strength } }
}

/**
 * Detect EMA 9 × EMA 48 crossovers.
 * Used to auto-annotate 4hr EMA cross arrows on the chart.
 *
 * @param {Array<{time, value}>} ema9Series
 * @param {Array<{time, value}>} ema48Series
 * @returns {Array<{time, direction: 'bull'|'bear'}>}
 */
export function detectEMACrosses(ema9Series, ema48Series) {
  const crosses = []

  // Build lookup map for ema48 by time
  const ema48Map = new Map(ema48Series.map((p) => [p.time, p.value]))

  for (let i = 1; i < ema9Series.length; i++) {
    const prev9  = ema9Series[i - 1].value
    const curr9  = ema9Series[i].value
    const prev48 = ema48Map.get(ema9Series[i - 1].time)
    const curr48 = ema48Map.get(ema9Series[i].time)

    if (prev48 == null || curr48 == null) continue

    const wasBelow = prev9 < prev48
    const isAbove  = curr9 > curr48

    const wasAbove = prev9 > prev48
    const isBelow  = curr9 < curr48

    if (wasBelow && isAbove) {
      crosses.push({ time: ema9Series[i].time, direction: 'bull' })
    } else if (wasAbove && isBelow) {
      crosses.push({ time: ema9Series[i].time, direction: 'bear' })
    }
  }

  return crosses
}

// ─── VWAP — Volume Weighted Average Price ────────────────────────────────────

/**
 * Compute VWAP + standard deviation bands for intraday bars.
 * Resets each day at session open (when date changes in bar timestamps).
 *
 * @param {Array<{time, open, high, low, close, volume}>} bars - sorted oldest → newest
 * @returns {{
 *   vwap:       Array<{time, value}>,
 *   band1Upper: Array<{time, value}>,
 *   band1Lower: Array<{time, value}>,
 *   band2Upper: Array<{time, value}>,
 *   band2Lower: Array<{time, value}>,
 *   signal:     {value, bias, strength}
 * }}
 */
export function vwapWithBands(bars) {
  if (!bars || bars.length === 0) {
    const empty = { series: [], signal: { value: null, bias: 'neutral', strength: 'weak' } }
    return {
      vwap: [], band1Upper: [], band1Lower: [],
      band2Upper: [], band2Lower: [],
      signal: empty.signal,
    }
  }

  const vwap       = []
  const band1Upper = []
  const band1Lower = []
  const band2Upper = []
  const band2Lower = []

  let sumTPV    = 0   // Σ(TP × Volume)
  let sumVol    = 0   // Σ(Volume)
  let sumTPV2   = 0   // Σ(TP² × Volume) — for variance formula
  let lastDate  = null

  for (const bar of bars) {
    // Reset at session boundary (new calendar date)
    const barDate = new Date(bar.time * 1000).toDateString()
    if (barDate !== lastDate) {
      sumTPV  = 0
      sumVol  = 0
      sumTPV2 = 0
      lastDate = barDate
    }

    const tp = (bar.high + bar.low + bar.close) / 3

    sumTPV  += tp * bar.volume
    sumVol  += bar.volume
    sumTPV2 += tp * tp * bar.volume

    if (sumVol === 0) continue

    const vwapVal  = sumTPV / sumVol
    const variance = sumTPV2 / sumVol - vwapVal * vwapVal
    const stdDev   = Math.sqrt(Math.max(variance, 0))

    vwap.push       ({ time: bar.time, value: vwapVal })
    band1Upper.push ({ time: bar.time, value: vwapVal + stdDev })
    band1Lower.push ({ time: bar.time, value: vwapVal - stdDev })
    band2Upper.push ({ time: bar.time, value: vwapVal + 2 * stdDev })
    band2Lower.push ({ time: bar.time, value: vwapVal - 2 * stdDev })
  }

  const lastBar    = bars[bars.length - 1]
  const lastVwap   = vwap.length ? vwap[vwap.length - 1].value : null
  const bias       = lastVwap == null ? 'neutral'
                   : lastBar.close > lastVwap ? 'bull'
                   : lastBar.close < lastVwap ? 'bear' : 'neutral'

  const pctDiff  = lastVwap ? Math.abs((lastBar.close - lastVwap) / lastVwap) : 0
  const strength = pctDiff > 0.005 ? 'strong' : pctDiff > 0.002 ? 'moderate' : 'weak'

  return {
    vwap, band1Upper, band1Lower, band2Upper, band2Lower,
    signal: { value: lastVwap, bias, strength },
  }
}

// ─── ATR — Average True Range ─────────────────────────────────────────────────

/**
 * Compute ATR using Wilder's smoothing (same as TradingView default).
 *
 * @param {Array<{time, high, low, close}>} bars - sorted oldest → newest
 * @param {number} period - default 14
 * @returns {{ series: Array<{time, value}>, signal: {value, bias, strength} }}
 */
export function atr(bars, period = 14) {
  if (!bars || bars.length < period + 1) {
    return { series: [], signal: { value: null, bias: 'neutral', strength: 'weak' } }
  }

  const series = []

  // Compute true ranges
  const trValues = []
  for (let i = 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low  - bars[i - 1].close),
    )
    trValues.push({ time: bars[i].time, tr })
  }

  // Seed: SMA of first `period` TRs
  let atrValue = trValues.slice(0, period).reduce((s, t) => s + t.tr, 0) / period
  series.push({ time: trValues[period - 1].time, value: atrValue })

  // Wilder's smoothing: ATR = (prev ATR × (period-1) + TR) / period
  for (let i = period; i < trValues.length; i++) {
    atrValue = (atrValue * (period - 1) + trValues[i].tr) / period
    series.push({ time: trValues[i].time, value: atrValue })
  }

  const lastAtr  = series[series.length - 1].value
  // ATR doesn't have a bull/bear bias — it measures volatility only
  const strength = lastAtr > 3 ? 'strong' : lastAtr > 1 ? 'moderate' : 'weak'

  return { series, signal: { value: lastAtr, bias: 'neutral', strength } }
}

/**
 * Compute daily range status vs. ATR budget.
 * Used by the ATR Gauge component.
 *
 * @param {Array<{time, high, low}>} todayBars - all bars for the current session
 * @param {number} atr14Value - the current ATR(14) dollar value
 * @returns {{ atrValue: number, rangeUsed: number, percentConsumed: number }}
 */
export function getDailyRangeStatus(todayBars, atr14Value) {
  if (!todayBars || todayBars.length === 0 || !atr14Value) {
    return { atrValue: atr14Value ?? 0, rangeUsed: 0, percentConsumed: 0 }
  }

  const sessionHigh = Math.max(...todayBars.map((b) => b.high))
  const sessionLow  = Math.min(...todayBars.map((b) => b.low))
  const rangeUsed   = sessionHigh - sessionLow
  const percentConsumed = (rangeUsed / atr14Value) * 100

  return { atrValue: atr14Value, rangeUsed, percentConsumed }
}

// ─── RVOL — Relative Volume ───────────────────────────────────────────────────

/**
 * Compute relative volume for each bar.
 * Highlights bars where volume is unusually high vs. recent average.
 *
 * @param {Array<{time, volume}>} bars - sorted oldest → newest
 * @param {number} period    - lookback for average volume (default 20)
 * @param {number} threshold - RVOL level that triggers highlight (default 1.5)
 * @returns {{ series: Array<{time, value, rvol, highlight}>, signal: {value, bias, strength} }}
 */
export function relativeVolume(bars, period = 20, threshold = 1.5) {
  if (!bars || bars.length < period + 1) {
    return { series: [], signal: { value: null, bias: 'neutral', strength: 'weak' } }
  }

  const series = []

  for (let i = period; i < bars.length; i++) {
    const window   = bars.slice(i - period, i)
    const avgVol   = window.reduce((s, b) => s + b.volume, 0) / period
    const rvol     = avgVol > 0 ? bars[i].volume / avgVol : 0
    const highlight = rvol >= threshold

    series.push({
      time:      bars[i].time,
      value:     bars[i].volume,
      rvol:      parseFloat(rvol.toFixed(2)),
      highlight,
    })
  }

  const last      = series[series.length - 1]
  const rvolVal   = last?.rvol ?? 0
  const bias      = rvolVal >= threshold ? 'bull' : 'neutral'   // high volume = conviction
  const strength  = rvolVal >= 2.0 ? 'strong' : rvolVal >= threshold ? 'moderate' : 'weak'

  return { series, signal: { value: rvolVal, bias, strength } }
}

// ─── RSI — Relative Strength Index ───────────────────────────────────────────

/**
 * Compute RSI using Wilder's smoothing (matches TradingView).
 *
 * @param {Array<{time, close}>} bars - sorted oldest → newest
 * @param {number} period - default 14
 * @returns {{ series: Array<{time, value}>, signal: {value, bias, strength} }}
 */
export function rsi(bars, period = 14) {
  if (!bars || bars.length < period + 1) {
    return { series: [], signal: { value: null, bias: 'neutral', strength: 'weak' } }
  }

  const series = []

  // First window: SMA seed
  let avgGain = 0
  let avgLoss = 0

  for (let i = 1; i <= period; i++) {
    const change = bars[i].close - bars[i - 1].close
    if (change > 0) avgGain += change
    else avgLoss += Math.abs(change)
  }

  avgGain /= period
  avgLoss /= period

  const firstRS  = avgLoss === 0 ? Infinity : avgGain / avgLoss
  const firstRsi = 100 - 100 / (1 + firstRS)
  series.push({ time: bars[period].time, value: parseFloat(firstRsi.toFixed(2)) })

  // Wilder's smoothing for remaining bars
  for (let i = period + 1; i < bars.length; i++) {
    const change = bars[i].close - bars[i - 1].close
    const gain   = change > 0 ? change : 0
    const loss   = change < 0 ? Math.abs(change) : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    const rs      = avgLoss === 0 ? Infinity : avgGain / avgLoss
    const rsiVal  = 100 - 100 / (1 + rs)
    series.push({ time: bars[i].time, value: parseFloat(rsiVal.toFixed(2)) })
  }

  const lastRsi  = series[series.length - 1].value
  const bias     = lastRsi > 50 ? 'bull' : lastRsi < 50 ? 'bear' : 'neutral'
  const strength = lastRsi > 70 || lastRsi < 30 ? 'strong'
                 : lastRsi > 60 || lastRsi < 40 ? 'moderate' : 'weak'

  return { series, signal: { value: lastRsi, bias, strength } }
}

// ─── MACD ─────────────────────────────────────────────────────────────────────

/**
 * Compute MACD line, signal line, and histogram.
 *
 * @param {Array<{time, close}>} bars - sorted oldest → newest
 * @param {number} fastPeriod   - default 12
 * @param {number} slowPeriod   - default 26
 * @param {number} signalPeriod - default 9
 * @returns {{
 *   macd:      Array<{time, value}>,
 *   signal:    Array<{time, value}>,
 *   histogram: Array<{time, value}>,
 *   signalObj: {value, bias, strength}
 * }}
 */
export function macd(bars, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const empty = {
    macd: [], signal: [], histogram: [],
    signalObj: { value: null, bias: 'neutral', strength: 'weak' },
  }

  if (!bars || bars.length < slowPeriod + signalPeriod) return empty

  // Compute fast and slow EMAs
  const fastEma = ema(bars, fastPeriod).series
  const slowEma = ema(bars, slowPeriod).series

  // MACD line = fast EMA - slow EMA (only where both exist)
  // slow EMA is shorter (fewer points), align by time
  const slowMap   = new Map(slowEma.map((p) => [p.time, p.value]))
  const macdLine  = fastEma
    .filter((p) => slowMap.has(p.time))
    .map((p) => ({ time: p.time, value: parseFloat((p.value - slowMap.get(p.time)).toFixed(4)) }))

  if (macdLine.length < signalPeriod) return empty

  // Signal line = EMA of MACD line
  const macdAsClose  = macdLine.map((p) => ({ time: p.time, close: p.value }))
  const signalLine   = ema(macdAsClose, signalPeriod).series

  // Histogram = MACD - signal
  const signalMap = new Map(signalLine.map((p) => [p.time, p.value]))
  const histogram = macdLine
    .filter((p) => signalMap.has(p.time))
    .map((p) => ({
      time:  p.time,
      value: parseFloat((p.value - signalMap.get(p.time)).toFixed(4)),
    }))

  // Signal object — based on histogram direction
  const lastHist = histogram[histogram.length - 1]?.value ?? 0
  const prevHist = histogram[histogram.length - 2]?.value ?? 0

  const bias     = lastHist > 0 ? 'bull' : lastHist < 0 ? 'bear' : 'neutral'
  const growing  = Math.abs(lastHist) > Math.abs(prevHist)
  const strength = Math.abs(lastHist) > 0.5 ? 'strong'
                 : Math.abs(lastHist) > 0.1 ? 'moderate' : 'weak'

  // Bonus: detect crossovers for signal strengthening
  const crossover = (prevHist < 0 && lastHist > 0) || (prevHist > 0 && lastHist < 0)
  const finalStrength = crossover ? 'strong' : growing ? strength : 'weak'

  return {
    macd:      macdLine,
    signal:    signalLine,
    histogram,
    signalObj: { value: lastHist, bias, strength: finalStrength },
  }
}
