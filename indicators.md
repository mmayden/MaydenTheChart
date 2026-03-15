# Indicator Reference — Loompia

> Math, logic, and trading context for every indicator we build.
> This is the source of truth Claude uses when writing indicator code.
> All indicators are validated against Nick's Discord system and academic ORB research.

---

## Indicator Function Contract — Backtest-Ready Shape

Every indicator util function must return BOTH a chart-ready series AND a signal object.
This is non-negotiable — it lets the live chart and the backtester share identical math.

```js
// Every function in indicators.js returns this shape:
{
  series: [{ time, value }],  // ready for lightweight-charts series.setData()
  signal: {                   // ready for confluenceScore() + backtest harness
    value:    number,         // the last computed value
    bias:     'bull' | 'bear' | 'neutral',
    strength: 'strong' | 'moderate' | 'weak'
  }
}
```

The backtester (`src/utils/backtest.js`) calls the exact same functions with historical bar slices.
No duplicate math, ever.

---

## Previous Day High / Low (Nick's Rule 1)

### What it tells you
The single most important level each day. Nick's entire directional bias framework
is built on whether price breaks above the previous day's high or below the previous
day's low — and which one it breaks first.

### Logic
```
prevHigh = yesterday's session high (9:30 AM – 4:00 PM ET)
prevLow  = yesterday's session low  (9:30 AM – 4:00 PM ET)

On today's session:
  price > prevHigh → bullish day, do not expect prevLow to be revisited
  price < prevLow  → bearish day, do not expect prevHigh to be hit
  both broken      → chop / expect large move in current direction
```

### Rendering
- Previous high: dashed horizontal line, gold/yellow color
- Previous low: dashed horizontal line, gold/yellow color
- Labels on the right price scale ("PDH" and "PDL")
- Only relevant on intraday timeframes (1m, 5m, 15m, 1h)
- Also track weekly high/low for swing context on 4h/1D

### Code signature
```js
// returns { prevHigh, prevLow, weeklyHigh, weeklyLow }
// bars must include at least 2 full trading days
getPreviousLevels(bars)
```

---

## Opening Range Breakout Zone (ORB)

### What it tells you
The high and low of the first 15 minutes of the trading session. Validated by academic
research (Concretum Group, SSRN 2023) as a statistically significant edge on QQQ:
33% annualized alpha over 2016–2023. Breakouts with volume confirmation (1.5x+ avg)
succeed at ~65% vs. ~45% without.

### Logic
```
ORB High = highest high of bars from 9:30 AM → 9:45 AM ET
ORB Low  = lowest low of bars from 9:30 AM → 9:45 AM ET

Breakout above ORB High → bullish signal (confirm with volume)
Breakout below ORB Low  → bearish signal (confirm with volume)
Failed breakout (re-enters zone) → fade opportunity
```

### Rendering
- Shaded semi-transparent box between ORB high and ORB low
- ORB high and low as horizontal lines within the box
- Color: neutral gray/blue while inside; turns green (bullish) or red (bearish) on confirmed break
- Only shown on 1m, 5m, 15m timeframes
- Disappears or fades after 11:30 AM ET (range less relevant as day matures)

### Code signature
```js
// bars must be sorted oldest → newest, intraday only
// returns { orbHigh, orbLow, orbTime }
getORBZone(bars, sessionStart = '09:30', orbMinutes = 15)
```

---

## Open of Day Line

### What it tells you
The first bar's open price. Nick references "open of day" constantly as a directional
pivot — price reclaiming the open is bullish; price losing the open is bearish.

### Rendering
- Thin solid white line, scoped to today's session only (does not bleed into previous days)
- Rendered as a `LineSeries` with two data points (session start → session end), not a price line
- Label: "ODC" (Open of Day Candle)
- Only on intraday timeframes

### Code signature
```js
// returns { price, startTime, endTime } or null
// price = open of today's first bar
// startTime/endTime = Unix timestamps bounding today's session bars
getOpenOfDay(bars)
```

