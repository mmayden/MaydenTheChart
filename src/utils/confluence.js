/**
 * confluence.js — Weighted synthesis of all indicator signals into a single
 * "setup quality" score.
 *
 * No retail charting platform does this. TrendSpider charges $33/mo for
 * something similar but less integrated. We give it away.
 *
 * Weights:
 *   Day Type    — heavy  (3x)  Rule 1 backbone
 *   EMA Stack   — heavy  (3x)  Rule 2 direction confirmation
 *   VWAP        — medium (2x)  Rule 6 intraday pivot
 *   ATR Budget  — medium (2x)  Range exhaustion filter
 *   RSI         — light  (1x)  Momentum confirmation
 *   MACD        — light  (1x)  Trend confirmation
 *
 * Returns: { score, bias, level, reasons[], warnings[] }
 */

import { CONFLUENCE_WEIGHTS } from '../constants/chart'

const STRENGTH_SCORE = { strong: 3, moderate: 2, weak: 1 }
const W = CONFLUENCE_WEIGHTS

/**
 * Compute a weighted confluence score from all available indicator signals.
 *
 * @param {Object} params
 * @param {Object|null} params.dayType     — from classifyDayType()
 * @param {Object|null} params.ema9Signal  — signal from ema(bars, 9)
 * @param {Object|null} params.ema48Signal — signal from ema(bars, 48)
 * @param {Object|null} params.ema200Signal — signal from ema(bars, 200)
 * @param {Object|null} params.vwapSignal  — signal from vwapWithBands()
 * @param {Object|null} params.atrGauge    — from getDailyRangeStatus()
 * @param {Object|null} params.rsiSignal   — signal from rsi()
 * @param {Object|null} params.macdSignal  — signal from macd()
 * @returns {{ score: number, bias: string, level: string, reasons: string[], warnings: string[] }}
 */
