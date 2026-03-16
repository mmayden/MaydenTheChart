# Feature Ideas — Cheechart (Lumpia)

> Ideas and enhancements under consideration — not committed to a sprint.
> Shipped features have been moved to tasks.md.
> Last updated: 2026-03-15

---

## Shipped (moved from ideas to completed phases)

All original ideas have been implemented:
- Keyboard shortcuts (1-6, [/], Cmd+K, panel toggles, Cmd+Shift+S) — Phase 9+
- Sound alerts (Web Audio API ping) — Phase 10C
- Session stats in status bar — Phase 10C
- Chart snapshot (Cmd+Shift+S) — Phase 11B
- Command palette (Cmd+K) — Phase 9

---

## Future Ideas (not yet scoped)

### High Impact
- **Screener** — scan watchlist for active setups (confluence > threshold)
- **Trade replay** — step through historical days bar-by-bar with simulated trades
- **Chart annotations** — notes/arrows on chart, saved per symbol to localStorage
- **Volume profile** — horizontal volume bars showing price levels with most activity

### Medium Impact
- **Weekly gap tracking panel** — unfilled gaps on QQQ with fill probability
- **RSI divergence chart markers** — math exists in `detectRSIDivergences()`, needs UI wiring
- **Alert sets per preset** — switch presets and get different alert configs
- **4hr EMA cross annotations** — auto-mark bull/bear crosses on chart
- **Natural language queries** — "show me when RSI crossed 70 this week" (AI integration)

### Nice to Have
- **Cloud sync / preset export** — share presets between devices
- **Keyboard-everything** — every single action reachable via command palette (90% done)
- **Heat calendar in journal** — GitHub-style contribution graph of daily P&L
