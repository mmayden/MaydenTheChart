# Bug Tracker — Lumpia (Cheechart)

> Known bugs, regressions, and unresolved issues.
> Use GitHub Issues for external/public tracking once the project is shared.
> This file is the internal record for dev sessions.

---

## Open

### BUG-001: RSI/MACD mini charts don't resize on sidebar toggle
**Status:** Low priority — partially mitigated by UX change
**Severity:** Low — RSI/MACD toggles moved to sidebar, tab strip removed
**First noticed:** 2026-03-16
**Introduced:** Unclear — may predate Phase 12B

**Symptoms:**
- When left sidebar opens/closes, RSI and MACD mini chart canvases may not
  expand/contract to fill available width during transition
- Main chart and status bar resize correctly
- Right panel resize works perfectly

**Mitigation:** RSI/MACD toggles moved back to sidebar IndicatorToggle (where they
belong as indicators). Removed the separate tab button strip. Sidebar reverted to
original clean form. Charts use `autoSize: true`. No hacks in codebase.

**Tracking doc:** `left-bar-problems.md` — full change history and diagnostic plan

---

## Resolved

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
