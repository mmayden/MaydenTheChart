/**
 * Unit tests for levels.js
 *
 * Tests verify:
 *   - groupBarsByDay groups bars by ET calendar date
 *   - getPreviousLevels returns correct prev day high/low and weekly levels
 *   - getOpenOfDay returns first bar's open price + today's time range
 *   - getORBZone filters bars within the 9:30-9:45 AM ET window
 *   - classifyDayType labels trend-bull, trend-bear, chop, and range days
 *   - Edge cases: empty/null input returns null or empty results
 */

import { describe, it, expect } from 'vitest'
import {
  groupBarsByDay,
  getPreviousLevels,
  getOpenOfDay,
  getORBZone,
  classifyDayType,
} from './levels'

// ─── Timestamps ──────────────────────────────────────────────────────────────
// All times are EST (UTC-5). Jan 8-10, 2024 are weekdays in EST.
//
// 2024-01-08 00:00 UTC = 1704672000
// 2024-01-08 14:30 UTC (= 09:30 ET) = 1704672000 + 52200 = 1704724200
// 2024-01-09 14:30 UTC (= 09:30 ET) = 1704724200 + 86400 = 1704810600
// 2024-01-10 14:30 UTC (= 09:30 ET) = 1704810600 + 86400 = 1704897000

const DAY1_0930 = 1704724200   // 2024-01-08 09:30 ET
const DAY1_0935 = 1704724500   // 2024-01-08 09:35 ET
const DAY1_0940 = 1704724800   // 2024-01-08 09:40 ET
const DAY1_0945 = 1704725100   // 2024-01-08 09:45 ET
const DAY1_1000 = 1704726000   // 2024-01-08 10:00 ET
const DAY1_1030 = 1704727800   // 2024-01-08 10:30 ET

const DAY2_0930 = 1704810600   // 2024-01-09 09:30 ET
const DAY2_0935 = 1704810900   // 2024-01-09 09:35 ET
const DAY2_1000 = 1704812400   // 2024-01-09 10:00 ET
const DAY2_1030 = 1704814200   // 2024-01-09 10:30 ET

const DAY3_0930 = 1704897000   // 2024-01-10 09:30 ET
const DAY3_1000 = 1704898800   // 2024-01-10 10:00 ET

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Make a single bar */
function bar(time, open, high, low, close, volume = 1000) {
  return { time, open, high, low, close, volume }
}

/** Two-day bar set: day1 range 395-410, day2 range 400-420 */
function makeTwoDayBars() {
  return [
    bar(DAY1_0930, 400, 405, 395, 402),
    bar(DAY1_1000, 402, 410, 398, 408),
    bar(DAY1_1030, 408, 409, 397, 405),
    bar(DAY2_0930, 410, 415, 400, 412),
    bar(DAY2_1000, 412, 420, 405, 418),
    bar(DAY2_1030, 418, 419, 408, 415),
  ]
}

// ─── groupBarsByDay ─────────────────────────────────────────────────────────

describe('groupBarsByDay()', () => {
  it('groups bars across 2 trading days', () => {
    const bars = makeTwoDayBars()
    const map  = groupBarsByDay(bars)

    expect(map.size).toBe(2)

    const keys = Array.from(map.keys()).sort()
    expect(keys[0]).toBe('2024-01-08')
    expect(keys[1]).toBe('2024-01-09')

    expect(map.get('2024-01-08')).toHaveLength(3)
    expect(map.get('2024-01-09')).toHaveLength(3)
  })

  it('handles a single bar', () => {
    const bars = [bar(DAY1_0930, 400, 405, 395, 402)]
    const map  = groupBarsByDay(bars)
    expect(map.size).toBe(1)
    expect(map.get('2024-01-08')).toHaveLength(1)
  })

  it('handles empty array', () => {
    const map = groupBarsByDay([])
    expect(map.size).toBe(0)
  })

  it('groups bars across 3 trading days', () => {
    const bars = [
      bar(DAY1_0930, 400, 405, 395, 402),
      bar(DAY2_0930, 410, 415, 400, 412),
      bar(DAY3_0930, 420, 425, 418, 422),
    ]
    const map = groupBarsByDay(bars)
    expect(map.size).toBe(3)
  })
})

