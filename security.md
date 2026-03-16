# Security Model — Cheechart (Lumpia)

> Non-negotiable rules. Follow every session without exception.
> Last updated: 2026-03-15 (Phase 12B)

---

## Architecture: Serverless Proxy Pattern

API keys live on the server only. The browser never sees them.

```
Browser ──► /api/bars.js ──► Alpaca REST API
        ──► /api/snapshot.js ──► Alpaca REST API
        ──► /api/ws-auth.js ──► returns Alpaca creds for WS
```

All three endpoints are Vercel serverless functions in `api/`.
The browser calls `/api/*` routes — never `data.alpaca.markets` directly.

---

## Server-Side Protections

### Rate Limiting (all 3 endpoints)

| Endpoint | Limit | Window |
|---|---|---|
| `/api/ws-auth` | 5 requests | per IP per minute |
| `/api/bars` | 60 requests | per IP per minute |
| `/api/snapshot` | 30 requests | per IP per minute |

In-memory per serverless instance (best-effort on Vercel's cold-start model).

### SSRF Guard

`ALPACA_DATA_URL` validated against `ALLOWED_DATA_HOSTS` allowlist before any fetch.
Prevents attackers from redirecting API calls to internal networks via env var manipulation.

### Input Validation

| Input | Validation |
|---|---|
| `symbol` | `/^[A-Z]{1,10}(\.[A-Z]{1,2})?$/` (supports `BRK.B`) |
| `timeframe` | Allowlist: `1Min`, `5Min`, `15Min`, `1Hour`, `4Hour`, `1Day` |
| `limit` | Integer, 1–10000 |
| `start`/`end` | ISO 8601 format with anchored regex (no trailing garbage) |
| URL params (`?s=`) | Same symbol regex in `useURLState.js` |
| Watchlist add | Same symbol regex in `WatchlistPanel.jsx` |

### Error Sanitization

API errors never leak upstream details to clients:
- Status codes from Alpaca are not forwarded
- Stack traces never reach the browser
- Generic error messages only (e.g., "Failed to fetch bars")
- Raw errors shown only in `import.meta.env.DEV` (ErrorBoundary)

---

## Client-Side Protections

### Security Headers (vercel.json)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### localStorage Validation

All persisted data is schema-validated on load (`src/utils/validate.js`, 29 tests):
- Presets, journal entries, watchlist, symbol usage, alerts
- Malformed data is silently discarded (falls back to defaults)

### WebSocket Auth

- `VITE_WS_AUTH_TOKEN` ships in the client bundle (intentional for paper trading)
- This is NOT a real secret — rate limiting on `/api/ws-auth` is the actual gate
- The token is a bearer token, not the Alpaca keys themselves
- Document this risk for any future real-money migration

### No innerHTML

`CrosshairLegend.jsx` uses DOM element creation (not `innerHTML`).
No `dangerouslySetInnerHTML` anywhere in the codebase.

---

## Environment Variables

### The two-file pattern

```
.env          ← real keys, gitignored, NEVER committed
.env.example  ← template with placeholder values, IS committed
```

### Server-only (no VITE_ prefix — never in browser bundle)

```bash
ALPACA_API_KEY=PKxxxxxxxxxxxxxxxx
ALPACA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
ALPACA_DATA_URL=https://data.alpaca.markets
WS_AUTH_TOKEN=your_random_token
```

### Client-side (VITE_ prefix — visible in bundle)

```bash
VITE_WS_AUTH_TOKEN=your_random_token     # bearer token for WS auth endpoint
VITE_SENTRY_DSN=                         # optional error tracking
```

### Vercel Dashboard

All env vars must be added in Vercel Project Settings → Environment Variables.
Never put actual values in `vercel.json`.

---

## Pre-Commit Security Check

```bash
git status                                    # .env must NOT appear
git diff --staged | grep -i "api_key\|secret" # must return nothing
```

---

## .gitignore (required entries)

```
.env
.env.local
.env.*.local
node_modules/
dist/
.DS_Store
*.log
```

---

## Known Acceptable Risks

1. **`VITE_WS_AUTH_TOKEN` in client bundle** — Paper trading only. Anyone can call `/api/ws-auth` with the token. Rate limiting (5/min) is the mitigation. Must be revisited for real money.

2. **In-memory rate limiting resets on cold start** — Vercel serverless functions don't share state. A determined attacker could bypass limits by triggering cold starts. Acceptable for current scale.

3. **No CSRF protection** — API endpoints are GET-only data fetches. No state-mutating server operations exist.

---

## Dependency Security

```bash
npm audit          # Must show 0 critical/high before deploy
npm outdated       # Check for security patches
```

Current state: 0 vulnerabilities (as of 2026-03-15).
