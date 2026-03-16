import { describe, it, expect } from 'vitest'
import { confluenceScore } from './confluence'

// ── Helpers ─────────────────────────────────────────────────────────────────

const bullSignal = (strength = 'strong') => ({ value: 1, bias: 'bull', strength })
const bearSignal = (strength = 'strong') => ({ value: 1, bias: 'bear', strength })
const neutralSignal = () => ({ value: 1, bias: 'neutral', strength: 'weak' }) // eslint-disable-line no-unused-vars -- kept for test readability

const trendBull = { type: 'trend-bull', brokePDH: true, brokePDL: false, label: '', color: '' }
const trendBear = { type: 'trend-bear', brokePDH: false, brokePDL: true, label: '', color: '' }
const chop = { type: 'chop', brokePDH: true, brokePDL: true, label: '', color: '' }
const range = { type: 'range', brokePDH: false, brokePDL: false, label: '', color: '' }

const atrFresh = { atrValue: 5, rangeUsed: 2, percentConsumed: 40 }
const atrExtended = { atrValue: 5, rangeUsed: 4, percentConsumed: 80 }
const atrMid = { atrValue: 5, rangeUsed: 3, percentConsumed: 60 }

// ── Tests ───────────────────────────────────────────────────────────────────

describe('confluenceScore', () => {
  // ── No data ──
  it('returns neutral with no inputs', () => {
    const result = confluenceScore()
    expect(result.score).toBe(0)
    expect(result.bias).toBe('neutral')
    expect(result.level).toBe('none')
    expect(result.warnings).toContain('No indicator data available')
  })

  it('returns neutral with empty object', () => {
    const result = confluenceScore({})
    expect(result.bias).toBe('neutral')
  })

  // ── All bull ──
  it('returns strong bull when all indicators align bullish', () => {
    const result = confluenceScore({
      dayType: trendBull,
      ema9Signal: bullSignal(),
      ema48Signal: bullSignal(),
      ema200Signal: bullSignal(),
      vwapSignal: bullSignal(),
      atrGauge: atrFresh,
      rsiSignal: { value: 60, bias: 'bull', strength: 'moderate' },
      macdSignal: bullSignal(),
    })
    expect(result.bias).toBe('bull')
    expect(result.level).toBe('strong')
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  // ── All bear ──
  it('returns strong bear when all indicators align bearish', () => {
    const result = confluenceScore({
      dayType: trendBear,
      ema9Signal: bearSignal(),
      ema48Signal: bearSignal(),
      ema200Signal: bearSignal(),
      vwapSignal: bearSignal(),
      atrGauge: atrFresh,
      rsiSignal: { value: 40, bias: 'bear', strength: 'moderate' },
      macdSignal: bearSignal(),
    })
    expect(result.bias).toBe('bear')
    expect(result.level).toBe('strong')
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  // ── Mixed signals ──
  it('returns weak/neutral when signals conflict', () => {
    const result = confluenceScore({
      dayType: trendBull,
      ema9Signal: bearSignal(),
      ema48Signal: bearSignal(),
      vwapSignal: bearSignal(),
      rsiSignal: { value: 55, bias: 'bull', strength: 'weak' },
      macdSignal: bullSignal(),
    })
    // Bull day type but bear EMA+VWAP = mixed
    expect(result.score).toBeLessThan(70)
  })

  // ── Chop day ──
  it('warns on chop day', () => {
    const result = confluenceScore({
      dayType: chop,
      ema9Signal: bullSignal(),
      ema48Signal: bullSignal(),
    })
    expect(result.warnings).toContain('Chop — both PDH and PDL broken')
  })

  // ── Range day ──
  it('identifies range day', () => {
    const result = confluenceScore({
      dayType: range,
    })
    expect(result.reasons).toContain('Range Day — neither level broken')
  })

  // ── ATR warnings ──
  it('warns when ATR range is extended', () => {
    const result = confluenceScore({
      atrGauge: atrMid,
    })
    expect(result.warnings.some((w) => w.includes('getting extended'))).toBe(true)
  })

  it('warns when ATR range is exhausted', () => {
    const result = confluenceScore({
      atrGauge: atrExtended,
    })
    expect(result.warnings.some((w) => w.includes('range exhausted'))).toBe(true)
  })

  it('gives positive signal when ATR range is fresh', () => {
    const result = confluenceScore({
      atrGauge: atrFresh,
    })
    expect(result.reasons.some((r) => r.includes('range available'))).toBe(true)
  })

  // ── RSI extremes ──
  it('warns on RSI overbought', () => {
    const result = confluenceScore({
      rsiSignal: { value: 75, bias: 'bull', strength: 'strong' },
    })
    expect(result.warnings.some((w) => w.includes('overbought'))).toBe(true)
  })

  it('warns on RSI oversold', () => {
    const result = confluenceScore({
      rsiSignal: { value: 25, bias: 'bear', strength: 'strong' },
    })
    expect(result.warnings.some((w) => w.includes('oversold'))).toBe(true)
  })

  // ── EMA stack ──
  it('recognizes full EMA stack alignment', () => {
    const result = confluenceScore({
      ema9Signal: bullSignal(),
      ema48Signal: bullSignal(),
      ema200Signal: bullSignal(),
    })
    expect(result.reasons.some((r) => r.includes('9>48>200'))).toBe(true)
  })

  it('identifies mixed EMA signals', () => {
    const result = confluenceScore({
      ema9Signal: bullSignal(),
      ema48Signal: bearSignal(),
    })
    expect(result.warnings.some((w) => w.includes('mixed'))).toBe(true)
  })

  // ── MACD crossover ──
  it('reports strong MACD crossover', () => {
    const result = confluenceScore({
      macdSignal: { value: 0.5, bias: 'bull', strength: 'strong' },
    })
    expect(result.reasons).toContain('MACD bullish crossover')
  })

  // ── Partial data ──
  it('works with only day type provided', () => {
    const result = confluenceScore({ dayType: trendBull })
    expect(result.bias).toBe('bull')
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('works with only VWAP provided', () => {
    const result = confluenceScore({ vwapSignal: bullSignal() })
    expect(result.bias).toBe('bull')
  })

  // ── Score bounds ──
  it('score never exceeds 100', () => {
    const result = confluenceScore({
      dayType: trendBull,
      ema9Signal: bullSignal(),
      ema48Signal: bullSignal(),
      ema200Signal: bullSignal(),
      vwapSignal: bullSignal(),
      atrGauge: atrFresh,
      rsiSignal: bullSignal(),
      macdSignal: bullSignal(),
    })
    expect(result.score).toBeLessThanOrEqual(100)
  })

  // ── Null signal values ──
  it('skips signals with null values', () => {
    const result = confluenceScore({
      vwapSignal: { value: null, bias: 'neutral', strength: 'weak' },
      rsiSignal: { value: null, bias: 'neutral', strength: 'weak' },
      macdSignal: { value: null, bias: 'neutral', strength: 'weak' },
    })
    expect(result.bias).toBe('neutral')
  })
})