// ─── getPreviousLevels ──────────────────────────────────────────────────────

describe('getPreviousLevels()', () => {
  it('returns nulls for empty input', () => {
    const result = getPreviousLevels([])
    expect(result.prevHigh).toBeNull()
    expect(result.prevLow).toBeNull()
    expect(result.weeklyHigh).toBeNull()
    expect(result.weeklyLow).toBeNull()
    expect(result.prevDate).toBeNull()
  })

  it('returns nulls for null input', () => {
    const result = getPreviousLevels(null)
    expect(result.prevHigh).toBeNull()
    expect(result.prevDate).toBeNull()
  })

  it('returns nulls when only one day of data', () => {
    const bars = [
      bar(DAY1_0930, 400, 405, 395, 402),
      bar(DAY1_1000, 402, 410, 398, 408),
    ]
    const result = getPreviousLevels(bars)
    expect(result.prevHigh).toBeNull()
    expect(result.prevLow).toBeNull()
    expect(result.prevDate).toBeNull()
  })

  it('returns correct previous day high/low with 2 days', () => {
    const bars   = makeTwoDayBars()
    const result = getPreviousLevels(bars)

    // Day 1 high = 410, low = 395
    expect(result.prevHigh).toBe(410)
    expect(result.prevLow).toBe(395)
    expect(result.prevDate).toBe('2024-01-08')
  })

  it('returns previous day (not today) with 3 days', () => {
    const bars = [
      bar(DAY1_0930, 400, 405, 390, 402),
      bar(DAY1_1000, 402, 408, 392, 406),
      bar(DAY2_0930, 410, 420, 400, 415),
      bar(DAY2_1000, 415, 425, 405, 418),
      bar(DAY3_0930, 420, 430, 415, 425),
      bar(DAY3_1000, 425, 435, 420, 430),
    ]
    const result = getPreviousLevels(bars)

    // Previous day = day 2: high = 425, low = 400
    expect(result.prevHigh).toBe(425)
    expect(result.prevLow).toBe(400)
    expect(result.prevDate).toBe('2024-01-09')
  })

  it('returns weekly high/low from up to 5 prior days', () => {
    const bars = makeTwoDayBars()
    const result = getPreviousLevels(bars)

    // With only 2 days, weekly covers just day 1 (the only prior day)
    expect(result.weeklyHigh).toBe(410)
    expect(result.weeklyLow).toBe(395)
  })

  it('weekly covers multiple prior days', () => {
    const bars = [
      bar(DAY1_0930, 380, 390, 370, 385),  // day 1: high=390, low=370
      bar(DAY2_0930, 410, 420, 400, 415),   // day 2: high=420, low=400
      bar(DAY3_0930, 425, 430, 422, 428),   // day 3 (today)
    ]
    const result = getPreviousLevels(bars)

    // Weekly = day1 + day2: high = max(390,420) = 420, low = min(370,400) = 370
    expect(result.weeklyHigh).toBe(420)
    expect(result.weeklyLow).toBe(370)
  })
})

// ─── getOpenOfDay ───────────────────────────────────────────────────────────

