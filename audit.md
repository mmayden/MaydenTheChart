# Project Health Audit — Loompia / Cheechart

> Reusable top-down assessment template. Run this at any milestone to get a consistent health snapshot.
> Last run: 2026-03-15

---

## 1. Build & CI Health
- [ ] `npm run build` — zero errors, zero warnings
- [ ] `npm run test` — all tests pass
- [ ] No deprecated dependency warnings
- [ ] No known vulnerabilities (`npm audit`)
- [ ] Vite config clean (no unused plugins, correct proxy setup)

## 2. Architecture & Modularity
- [ ] Clear separation: data layer (hooks/services) vs UI (components) vs logic (utils)
- [ ] No circular dependencies
- [ ] State management boundaries respected (server state in TanStack Query, UI state in Zustand, local state in useState)
- [ ] No prop drilling deeper than 2 levels — use store or context
- [ ] Utils are pure functions with no side effects
- [ ] Components follow single-responsibility principle
- [ ] Shared utilities extracted (no copy-paste logic across files)

## 3. Code Quality & Maintainability
- [ ] No dead code (unused imports, unreachable branches, commented-out blocks)
- [ ] No TODO/FIXME/HACK comments left unresolved
- [ ] Consistent naming conventions (camelCase functions, PascalCase components)
- [ ] No magic numbers — constants extracted to `chart.js` or co-located
- [ ] Functions under ~50 lines; components under ~200 lines
- [ ] No deeply nested conditionals (max 3 levels)
- [ ] Effect cleanup: all useEffect hooks return cleanup functions where needed

## 4. Security
- [ ] Zero API keys/secrets in client bundle (`grep` dist/ for key patterns)
- [ ] Env vars: server-only vars have NO `VITE_` prefix
- [ ] Serverless proxies validate/sanitize inputs (symbol, timeframe params)
- [ ] No `dangerouslySetInnerHTML` or unescaped user input in DOM
- [ ] WebSocket auth token not hardcoded or exposed in client code
- [ ] CORS / CSP headers configured appropriately

## 5. Performance
- [ ] No expensive computations inside render (indicators computed in useMemo)
- [ ] Memoization on derived data (useMemo/useCallback where deps change rarely)
- [ ] No unnecessary re-renders from object/array identity changes
- [ ] Chart series updates use `update()` not full `setData()` where possible
- [ ] ResizeObserver / event listeners properly cleaned up
- [ ] No memory leaks (intervals, timeouts, subscriptions cleared on unmount)
- [ ] Bundle size reasonable (no accidentally imported large libraries)

## 6. Error Handling & Resilience
- [ ] API failures show user-facing error states (not blank screens)
- [ ] Network errors handled gracefully (retry logic, fallback UI)
- [ ] WebSocket reconnection with backoff (not infinite retry spam)
- [ ] Null/undefined guards on data that may not be loaded yet
- [ ] Edge cases: empty bars array, single bar, market closed, no data for symbol
- [ ] Toast/notification for user-facing errors

## 7. Test Coverage & Quality
- [ ] All indicator math functions have unit tests
- [ ] Edge cases tested (empty input, single element, boundary values)
- [ ] Signal contract (`{ series, signal }`) validated in tests
- [ ] Level detection tested (prev H/L, ORB, ODC, day type)
- [ ] Support/resistance algorithm tested
- [ ] No test files testing implementation details (test behavior, not internals)
- [ ] Coverage gaps identified for critical paths

## 8. Contract Compliance
- [ ] Every indicator in `indicators.js` returns `{ series, signal }` shape
- [ ] Signal object always has `{ value, bias, strength }` with correct enum values
- [ ] `bias` is always one of: `'bull'`, `'bear'`, `'neutral'`
- [ ] `strength` is always one of: `'strong'`, `'moderate'`, `'weak'`
- [ ] Chart components consume `series` only; backtester consumes `signal` only
- [ ] No indicator function returns a different shape

## 9. UX Completeness
- [ ] Loading states for all async operations
- [ ] Error states with retry affordance
- [ ] Empty states (no data available for symbol/timeframe)
- [ ] Keyboard accessibility (shortcuts documented, no trapped focus)
- [ ] Responsive layout (sidebar + chart scale correctly)
- [ ] Visual feedback on all interactive elements (hover, active, disabled)

## 10. Documentation Drift
- [ ] `project.md` status section matches actual codebase
- [ ] `tasks.md` reflects completed work accurately
- [ ] `indicators.md` code signatures match actual function signatures
- [ ] `CLAUDE.md` file paths match actual file locations
- [ ] No references to deleted/renamed files in docs

---

