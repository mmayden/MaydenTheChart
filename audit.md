# Project Health Audit — Cheechart

> Reusable top-down assessment template. Run at any milestone for a consistent health snapshot.
> Last run: 2026-03-16 (Code Quality Audit complete)

---

## 1. Build & CI Health
- [x] `npm run build` — zero errors, zero warnings
- [x] `npm run test` — 298/298 tests pass
- [x] `npx eslint src/` — 0 errors, 0 warnings
- [x] `npm audit` — 0 vulnerabilities
- [x] Vite config clean (SW versioning plugin, dev proxy, manual chunks)

## 2. Architecture & Modularity
- [x] Clear separation: data layer (hooks/services) vs UI (components) vs logic (utils)
- [x] No circular dependencies — clean import graph
- [x] State boundaries respected: server state in TanStack Query, UI state in Zustand, local in useState
- [x] No prop drilling deeper than 2 levels
- [x] Utils are pure functions with no side effects
- [x] Components follow single-responsibility principle
- [x] Shared utilities extracted (normalizeBar, timezone, validate)

## 3. Code Quality & Maintainability
- [x] No dead code (MacroStatusBar, validateEnv deleted; unused imports cleaned)
- [x] No unresolved TODO/FIXME/HACK comments
- [x] Consistent naming (camelCase functions, PascalCase components)
- [x] No magic numbers (constants in chart.js, Infinity for RSI edge case)
- [x] Functions under ~50 lines; components under ~200 lines
- [x] No deeply nested conditionals
- [x] Effect cleanup on all useEffect hooks (intervals, listeners, observers, WS)

## 4. Security
- [x] Zero API keys in client bundle (server-only via Vercel serverless proxies)
- [x] Rate limiting on all 3 API endpoints (ws-auth 5/min, bars 60/min, snapshot 30/min)
- [x] SSRF guard: ALPACA_DATA_URL validated against host allowlist
- [x] Input validation: symbol regex, timeframe allowlist, date format, limit bounds
- [x] No `dangerouslySetInnerHTML` or `innerHTML` with user data
- [x] Security headers in vercel.json (CSP, X-Frame-Options, nosniff, Referrer-Policy)
- [x] Error responses sanitized (no stack traces, upstream URLs, or status codes leaked)
- [x] `.env` in `.gitignore` and never committed
- [x] localStorage data schema-validated on load (29 tests)
- [x] ErrorBoundary shows raw errors only in dev mode

## 5. Performance
- [x] Indicator computations in useMemo with correct dependencies
- [x] groupBarsByDay computed once in App.jsx, shared via props (not recomputed per consumer)
- [x] Narrowed Zustand selectors in App.jsx (overlay-relevant fields only)
- [x] Chart series use update() for last-bar (not full setData())
- [x] ResizeObserver / event listeners properly cleaned up with null guards
- [x] No memory leaks (intervals, timeouts, subscriptions cleared on unmount)
- [x] Code splitting: 6 lazy chunks (4 panels + SettingsModal + CommandPalette)
- [x] Manual Vite chunks: lightweight-charts (164KB), vendor-api (81KB), motion (125KB)

## 6. Error Handling & Resilience
- [x] React ErrorBoundary wrapping app with fallback UI + reload button
- [x] API failures show user-facing error states with retry button
- [x] WebSocket reconnection with exponential backoff (max 10 retries, auto-recovery after 5min)
- [x] Null/undefined guards on unloaded data
- [x] Toast notifications for user-facing errors and actions
- [x] Loading skeleton states (chart shimmer, panel shimmer)

## 7. Test Coverage & Quality
- [x] All indicator math functions have unit tests (81 indicator tests)
- [x] Edge cases tested (empty input, single element, boundary values, null)
- [x] Signal contract validated (value, bias, strength for all indicators)
- [x] Level detection tested (32 tests: groupBarsByDay, getPreviousLevels, getOpenOfDay, getORBZone, classifyDayType)
- [x] S/R algorithm tested (12 tests)
- [x] Confluence score tested (19 tests)
- [x] Backtest engine tested (16 tests)
- [x] Zustand stores tested (useChartStore 19, usePresetsStore 21, useAlertsStore 12, useJournalStore 8)
- [x] Utility tests (normalizeBar 5, validate 29, timezone 17, snapshot 3)

## 8. Contract Compliance
- [x] Every indicator returns `{ series, signal }` shape (or documented deviation)
- [x] Signal object always has `{ value, bias, strength }` with correct enum values
- [x] Documented deviations: vwapWithBands (5 band series), macd (3 chart series)
- [x] Chart components consume series only; backtester consumes signal only

## 9. UX Completeness
- [x] Loading states with skeleton shimmer for all async operations
- [x] Error states with retry affordance
- [x] Keyboard shortcuts (1-6, [/], Cmd+K, A/B/J/W, Cmd+Shift+S, Esc)
- [x] Command palette (Cmd+K) for every action
- [x] Responsive layout (sidebar drawer on mobile, panels as full-screen overlays)
- [x] Touch targets 44px minimum on touch devices
- [x] Swipe gestures (open/close sidebar)
- [x] 4-step onboarding tour for new users
- [x] 3 themes + 6 accent colors per theme
- [x] All animations respect prefers-reduced-motion
- [x] Sound alerts (optional, Web Audio API)

## 10. Documentation Accuracy
- [x] `CLAUDE.md` file paths match actual file locations
- [x] `architecture.md` matches current data flow and component map (rewritten 2026-03-16)
- [x] `security.md` matches current serverless proxy model (rewritten 2026-03-16)
- [x] `git.md` reflects actual workflow (updated 2026-03-16)
- [x] `indicators.md` code signatures match actual function signatures (updated 2026-03-16)
- [x] `tasks.md` reflects completed work accurately
- [x] `README.md` matches current project structure and setup
- [x] `brainstorming.md` build priority section current (updated 2026-03-16)

---

## Current Stats (2026-03-15)

| Metric | Value |
|---|---|
| Tests | 274 passing (13 test files) |
| ESLint | 0 errors, 7 warnings |
| npm audit | 0 vulnerabilities |
| Source files | 76 (.js + .jsx) |
| Bundle (main) | 229KB |
| Bundle (lw-charts) | 164KB |
| Bundle (motion) | 125KB |
| Bundle (vendor-api) | 81KB |
| Lazy chunks | 6 |
| Themes | 3 (dark, lumpia, terminal) |
| Accent presets | 18 (6 per theme) |

---

## Deferred Items (low priority)

- [ ] CI/CD pipeline (GitHub Actions) — add when sharing repo
- [ ] Component tests — ROI low while solo-dev and rapidly iterating
- [ ] Replace axios with native fetch (~14KB savings)
- [ ] Mobile-specific QA pass (iOS Safari, Chrome Android)
- [ ] Real PWA icons (replace placeholder PNGs)
- [ ] Lighthouse PWA audit pass
