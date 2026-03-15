/**
 * normalizeBar — Convert an Alpaca bar (REST or WebSocket) to the shape
 * lightweight-charts v5 expects.
 *
 * Alpaca bar shape (REST): { t (ISO 8601), o, h, l, c, v }
 * Alpaca bar shape (WS):   { t (ISO 8601), o, h, l, c, v, T, S, n, vw }
 * Output:                  { time (unix seconds), open, high, low, close, volume }
 */
export function normalizeBar(bar) {
  return {
    time:   Math.floor(new Date(bar.t).getTime() / 1000),
    open:   bar.o,
    high:   bar.h,
    low:    bar.l,
    close:  bar.c,
    volume: bar.v,
  }
}