---

## EMA — Exponential Moving Average (Nick's Rule 2)

### What it tells you
EMAs smooth price and weight recent data more heavily. The slope and relationship
between EMAs define trend direction and momentum. Nick uses three specific EMAs
with specific colors — these are not negotiable.

### Nick's EMA Stack
| EMA | Color | Trading meaning |
|---|---|---|
| EMA 9 | **Blue** (#3b82f6) | Short-term momentum, crossover signal trigger |
| EMA 48 | **Green** (#22c55e) | Medium-term trend direction |
| EMA 200 | **White** (#e5e7eb) | Long-term bull/bear line — above = bull bias |

### The 4hr EMA Cross (Nick's strongest swing signal)
- EMA 9 crossing EMA 48 on the 4-hour chart = strongest swing entry signal
- "First time the 4hr crosses is the most reliable" (Nick, multiple times in Discord)
- Tool should auto-annotate these crosses with arrow markers on the chart

### Formula
```
Multiplier = 2 / (period + 1)
EMA(today) = Close(today) × Multiplier + EMA(yesterday) × (1 - Multiplier)
```

### Seed value
First EMA value = simple average (SMA) of first `period` closes.

### Signals to watch
- **EMA 9 crosses above EMA 48** → bullish momentum shift (intraday and swing)
- **EMA 9 crosses below EMA 48** → bearish momentum shift
- **Price bounces off EMA 48** → trend continuation entry
- **All three stacked (price > EMA 9 > EMA 48 > EMA 200)** → strong uptrend
- **Price below all three** → strong downtrend, short bias

### Code signature
```js
// returns array of { time, value } for lightweight-charts
ema(closes, period)

// Auto-detect 4hr EMA 9 × EMA 48 crosses
// returns array of { time, direction: 'bull' | 'bear' }
detectEMACrosses(ema9Series, ema48Series)
```

---

## VWAP — Volume Weighted Average Price (Nick's Rule 6)

### What it tells you
The average price paid weighted by volume. Resets every trading session at 9:30 AM ET.
Institutional traders benchmark every fill against VWAP — it is the most important
intraday indicator. Nick uses it as his primary intraday bias pivot.

### Formula
```
Typical Price (TP) = (High + Low + Close) / 3
VWAP = Σ(TP × Volume) / Σ(Volume)
  — cumulative from market open, resets at 9:30 AM ET daily
```

### VWAP Standard Deviation Bands
```
variance(n) = Σ((TP - VWAP)² × Volume) / Σ(Volume)
stdDev(n)   = √variance(n)

Band 1 upper = VWAP + 1 × stdDev
Band 1 lower = VWAP - 1 × stdDev
Band 2 upper = VWAP + 2 × stdDev
Band 2 lower = VWAP - 2 × stdDev
```

### Why the bands matter
- 2σ upper band: price here = extended/overbought intraday → mean reversion zone
- 2σ lower band: price here = extended/oversold intraday → mean reversion zone
- This is Cheech's "play the middle" philosophy made visual
- Institutional traders use these bands — this is standard prop desk methodology

### Rendering
- VWAP line: solid, cyan (#06b6d4), medium weight
- 1σ bands: dashed, lighter cyan, thin
- 2σ bands: dashed, even lighter, very thin
- Only shown on intraday timeframes (1m, 5m, 15m) — hidden on 4h/1D

### Code signature
```js
// bars sorted oldest → newest, resets when date changes
// returns { vwap, band1Upper, band1Lower, band2Upper, band2Lower }
// each = array of { time, value }
vwapWithBands(bars)
```

---

## ATR — Average True Range

### What it tells you
Measures daily volatility as an absolute dollar range. Used to know how much of the
day's "budget" has been used. Research from Edgeful shows QQQ trades 80–95% of its
14-day ATR in the first few hours on most days — meaning once that threshold is hit,
chasing continuation is statistically poor risk/reward.

### Formula
```
True Range (TR) = max of:
  1. High - Low
  2. |High - Previous Close|
  3. |Low - Previous Close|

ATR(14) = EMA of TR over 14 periods
```

### Usage in the tool
```
Daily range used = today's High - today's Low
Range % consumed = (Daily range used / ATR14) × 100

< 50%:   Plenty of range left — conditions favorable for breakout trades
50–80%:  Getting extended — be selective
80–95%:  Late in range — Nick says "this is a tight day, no reason to trade"
> 100%:  High volatility expansion day — this is Nick's "expect big move" signal
```

### Rendering (ATR Gauge component)
- Fuel-gauge style meter
- Green zone: 0–50%
- Yellow zone: 50–80%
- Red zone: 80–100%+
- Shows current % and dollar values

### Code signature
```js
// returns array of { time, value } (dollar ATR)
atr(bars, period = 14)

// returns { atrValue, rangeUsed, percentConsumed }
getDailyRangeStatus(todayBars, atr14Value)
```

---

## Day Type Classification

### What it tells you
Every trading day is one of three types. Knowing which type you're in changes
your entire approach. Nick's rule about "both levels hit" is the chop signal.

### Logic
```
Track whether today's price has:
  - Broken above PDH (Previous Day High): brokePDH = true
  - Broken below PDL (Previous Day Low):  brokePDL = true

Classification:
  brokePDH only   → Trend Day (Bullish) — trade with the bulls
  brokePDL only   → Trend Day (Bearish) — trade with the bears
  both broken     → Chop / Expect Big Move — be careful, rules shift
  neither broken  → Range Day — fade the extremes, smaller range plays
```

### Rendering (DayTypeBanner component)
- Persistent banner at top of UI
- Updates in real time as price breaks levels
- "📈 Trend Day — Bullish" (green background)
- "📉 Trend Day — Bearish" (red background)
- "⚡ Chop — Both Levels Broken" (orange background)
- "↔️ Range Day — Neither Level Broken" (neutral/gray)

---

## Relative Volume (RVOL)

### What it tells you
Whether current volume is unusual vs. the recent average. Volume spike = institutional
participation = breakout more likely to follow through. Academic research shows 20pp
edge improvement when filtering ORB breakouts with 1.5x+ volume.

### Formula
```
avgVolume = simple average of volume over past 20 bars (same timeframe)
RVOL = currentBar.volume / avgVolume

RVOL ≥ 1.5 → high conviction bar, highlight it
RVOL < 1.0 → below average volume, treat breakouts with caution
```

### Rendering
- Volume bars are colored by candle direction: green (close ≥ open), red (close < open), semi-transparent
- RVOL math remains available in `relativeVolume()` for future use (backtester, RVOL toggle in settings)
- Tooltip shows RVOL multiplier on hover (planned)

### Code signature
```js
// returns array of { time, volume, rvol, highlight: bool }
relativeVolume(bars, period = 20, threshold = 1.5)
```

---

## RSI — Relative Strength Index

### What it tells you
Momentum oscillator, 0–100. Measures speed and magnitude of price moves.
Used for overbought/oversold conditions and divergence detection.

### Formula
```
Change   = Close(today) - Close(yesterday)
Gain     = Change if > 0, else 0
Loss     = |Change| if < 0, else 0

avg_gain = EMA of gains over 14 periods
avg_loss = EMA of losses over 14 periods

RS  = avg_gain / avg_loss
RSI = 100 - (100 / (1 + RS))
```

### Seed values
- First avg_gain = SMA of first 14 gains
- First avg_loss = SMA of first 14 losses
- Then use Wilder's smoothing: avg = (prev_avg × 13 + current) / 14

### Key levels
| Level | Meaning |
|---|---|
| Above 70 | Overbought — potential reversal zone |
| 50–70 | Bullish momentum |
| 50 | Neutral pivot |
| 30–50 | Bearish momentum |
| Below 30 | Oversold — potential reversal zone |

### Code signature
```js
// returns array of { time, value } (0–100)
rsi(closes, period = 14)
```

---

## MACD — Moving Average Convergence Divergence

### What it tells you
Shows the relationship between two EMAs. Reveals trend direction, momentum, and
potential reversals. Three components rendered together.

### Formula
```
MACD Line   = EMA(12) - EMA(26)
Signal Line = EMA(9) of MACD Line
Histogram   = MACD Line - Signal Line
```

### Signals
- MACD crosses above signal → bullish crossover
- MACD crosses below signal → bearish crossover
- Histogram grows positive → bullish momentum building
- Histogram shrinks from positive → bullish momentum fading
- Zero line cross → trend direction shift

### Rendering
- MACD line: solid blue
- Signal line: solid orange
- Histogram: green bars above zero, red bars below zero

### Code signature
```js
// returns { macd, signal, histogram } arrays of { time, value }
macd(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9)
```

---

## Support & Resistance Detection

### What it tells you
Price levels where buying (support) or selling (resistance) has historically clustered.

### Detection algorithm
```
For each bar[i], look left and right N bars (lookback = 10):

Swing High: bar[i].high is the highest high in window [i-N, i+N]
Swing Low:  bar[i].low  is the lowest  low  in window [i-N, i+N]

Cluster: merge pivots within 0.1% of each other into one zone
Zone strength = number of pivots merged (more touches = stronger level)
```

### Rendering
- Support: green horizontal lines (opacity proportional to strength)
- Resistance: red horizontal lines (opacity proportional to strength)
- Label each with price value

### Code signature
```js
// returns { support: [{ price, strength }], resistance: [{ price, strength }] }
findSupportResistance(bars, lookback = 10, clusterThreshold = 0.001)
```

---

## Macro Health Status Bar (Minervini-style Market Filter)

### What it tells you
Before any individual setup matters, the macro context of QQQ itself shapes the
probability of all directional trades. Adapted from Mark Minervini's Trend Template.

### Logic
```
Pull daily bars for QQQ (at least 200 days)
Compute SMA(50) and SMA(200) of daily close

Bullish:  price > SMA50 > SMA200, both MAs trending up
Neutral:  price between MAs, or MAs flat
Bearish:  price < SMA50, SMA200 trending down or price below it

Current market context (March 2026): QQQ is below 200MA — bearish macro bias
All bullish signals carry extra risk in this context
```

### Rendering (MacroStatusBar component)
- One-line persistent bar at top or bottom of UI
- "📈 Bull Trend — QQQ above 50MA & 200MA" (green)
- "⚠️ Neutral — Mixed MA alignment" (yellow)
- "📉 Bear Trend — QQQ below 200MA" (red)

---

## Reading It All Together — The Mastery Layer

This is what Nick does on his best days, and what separates skilled chart reading
from guessing.

### High-probability long setup
1. Macro status: Bull trend (or neutral, not deep bear)
2. Day type: Trend Day Bullish (PDH broken, not PDL)
3. Price above VWAP and EMA 48
4. ATR gauge under 80% consumed
5. RVOL on the breakout bar ≥ 1.5x
6. RSI not above 70 (room to run)
7. MACD histogram green and growing
→ Enter long at ORB high breakout or VWAP bounce

### High-probability short setup
1. Macro: Bear trend (as of March 2026 — QQQ below 200MA)
2. Day type: Trend Day Bearish (PDL broken, not PDH)
3. Price below VWAP and EMA 48
4. ATR gauge under 80% consumed
5. RVOL on the breakdown bar ≥ 1.5x
6. RSI not below 30 (room to fall)
7. MACD histogram red and growing
→ Enter short at PDL breakdown or VWAP rejection

### The golden rule
No single indicator is a signal. **Confluence of 3+ indicators pointing the same
direction** is what makes a setup worth taking. This tool is designed to make
that confluence visually obvious at a glance.