## Findings — 2026-03-15

### Critical (4)

1. **[Resilience] No React Error Boundary.** Any render-time throw (malformed chart data, null ref, overlay crash) white-screens the entire app with no recovery path except page refresh.

2. **[Performance] All chart series use `setData()` on every live bar update.** ~15 series (candle, volume, 3 EMAs, 5 VWAP bands, levels, S/R, RSI, MACD) get full `setData()` calls when a single bar arrives via WebSocket. Should use `update()` for the last bar on candle/volume series.

3. **[Contract] `vwapWithBands()` breaks the `{ series, signal }` contract.** Returns `{ vwap, band1Upper, band1Lower, band2Upper, band2Lower, signal }` — no top-level `series` key. This is the only indicator that violates the documented contract shape.

4. **[Security] `/api/bars.js` has no input validation.** `symbol`, `timeframe`, and `limit` params are passed through to Alpaca with no allowlist, regex, or bounds checking. Should validate `symbol` against `/^[A-Z]{1,10}$/`, `timeframe` against a known list, and `limit` as a bounded integer.

### Warnings (19)

5. **[Security] No security headers in `vercel.json`.** Missing CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy. These are defense-in-depth for a deployed app.

6. **[Security] `VITE_WS_AUTH_TOKEN` exposed in client bundle.** Intentional for paper trading, but means anyone can call `/api/ws-auth` and get Alpaca credentials. Flag for real-money migration.

7. **[Security] `innerHTML` used in `CrosshairLegend.jsx` (line 81).** Values are numeric from Alpaca API so XSS risk is negligible, but the pattern is fragile. Consider `textContent` or DOM manipulation.

8. **[Architecture] `NotificationBell.jsx` is 314 lines — violates SRP.** Mixes alert-checking logic, two form UIs, notification dispatch, and dropdown rendering. Should extract alert logic to a hook and forms to subcomponents.

9. **[Architecture] `RSIMiniChart`/`MACDMiniChart` defined inline in `IndicatorTabView.jsx`.** These are full chart instances that should be separate files for maintainability.

10. **[Architecture] `useToast` Zustand store lives in `src/hooks/` instead of `src/store/`.** Inconsistent with project convention (`useAlertsStore` and `useChartStore` are in `src/store/`).

11. **[Architecture] `App.jsx` (269 lines) handles layout + orchestration + indicator math.** The `useMemo` blocks for `atrGauge` and `dayType` could be extracted to a `useDerivedIndicators` hook.

12. **[Code Quality] `toETDateString()` duplicated in `indicators.js` and `levels.js`.** Identical implementation — extract to `src/utils/timezone.js`.

13. **[Code Quality] ET timezone conversion done 3 different ways across the codebase.** `Intl.DateTimeFormat`, `new Date(toLocaleString())`, and `toLocaleString()` — should unify in a shared module.

14. **[Code Quality] Dead files: `MacroStatusBar.jsx` (unused, 65 lines) and `validateEnv.js` (no-op, still called in `main.jsx`).** Delete both.

15. **[Code Quality] Dead exports: `detectEMACrosses()` and `relativeVolume()` are exported but never consumed by UI.** `rvol` toggle in sidebar is a no-op. Either wire them up or remove the toggle.

16. **[Code Quality] Unused constants in `chart.js`.** `RVOL_PERIOD`, `RVOL_THRESHOLD`, `RSI_PERIOD`, `MACD_FAST/SLOW/SIGNAL`, `ATR_PERIOD` are defined but indicator functions hardcode the same values as defaults.

17. **[Code Quality] 8 `console.*` statements in `websocket.js` will print in production.** Should be gated behind a debug flag or removed.

18. **[Code Quality] Magic number `100000` used as RS infinity substitute in RSI (line 325, 338).** Use `Infinity` or a named constant.

19. **[Performance] `PriceDisplay` recomputes `groupBarsByDay(bars)` redundantly.** `App.jsx` already has `byDay` — pass it as a prop.

20. **[Performance] `App.jsx` subscribes to full `indicators` object from Zustand.** Toggling RSI/MACD causes unnecessary App re-render cascade. Select only overlay-relevant fields.

21. **[Performance] Full indicator recalc (EMA x3, VWAP x5, RSI, MACD, S/R) on every bar update.** Each is O(n) and they all fire simultaneously.