describe('getOpenOfDay()', () => {
  it('returns null for empty input', () => {
    expect(getOpenOfDay([])).toBeNull()
  })

  it('returns null for null input', () => {
    expect(getOpenOfDay(null)).toBeNull()
  })

  it('returns the first bar open price of today', () => {
    const bars   = makeTwoDayBars()
    const result = getOpenOfDay(bars)

    // Today = day 2, first bar open = 410
    expect(result.price).toBe(410)
    expect(result.startTime).toBe(DAY2_0930)
    expect(result.endTime).toBe(DAY2_1030)
  })

  it('works with a single bar', () => {
    const bars   = [bar(DAY1_0930, 400, 405, 395, 402)]
    const result = getOpenOfDay(bars)
    expect(result.price).toBe(400)
    expect(result.startTime).toBe(DAY1_0930)
    expect(result.endTime).toBe(DAY1_0930)
  })

  it('returns first bar by time even if bars are unsorted within today', () => {
    const bars = [
      bar(DAY1_1000, 402, 410, 398, 408),
      bar(DAY1_0930, 400, 405, 395, 402),  // earlier but listed second
    ]
    const result = getOpenOfDay(bars)
    // Should sort and pick the 09:30 bar
    expect(result.price).toBe(400)
    expect(result.startTime).toBe(DAY1_0930)
  })
})

// ─── getORBZone ─────────────────────────────────────────────────────────────

describe('getORBZone()', () => {
  it('returns invalid for empty input', () => {
    const result = getORBZone([])
    expect(result.valid).toBe(false)
    expect(result.orbHigh).toBeNull()
    expect(result.orbLow).toBeNull()
  })

  it('returns invalid for null input', () => {
    const result = getORBZone(null)
    expect(result.valid).toBe(false)
  })

  it('captures bars in the 9:30-9:45 window', () => {
    const bars = [
      bar(DAY1_0930, 400, 408, 396, 404),  // 9:30 — in ORB
      bar(DAY1_0935, 404, 412, 398, 410),  // 9:35 — in ORB
      bar(DAY1_0940, 410, 415, 402, 413),  // 9:40 — in ORB
      bar(DAY1_0945, 413, 420, 405, 418),  // 9:45 — outside ORB (>= 15 min)
      bar(DAY1_1000, 418, 422, 410, 420),  // 10:00 — outside ORB
    ]
    const result = getORBZone(bars)

    expect(result.valid).toBe(true)
    // ORB bars: 9:30 (high=408, low=396), 9:35 (high=412, low=398), 9:40 (high=415, low=402)
    expect(result.orbHigh).toBe(415)
    expect(result.orbLow).toBe(396)
    expect(result.orbTime).toBe(DAY1_0940)
  })

  it('excludes bars at exactly 9:45 (15 min mark)', () => {
    const bars = [
      bar(DAY1_0930, 400, 408, 396, 404),
      bar(DAY1_0945, 413, 420, 405, 418),  // exactly 15 min — excluded
    ]
    const result = getORBZone(bars)

    expect(result.valid).toBe(true)
    // Only the 9:30 bar counts
    expect(result.orbHigh).toBe(408)
    expect(result.orbLow).toBe(396)
  })

  it('returns invalid when no bars fall in ORB window', () => {
    const bars = [
      bar(DAY1_1000, 418, 422, 410, 420),
      bar(DAY1_1030, 420, 425, 415, 423),
    ]
    const result = getORBZone(bars)
    expect(result.valid).toBe(false)
  })

  it('uses today (last day) for ORB, not previous days', () => {
    const bars = [
      // Day 1 has ORB bars, but day 2 does not have any in 9:30-9:45
      bar(DAY1_0930, 400, 408, 396, 404),
      bar(DAY1_0935, 404, 412, 398, 410),
      bar(DAY2_1000, 418, 422, 410, 420),  // day 2 only after ORB window
    ]
    const result = getORBZone(bars)

    // Today = day 2, no bars in ORB window
    expect(result.valid).toBe(false)
  })

  it('respects custom orbMinutes parameter', () => {
    const bars = [
      bar(DAY1_0930, 400, 408, 396, 404),  // 0 min after open — in 5-min ORB
      bar(DAY1_0935, 404, 412, 398, 410),  // 5 min after open — out of 5-min ORB
      bar(DAY1_0940, 410, 415, 402, 413),  // 10 min — out of 5-min ORB
    ]
    const result = getORBZone(bars, 5)

    expect(result.valid).toBe(true)
    // Only the 9:30 bar is within 5 minutes
    expect(result.orbHigh).toBe(408)
    expect(result.orbLow).toBe(396)
  })
})

