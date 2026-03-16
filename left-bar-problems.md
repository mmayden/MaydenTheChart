# Left Sidebar Layout Bug — Change History

> Tracking document for the sidebar/RSI/MACD resize issue.
> Created 2026-03-16 to audit what changed and why.
>
> **Resolution:** RSI/MACD toggles moved back to sidebar IndicatorToggle.
> Tab button strip removed. Sidebar reverted to original clean form.
> Issue partially mitigated — see BUG-001 in `bugs.md` for remaining status.

---

## The Problem

When the left sidebar opens/closes, the RSI and MACD mini charts don't resize
properly to fill the available width. The main chart and status bar adjust, but
the RSI/MACD canvases lag or don't expand at all.

The right panel does NOT have this issue — it was fixed and works seamlessly.

---

## Timeline of Changes (oldest → newest)

### Phase 10A — Original Sidebar (commit `f1801a2`)
**State: Working (no animation, just CSS toggle)**

```jsx
<aside className={`
  flex flex-col shrink-0 border-r border-theme transition-all duration-200 overflow-hidden z-40
  fixed md:relative inset-y-0 left-0
  ${sidebarOpen ? 'w-48 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'}
`}>
```

- `transition-all duration-200` — all CSS properties transitioned
- `border-r` on the `<aside>` wrapper
- Manual ResizeObserver on RSI/MACD mini charts
- No `min-width` set when closed
- **This was the baseline that "worked" — but was it actually resizing mini charts?**

### Phase 12B — Motion animations added (commit `e1b96b5`)
**Changed: RightPanel only. Sidebar untouched.**

RightPanel was rewritten to use `AnimatePresence` + `motion.div` (spring physics).
This REMOVED the persistent wrapper — the panel element mounted/unmounted from DOM.
This broke the right panel (chart would close, pause, then jump).

Sidebar was NOT changed in this commit.

### Code Quality Audit (commit `e6748e1`)
**Changed: Sidebar transition broken**

```diff
- flex flex-col shrink-0 border-r border-theme transition-all duration-200 overflow-hidden z-40
+ flex flex-col shrink-0 border-r border-theme overflow-hidden z-40
  fixed md:relative inset-y-0 left-0
+ transition-transform duration-200 md:transition-none
```

**What changed:**
- `transition-all` → `transition-transform duration-200 md:transition-none`
- On desktop: `md:transition-none` = NO transitions at all (width snaps instantly)
- On mobile: only transform is transitioned

**Intended effect:** "Desktop sidebar uses instant width snap — prevents chart/RSI/MACD
resize jank during transition"

**Actual effect:** Made the problem worse. With no width transition, the sidebar
snaps from 192px→0 instantly. The charts may or may not have been resizing before,
but now there's no transition at all on desktop.

### Fix attempt #1 — Today (commit `6ba3510`)
**Changed: RightPanel fixed, Sidebar partially fixed**

RightPanel: Reverted to persistent wrapper div with CSS width transitions. **This fixed the right panel.**

Sidebar: Changed `transition-transform md:transition-none` back to `transition-all duration-200`.

```diff
- transition-transform duration-200 md:transition-none
+ transition-all duration-200
```

**Result:** Right panel fixed. Sidebar still broken.

### Fix attempt #2 — Today (commit `363c133`)
**Changed: All charts switched to autoSize**

Replaced manual `ResizeObserver` + explicit `width`/`height` with lightweight-charts
v5 built-in `autoSize: true` on all 3 chart instances:
- `CandlestickChart.jsx` — main chart
- `RSIMiniChart.jsx` — RSI mini chart
- `MACDMiniChart.jsx` — MACD mini chart

Removed ~24 lines of manual ResizeObserver code.

**Result:** No change. RSI/MACD still not resizing on sidebar toggle.

### Fix attempt #3 — Today (commit `e57c968`)
**Changed: Sidebar rewritten to mirror RightPanel structure**

Identified structural differences between sidebar (broken) and right panel (works):

| Property | Right Panel | Sidebar |
|---|---|---|
| Border | Inner content | Wrapper `<aside>` |
| min-width | Explicit `min-w-0` | Missing (defaults to `auto`) |
| Transition | Specific properties | `transition-all` |
| pointer-events | `none` when closed | Missing |
| Background | Transparent when closed | Always bg-surface |

Rewrote sidebar to match:
- Border moved from `<aside>` to inner `<div>`
- Added `min-w-0` when closed
- Transition: `transition-[transform,width,min-width] duration-200`
- Added `pointer-events-none` when closed
- Background transparent when closed

**Result:** Not yet confirmed. User screenshot shows sidebar closed, RSI/MACD appear
full-width in final state. Issue may be during transition or canvas rendered at stale width.

### Fix attempt #4 — Today (commit `99b1f62`)
**Changed: Dispatch window resize after sidebar transition**

Added `setTimeout(() => window.dispatchEvent(new Event('resize')), 220)` to both
`setSidebarOpen` and `toggleSidebar` in `useChartStore.js`.

This fires 220ms after toggle (just after the 200ms CSS transition completes),
forcing lightweight-charts `autoSize` to recalculate canvas dimensions on ALL
chart instances. This bypasses any ResizeObserver timing issues.

**File:** `src/store/useChartStore.js`

**Result:** Not yet confirmed.

---

## What We Know

1. The right panel resize is **fixed** — persistent wrapper + CSS width transition works
2. The sidebar has been changed 5 times in 2 days trying to fix the same issue
3. `autoSize: true` on lightweight-charts didn't help by itself
4. The original sidebar (`transition-all`) may have NEVER properly resized the mini charts — we just didn't notice until Phase 12B drew attention to the layout
5. User screenshot with sidebar closed shows RSI/MACD appearing full-width — the issue may be the canvas rendering at stale width (dark bg hides the gap) or during transition only

## What We Don't Know

1. Is the container div actually changing width when the sidebar toggles? (Need to inspect in DevTools)
2. Is `autoSize` firing its internal ResizeObserver during the CSS transition?
3. Was this issue present before Phase 12B, or did the code quality audit (`e6748e1`) introduce it?
4. Is the issue the transition itself (canvas can't keep up with animation frames) or the final state (canvas never resizes)?
5. Does the `window.resize` dispatch in fix #4 actually force autoSize to recalculate?

## Next Steps If Current Fix Doesn't Work

1. **DevTools inspection** — Check if the `<canvas>` width vs parent `<div>` width match after sidebar close
2. **Remove sidebar width transition on desktop** — Snap the width instantly (no 200ms transition), let autoSize handle a single resize
3. **Test with bare HTML** — Strip out the chart components and test if a plain colored div inside IndicatorTabView resizes when sidebar closes
4. **requestAnimationFrame loop** — Fire resize events continuously during the 200ms transition instead of once at the end

---

## Files Involved

- `src/components/layout/Sidebar.jsx` — the sidebar wrapper
- `src/components/layout/RightPanel.jsx` — the right panel (reference, this one works)
- `src/components/ui/RSIMiniChart.jsx` — RSI mini chart (lightweight-charts instance)
- `src/components/ui/MACDMiniChart.jsx` — MACD mini chart (lightweight-charts instance)
- `src/components/chart/CandlestickChart.jsx` — main chart (lightweight-charts instance)
- `src/components/ui/IndicatorTabView.jsx` — RSI/MACD container
- `src/App.jsx` — overall layout (flex row: Sidebar + Chart Column + RightPanel)
