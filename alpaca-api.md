# Alpaca API Reference — MaydenTheChart

> Notes on every endpoint we use. Keep updated as quirks are discovered.

---

## Authentication

All requests require these headers:
```
APCA-API-KEY-ID: your_key
APCA-API-SECRET-KEY: your_secret
```

Paper trading base URL: `https://paper-api.alpaca.markets`
Market data URL: `https://data.alpaca.markets`

> Historical and live market data use the DATA URL, not the paper trading URL.

---

## Endpoints We Use

### Historical Bars
```
GET https://data.alpaca.markets/v2/stocks/{symbol}/bars
```

**Params:**
| Param | Type | Description | Example |
|---|---|---|---|
| `timeframe` | string | Bar size | `1Min`, `5Min`, `15Min`, `1Hour`, `4Hour`, `1Day` |
| `start` | ISO 8601 | Start datetime | `2026-03-10T09:30:00-05:00` |
| `end` | ISO 8601 | End datetime | `2026-03-13T16:00:00-05:00` |
| `limit` | int | Max bars returned (default 1000, max 10000) | `500` |
| `adjustment` | string | Split/dividend adjustment | `split` |
| `feed` | string | Data feed | `iex` (free) or `sip` (paid) |

**Response shape:**
```json
{
  "bars": [
    {
      "t": "2026-03-13T09:30:00Z",
      "o": 480.50,
      "h": 482.10,
      "l": 479.80,
      "c": 481.60,
      "v": 1234567,
      "vw": 481.12,
      "n": 8432
    }
  ],
  "symbol": "QQQ",
  "next_page_token": null
}
```

**Field mapping for lightweight-charts v5:**
```js
{
  time: Math.floor(new Date(bar.t).getTime() / 1000),  // Unix seconds
  open: bar.o,
  high: bar.h,
  low:  bar.l,
  close: bar.c,
  volume: bar.v
}
```

---

### Latest Quote
```
GET https://data.alpaca.markets/v2/stocks/{symbol}/quotes/latest
```

**Response:**
```json
{
  "quote": {
    "ap": 481.75,
    "as": 200,
    "bp": 481.70,
    "bs": 300,
    "t": "2026-03-13T14:32:11.123Z"
  }
}
```

---

### WebSocket — Live Bars
```
wss://stream.data.alpaca.markets/v2/iex
```

**Auth message (send immediately on connect):**
```json
{ "action": "auth", "key": "YOUR_KEY", "secret": "YOUR_SECRET" }
```

**Subscribe message:**
```json
{ "action": "subscribe", "bars": ["QQQ"] }
```

**Incoming bar message:**
```json
[{
  "T": "b",
  "S": "QQQ",
  "o": 481.50,
  "h": 482.00,
  "l": 481.20,
  "c": 481.85,
  "v": 45231,
  "t": "2026-03-13T14:33:00Z"
}]
```

> WebSocket bars arrive at the **close** of each bar period.
> A 1-minute bar for 14:33 arrives at approximately 14:34.

---

## Timeframe Mapping

| UI Label | Alpaca param | Bars to fetch | Good for |
|---|---|---|---|
| 1m | `1Min` | 390 (1 trading day) | Scalping, ORB entry |
| 5m | `5Min` | 390 (2 trading days) | Day trading, VWAP |
| 15m | `15Min` | 400 (5 trading days) | Day trading, Nick's intraday |
| 1h | `1Hour` | 390 (2–3 weeks) | Swing context |
| 4h | `4Hour` | 200 (1 month+) | Nick's swing EMA crosses |
| 1D | `1Day` | 252 (1 year) | Macro context, gap tracking |

**Note:** For VWAP and ATR calculations, always fetch extra bars beyond what's displayed
(e.g., fetch 2 days of 1m bars to ensure VWAP has a proper anchor from open).

---

## Market Hours (ET)

| Session | Hours |
|---|---|
| Pre-market | 4:00 AM – 9:30 AM |
| Regular | 9:30 AM – 4:00 PM |
| After-hours | 4:00 PM – 8:00 PM |

- VWAP resets at 9:30 AM ET daily — only calculate from regular session bars
- ORB zone is defined by the first 15 minutes (9:30–9:45 AM ET)
- ATR should use regular session bars only for consistent values
- QQQ is most liquid during regular hours; pre/post market has wide spreads

---

## Error Handling

| HTTP Code | Meaning | How we handle |
|---|---|---|
| 401 | Bad API key | Show auth error, prompt user to check .env |
| 403 | Subscription limit | Fall back to `iex` feed, show warning |
| 422 | Bad params (bad dates etc.) | Log to console, show "data unavailable" UI state |
| 429 | Rate limited | Exponential backoff, retry after delay |
| 500 | Alpaca server error | Show error state, retry once after 5s |

---

## Pagination

If response has `next_page_token`, there are more bars:
```js
let allBars = []
let pageToken = null

do {
  const res = await alpaca.get('/v2/stocks/QQQ/bars', {
    params: { ...baseParams, page_token: pageToken }
  })
  allBars = [...allBars, ...res.data.bars]
  pageToken = res.data.next_page_token
} while (pageToken)
```

For our use cases (last N bars per timeframe), we rarely hit pagination.
Set `limit` high enough and specify a tight date range.

---

## Known Quirks

- Timestamps come back in UTC — lightweight-charts v5 needs Unix seconds: `Math.floor(new Date(t).getTime() / 1000)`
- `iex` feed has slight delays vs. real-time but is free for paper accounts
- `vw` field in bar response is per-bar VWAP, NOT cumulative — we compute our own cumulative VWAP
- Pre/post market bars have much lower volume — filter by time or label separately
- Weekends and holidays return no data — handle gracefully in date range logic
- The `n` field is the number of trades in the bar (useful as an alternative to volume for signals)
- 4-hour bars: Alpaca aligns 4h bars to 8:00 AM ET, so bars may not align to 9:30 AM session start

---

## TanStack Query Integration Pattern

```js
// src/hooks/useAlpacaBars.js
import { useQuery } from '@tanstack/react-query'
import { fetchBars } from '../services/alpaca'
import { useChartStore } from '../store/useChartStore'

export function useAlpacaBars() {
  const { timeframe, symbol } = useChartStore()

  return useQuery({
    queryKey: ['bars', symbol, timeframe],
    queryFn: () => fetchBars(symbol, timeframe),
    staleTime: 30_000,       // 30 seconds
    refetchInterval: 60_000, // refetch every 60s during market hours
    retry: 1,
  })
}
```
