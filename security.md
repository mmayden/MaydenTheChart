# Security Standards — Lumpia (Cheechart)

> Current as of Code Quality Audit (2026-03-16). Security is non-negotiable.

---

## Architecture — Server-Side Proxy Model

API keys **never** reach the browser. All Alpaca communication goes through
Vercel serverless functions that hold credentials server-side.

```
Browser ──► /api/bars.js ──► data.alpaca.markets/v2 (keys server-only)
Browser ──► /api/snapshot.js ──► data.alpaca.markets/v2 (keys server-only)
Browser ──► /api/ws-auth.js ──► returns WS credentials (bearer token gate)
```

Environment variables use **no `VITE_` prefix** for API keys — they exist only
in the Vercel runtime, never in the client bundle.

---

## Environment Variables

### Server-only (Vercel dashboard + `.env`)
```bash
ALPACA_API_KEY=your_paper_key         # Never VITE_ prefixed
ALPACA_SECRET_KEY=your_paper_secret   # Never VITE_ prefixed
ALPACA_DATA_URL=https://data.alpaca.markets/v2
WS_AUTH_TOKEN=random_uuid             # Protects /api/ws-auth endpoint
```

### Client-side (`.env`)
```bash
VITE_WS_AUTH_TOKEN=same_as_WS_AUTH_TOKEN   # Bearer token for WS auth proxy
VITE_SENTRY_DSN=                           # Optional — Sentry error tracking
```

### The two-file pattern
```
.env          ← real values, gitignored, NEVER committed
.env.example  ← template with placeholders, IS committed
```

> **Note on `VITE_WS_AUTH_TOKEN`:** This bearer token ships in the client bundle.
> It is NOT a real secret — it gates the ws-auth endpoint to prevent casual abuse.
> Rate limiting is the actual security control. Documented in `api/ws-auth.js`.

---

## API Endpoint Security

All three serverless endpoints have layered protections:

### Rate Limiting (in-memory, per serverless instance)
| Endpoint | Limit | Window |
|---|---|---|
| `/api/ws-auth` | 5 requests/IP | 1 minute |
| `/api/bars` | 60 requests/IP | 1 minute |
| `/api/snapshot` | 30 requests/IP | 1 minute |

All rate limiters include TTL cleanup (expired entries purged every 2 minutes)
and a 10K entry cap to prevent unbounded memory growth on warm instances.

### SSRF Guard
`ALPACA_DATA_URL` is validated via `new URL().hostname` exact match against
an `ALLOWED_DATA_HOSTS` Set in both `api/bars.js` and `api/snapshot.js`.
Prevents an attacker from manipulating the env var to proxy requests to
internal services. Uses hostname parsing (not `startsWith()`) to prevent
bypass via `data.alpaca.markets.evil.com`.

### Input Validation
| Input | Validation | Location |
|---|---|---|
| Symbol | `/^[A-Z]{1,10}(\.[A-Z]{1,2})?$/` | bars.js, snapshot.js, useURLState.js, WatchlistPanel.jsx |
| Timeframe | Allowlist: `1Min, 5Min, 15Min, 1Hour, 4Hour, 1Day` | bars.js |
| Date params | ISO 8601 regex with anchoring | bars.js |
| Limit param | Integer 1–10000 | bars.js |
| Bearer token | Constant-time comparison | ws-auth.js |

### Error Sanitization
API error responses **never** leak:
- Upstream status codes from Alpaca
- Upstream URLs or hostnames
- Stack traces or internal error details
- Only generic messages: `"Data temporarily unavailable"`, `"Invalid request"`

---

## Client-Side Security

### localStorage Schema Validation
All data loaded from localStorage is validated against schemas before use:
- Presets: structure, field types, enum values
- Journal entries: required fields, date format, rating bounds
- Watchlist: array of valid symbol strings
- Symbol usage: frequency map shape

Implemented in `src/utils/validate.js` (29 unit tests).
Wired into `usePresetsStore`, `useJournalStore`, `WatchlistPanel`, `SymbolInput`.

### ErrorBoundary
`src/components/ui/ErrorBoundary.jsx` wraps the entire app:
- **Production:** shows generic error message + reload button
- **Development:** shows raw error message + stack trace

### URL Parameter Validation
`src/hooks/useURLState.js` validates all URL params (`?s=`, `?tf=`, `?panel=`)
against regex patterns and allowlists before applying to state.

### Content Security Policy (vercel.json)
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
connect-src 'self' wss://stream.data.alpaca.markets;
font-src 'self';
img-src 'self' data: blob:;
worker-src 'self';
manifest-src 'self';
frame-ancestors 'none';
```

### Additional Headers
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## WebSocket Security

WebSocket credentials are obtained through the `/api/ws-auth` proxy:

```
Browser ──bearer token──► /api/ws-auth ──► returns { key, secret }
Browser ──key+secret──► wss://stream.data.alpaca.markets/v2/iex
```

- The ws-auth endpoint is rate-limited (5/IP/min)
- The bearer token is the `VITE_WS_AUTH_TOKEN` value
- Connection uses secure WebSocket (wss://)
- Auth message is never logged to console

---

## Pre-Commit Security Check

```bash
git status
git diff --staged | grep -i "ALPACA\|api_key\|secret\|token"
```

If you see real credential values in staged changes — **stop and fix**.

---

## Dependency Security

```bash
npm audit               # Check for vulnerabilities (currently 0)
npm outdated            # See what needs updating
```

Never proceed with critical/high vulnerabilities without understanding the impact.

---

## Threat Model Summary

| Threat | Mitigation |
|---|---|
| API key exposure | Server-side proxy, no VITE_ prefix on keys |
| SSRF via env manipulation | Host allowlist on ALPACA_DATA_URL |
| API abuse / scraping | Per-IP rate limiting on all endpoints |
| XSS via user input | No dangerouslySetInnerHTML, regex validation on all inputs |
| localStorage poisoning | Schema validation on load |
| Clickjacking | X-Frame-Options DENY, frame-ancestors none |
| Error information leak | Sanitized API errors, ErrorBoundary in prod |
| Stale cached code | SW auto-versioned at build time, immutable asset hashes |
