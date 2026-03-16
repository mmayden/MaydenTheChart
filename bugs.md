# Bug Tracker — Lumpia (Cheechart)

> Known bugs, regressions, and unresolved issues.
> Use GitHub Issues for external/public tracking once the project is shared.
> This file is the internal record for dev sessions.

---

## Open

### BUG-001: Chart area doesn't snap left when sidebar closes
**Status:** Open — parked. Multiple fix attempts failed. Sidebar reverted to original clean form.
**Severity:** Medium — functional but the chart/RSI/MACD don't expand to fill sidebar space on close
**First noticed:** 2026-03-16
**Introduced:** Unclear — may have always been present, noticed after Phase 12B audit

**Symptoms:**
- When left sidebar closes, the chart area (main chart + RSI/MACD + status bar)
  does not expand leftward to fill the vacated space
- Right panel close/open works perfectly — chart resizes seamlessly
- The sidebar itself opens/closes fine visually

**What was tried (all failed or reverted):**
1. `transition-all` restored (was `transition-transform md:transition-none`)
2. All charts switched to `autoSize: true` (lw-charts v5 built-in)
3. Sidebar rewritten to mirror RightPanel structure (border on inner, min-w-0, etc.)
4. `window.dispatchEvent(new Event('resize'))` after transition
5. Second attempt at RightPanel-mirror pattern

**Current state:** Sidebar is in its original clean form (pre-audit `dca2cad`).
Charts use `autoSize: true`. No hacks or workarounds. Needs proper DevTools
diagnosis to understand why the flex-1 chart column doesn't expand when the
sidebar shrinks to w-0.

**Tracking doc:** `left-bar-problems.md` — full change history

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