// ─── classifyDayType ────────────────────────────────────────────────────────

describe('classifyDayType()', () => {
  const PDH = 410
  const PDL = 395

  it('returns range for empty input', () => {
    const result = classifyDayType([], PDH, PDL)
    expect(result.type).toBe('range')
    expect(result.brokePDH).toBe(false)
    expect(result.brokePDL).toBe(false)
  })

  it('returns range for null input', () => {
    const result = classifyDayType(null, PDH, PDL)
    expect(result.type).toBe('range')
  })

  it('returns range when prevHigh/prevLow are null', () => {
    const bars = [bar(DAY1_0930, 400, 405, 398, 402)]
    const result = classifyDayType(bars, null, null)
    expect(result.type).toBe('range')
  })

  it('trend-bull when only PDH is broken', () => {
    const bars = [
      bar(DAY1_0930, 400, 405, 398, 402),    // within range
      bar(DAY1_1000, 402, 415, 400, 412),     // high=415 > PDH=410
    ]
    const result = classifyDayType(bars, PDH, PDL)

    expect(result.type).toBe('trend-bull')
    expect(result.brokePDH).toBe(true)
    expect(result.brokePDL).toBe(false)
    expect(result.color).toBe('#22c55e')
  })

  it('trend-bear when only PDL is broken', () => {
    const bars = [
      bar(DAY1_0930, 400, 405, 398, 402),
      bar(DAY1_1000, 402, 408, 390, 393),     // low=390 < PDL=395
    ]
    const result = classifyDayType(bars, PDH, PDL)

    expect(result.type).toBe('trend-bear')
    expect(result.brokePDH).toBe(false)
    expect(result.brokePDL).toBe(true)
    expect(result.color).toBe('#ef4444')
  })

  it('chop when both PDH and PDL are broken', () => {
    const bars = [
      bar(DAY1_0930, 400, 415, 390, 402),     // high=415 > PDH, low=390 < PDL
    ]
    const result = classifyDayType(bars, PDH, PDL)

    expect(result.type).toBe('chop')
    expect(result.brokePDH).toBe(true)
    expect(result.brokePDL).toBe(true)
    expect(result.color).toBe('#f59e0b')
  })

  it('range when neither PDH nor PDL is broken', () => {
    const bars = [
      bar(DAY1_0930, 400, 405, 398, 402),
      bar(DAY1_1000, 402, 408, 396, 406),
    ]
    const result = classifyDayType(bars, PDH, PDL)

    expect(result.type).toBe('range')
    expect(result.brokePDH).toBe(false)
    expect(result.brokePDL).toBe(false)
    expect(result.color).toBe('#6b7280')
  })

  it('uses only today bars (last day) for classification', () => {
    // Day 1 breaks PDH, but day 2 stays within range
    const bars = [
      bar(DAY1_0930, 400, 420, 398, 415),   // day 1: breaks PDH
      bar(DAY2_0930, 402, 408, 398, 405),    // day 2: within range
    ]
    const result = classifyDayType(bars, PDH, PDL)

    // Today = day 2, which didn't break anything
    expect(result.type).toBe('range')
  })

  it('labels match expected strings', () => {
    const bullBars = [bar(DAY1_0930, 400, 415, 398, 412)]
    expect(classifyDayType(bullBars, PDH, PDL).label).toBe('Trend Day — Bullish')

    const bearBars = [bar(DAY1_0930, 400, 405, 390, 393)]
    expect(classifyDayType(bearBars, PDH, PDL).label).toBe('Trend Day — Bearish')

    const chopBars = [bar(DAY1_0930, 400, 415, 390, 402)]
    expect(classifyDayType(chopBars, PDH, PDL).label).toBe('Chop — Both Levels Broken')

    const rangeBars = [bar(DAY1_0930, 400, 405, 398, 402)]
    expect(classifyDayType(rangeBars, PDH, PDL).label).toBe('Range Day')
  })
})