export function confluenceScore({
  dayType = null,
  ema9Signal = null,
  ema48Signal = null,
  ema200Signal = null,
  vwapSignal = null,
  atrGauge = null,
  rsiSignal = null,
  macdSignal = null,
} = {}) {
  let bullPoints = 0
  let bearPoints = 0
  let totalWeight = 0
  const reasons = []
  const warnings = []

  // ── Day Type ───────────────────────────────────────────────────────────
  if (dayType) {
    const w = W.dayType
    totalWeight += w
    if (dayType.type === 'trend-bull') {
      bullPoints += w * 3
      reasons.push('Trend Day — Bullish (PDH broken)')
    } else if (dayType.type === 'trend-bear') {
      bearPoints += w * 3
      reasons.push('Trend Day — Bearish (PDL broken)')
    } else if (dayType.type === 'chop') {
      // Chop = both levels broken, uncertain — moderate warning
      bullPoints += w * 1
      bearPoints += w * 1
      warnings.push('Chop — both PDH and PDL broken')
    } else {
      // Range day = neutral
      bullPoints += w * 1
      bearPoints += w * 1
      reasons.push('Range Day — neither level broken')
    }
  }

  // ── EMA Stack ──────────────────────────────────────────────────────────
  // Strongest when all three EMAs agree: price > EMA9 > EMA48 > EMA200
  if (ema9Signal && ema48Signal) {
    const w = W.emaStack
    totalWeight += w
    const e9 = ema9Signal.bias
    const e48 = ema48Signal.bias
    const e200 = ema200Signal?.bias

    if (e9 === 'bull' && e48 === 'bull') {
      const s = e200 === 'bull' ? 3 : 2
      bullPoints += w * s
      reasons.push(e200 === 'bull' ? 'EMA stack aligned bullish (9>48>200)' : 'EMA 9 & 48 bullish')
    } else if (e9 === 'bear' && e48 === 'bear') {
      const s = e200 === 'bear' ? 3 : 2
      bearPoints += w * s
      reasons.push(e200 === 'bear' ? 'EMA stack aligned bearish (9<48<200)' : 'EMA 9 & 48 bearish')
    } else {
      // Mixed EMAs = weak/neutral
      bullPoints += w * 1
      bearPoints += w * 1
      warnings.push('EMA signals mixed — no clear direction')
    }
  }

  // ── VWAP ───────────────────────────────────────────────────────────────
  if (vwapSignal && vwapSignal.value !== null) {
    const w = W.vwap
    totalWeight += w
    const s = STRENGTH_SCORE[vwapSignal.strength] || 1
    if (vwapSignal.bias === 'bull') {
      bullPoints += w * s
      reasons.push('Price above VWAP')
    } else if (vwapSignal.bias === 'bear') {
      bearPoints += w * s
      reasons.push('Price below VWAP')
    } else {
      bullPoints += w * 1
      bearPoints += w * 1
    }
  }

  // ── ATR Budget ─────────────────────────────────────────────────────────
  if (atrGauge) {
    const w = W.atr
    totalWeight += w
    const pct = atrGauge.percentConsumed
    if (pct < 50) {
      bullPoints += w * 2
      bearPoints += w * 2
      reasons.push(`ATR ${Math.round(pct)}% used — range available`)
    } else if (pct < 80) {
      bullPoints += w * 1
      bearPoints += w * 1
      warnings.push(`ATR ${Math.round(pct)}% used — getting extended`)
    } else {
      // Penalize — range exhausted, neither side has room
      warnings.push(`ATR ${Math.round(pct)}% used — range exhausted`)
    }
  }

  // ── RSI ────────────────────────────────────────────────────────────────
  if (rsiSignal && rsiSignal.value !== null) {
    const w = W.rsi
    totalWeight += w
    const s = STRENGTH_SCORE[rsiSignal.strength] || 1

    if (rsiSignal.value > 70) {
      warnings.push(`RSI overbought (${rsiSignal.value.toFixed(0)})`)
      bearPoints += w * 1
    } else if (rsiSignal.value < 30) {
      warnings.push(`RSI oversold (${rsiSignal.value.toFixed(0)})`)
      bullPoints += w * 1
    } else if (rsiSignal.bias === 'bull') {
      bullPoints += w * s
    } else if (rsiSignal.bias === 'bear') {
      bearPoints += w * s
    }
  }

  // ── MACD ───────────────────────────────────────────────────────────────
  if (macdSignal && macdSignal.value !== null) {
    const w = W.macd
    totalWeight += w
    const s = STRENGTH_SCORE[macdSignal.strength] || 1
    if (macdSignal.bias === 'bull') {
      bullPoints += w * s
      if (macdSignal.strength === 'strong') reasons.push('MACD bullish crossover')
    } else if (macdSignal.bias === 'bear') {
      bearPoints += w * s
      if (macdSignal.strength === 'strong') reasons.push('MACD bearish crossover')
    }
  }

  // ── Compute final score ─────────────────────────────────────────────────
  if (totalWeight === 0) {
    return { score: 0, bias: 'neutral', level: 'none', reasons: [], warnings: ['No indicator data available'] }
  }

  // Max possible points per side: sum of (weight * 3) for each factor
  const maxPoints = totalWeight * 3
  const bullPct = (bullPoints / maxPoints) * 100
  const bearPct = (bearPoints / maxPoints) * 100

  // Dominant bias
  let bias = 'neutral'
  let dominantPct = Math.max(bullPct, bearPct)
  if (bullPoints > bearPoints * 1.2) bias = 'bull'
  else if (bearPoints > bullPoints * 1.2) bias = 'bear'

  // Score = how aligned the signals are (0-100)
  // High score = strong consensus. Low score = mixed/conflicting.
  const alignment = Math.abs(bullPoints - bearPoints)
  const score = Math.round(Math.min(100, (alignment / maxPoints) * 100 + dominantPct * 0.3))

  // Level thresholds
  let level = 'weak'
  if (score >= 70) level = 'strong'
  else if (score >= 45) level = 'moderate'

  return { score: Math.min(100, score), bias, level, reasons, warnings }
}