22. **[Resilience] No React Error Boundary.** (See critical #1)

23. **[Resilience] WebSocket permanently dies after 10 retries with no auto-recovery.** Only recovery is page refresh or symbol change.

### Info (15)

24. **[Build] Clean: 77/77 tests pass, 0 build warnings, 0 vulnerabilities, 0 deprecated deps.** Bundle: 437KB / 142KB gzipped.
25. **[Architecture] No circular dependencies. Clean import graph.**
26. **[Architecture] All utils are pure functions — no side effects.**
27. **[Architecture] 100% functional components, hooks used correctly, no rules-of-hooks violations.**
28. **[Testing] All indicator math, levels, and S/R functions have tests. Bias/strength values are correct in source.**
29. **[Testing] No tests for hooks (6 files), stores (2 files), services (3 files), or components. Only `src/utils/` is tested.**
30. **[Testing] `null` input and single-element arrays not tested for indicator functions (guards exist in code but untested).**
31. **[Testing] Signal contract shape only deeply verified for `ema()`. Other tests check `signal` exists but skip `value`/`strength`.**
32. **[Contract] `macd()` returns `{ macd, signalLine, histogram, signal }` — intentional multi-series deviation from contract.**
33. **[Docs] `backtest.js` referenced in `project.md` and `indicators.md` but file doesn't exist.**
34. **[Docs] `ema()` and `macd()` docs say first param is `closes` but actual code takes `bars`.**
35. **[Docs] `getPreviousLevels`, `getORBZone`, `getOpenOfDay` gained `byDay` param not reflected in docs.**
36. **[Docs] `classifyDayType()` has no code signature block in `indicators.md`.**
37. **[Docs] 4 files undocumented: `Logo.jsx`, `StatusBar.jsx`, `SettingsModal.jsx`, `useDailyBars.js`.**
38. **[Docs] `relativeVolume()` docs say it returns an array but it returns `{ series, signal }`.**

---

## Action Items

> Prioritized by impact. Grouped into fixable-now vs. architectural improvements.

### P0 — Fix Now (security + crash prevention) — DONE
- [x] Add React Error Boundary wrapping `<App />` with fallback UI and "Reload" button
- [x] Add input validation in `/api/bars.js` (symbol regex, timeframe allowlist, limit bounds)
- [x] Add security headers to `vercel.json` (CSP, X-Frame-Options, HSTS, nosniff, Referrer-Policy)

### P1 — Code Health (dead code, duplication, contracts) — DONE
- [x] Delete `MacroStatusBar.jsx` and `validateEnv.js` (+ remove call in `main.jsx`)
- [x] Extract `toETDateString()` to `src/utils/timezone.js`, unify all ET conversions
- [ ] Fix `vwapWithBands` to include a `series` key (or document the intentional deviation)
- [x] Wire indicator constants from `chart.js` into function defaults
- [x] Remove or gate `console.*` statements in `websocket.js`
- [x] Pass `byDay` prop to `PriceDisplay` instead of recomputing
- [x] Update doc signatures: `ema(bars)`, `macd(bars)`, level function `byDay` params, `relativeVolume` return shape, add `classifyDayType` signature
- [x] Remove phantom `backtest.js` reference from docs (noted as planned/unbuilt)
- [x] Add undocumented files to CLAUDE.md/project.md file maps
- [x] Fix magic number `100000` → `Infinity` in RSI

### P2 — Architecture (modularity, SRP) — MOSTLY DONE
- [x] Extract `RSIMiniChart`/`MACDMiniChart` to separate files + shared `miniChartConfig.js`
- [x] Move `useToast.js` to `src/store/useToastStore.js`
- [ ] Extract alert-checking logic from `NotificationBell` into `useAlertChecker` hook
- [x] Narrow `App.jsx` Zustand subscription to overlay-relevant indicator fields only

### P3 — Performance (optimize when needed)
- [ ] Use `update()` for last-bar candle/volume series updates instead of `setData()`
- [ ] Consider incremental indicator updates (append new EMA point vs full recalc)
- [ ] Add WebSocket auto-recovery after max retries (e.g., retry again after 5 minutes)

### P4 — Test Coverage (expand over time)
- [ ] Add `normalizeBar.js` tests (pure function, easy win)
- [ ] Add `null` and single-element edge case tests for all indicator functions
- [ ] Deepen signal contract assertions in existing tests (verify `value`, `bias`, `strength` for all)
- [ ] Add Zustand store tests (`useChartStore`, `useAlertsStore`)

### Deferred — Not Needed Now
- [ ] CI/CD pipeline (GitHub Actions for lint + test + build) — add when sharing repo or onboarding contributors
- [ ] ESLint + Prettier — enforces consistency, add as a polish pass
- [ ] Component tests — useful but ROI is low while the app is solo-dev and rapidly iterating
- [ ] Replace `axios` with native `fetch` (~14KB savings) — minor optimization
