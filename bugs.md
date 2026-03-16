# Bug Tracker — Cheechart

> Known bugs, regressions, and unresolved issues.
> Use GitHub Issues for external/public tracking once the project is shared.
> This file is the internal record for dev sessions.

---

## Open

> No open bugs.

---

## Resolved

### BUG-R006: BUG-001 — Chart area doesn't expand when sidebar closes
**Resolved:** 2026-03-16
**Introduced:** Unclear — always present, noticed after Phase 12B audit

**Root cause:** lightweight-charts' `autoSize` uses ResizeObserver which can miss
the final container size during CSS `transition-all` on the sidebar. The chart
canvas stays at its old width after the flex-1 column expands.

**Fix:** Sidebar emits `cheechart:layout-resize` custom event 250ms after toggle
(after CSS transition completes). CandlestickChart + RSI/MACD mini-charts listen
for this event and call `chart.resize(container.clientWidth, container.clientHeight, true)`
to force the canvas to match its new container dimensions.

### BUG-R001: Right panel close-pause-jump
**Resolved:** 2026-03-16 (commit `6ba3510`)
**Introduced:** Phase 12B (`e1b96b5`) — Motion `AnimatePresence` mount/unmount broke flex layout

**Fix:** Reverted to persistent wrapper div with CSS width transitions. Motion only
used for content fade between panels.

### BUG-R002: ISO date regex rejected Date.toISOString()
**Resolved:** 2026-03-15 (commit `9de4ca2`)
**Introduced:** Comprehensive audit (`b89eab7`) — regex didn't allow milliseconds

**Fix:** Added optional `(\.\d{1,3})?` group to ISO date regex in `api/bars.js`.

### BUG-R003: Toast ID collisions on rapid creation
**Resolved:** 2026-03-15
**Fix:** Changed `Date.now()` to `crypto.randomUUID()` in toast store.

### BUG-R004: ResizeObserver null guard crash on fast unmount
**Resolved:** 2026-03-15
**Fix:** Added null checks in CandlestickChart + mini chart ResizeObserver callbacks.

### BUG-R005: SROverlay crash on invalid marker times
**Resolved:** 2026-03-13
**Fix:** Marker time validation against bar times + try/catch guard.

---

## Process

When logging a new bug:
```
### BUG-XXX: Short description
**Status:** Open | In progress | Resolved
**Severity:** Critical | High | Medium | Low
**First noticed:** date
**Introduced:** commit or phase
**Symptoms:** what the user sees
**Root cause:** what's actually wrong (if known)
**Fix:** what was done (when resolved)
```
