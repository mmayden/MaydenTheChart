# Security Standards — Loompia

> Follow these rules every session without exception.
> Security is non-negotiable even on a learning project.

---

## The #1 Rule — API Keys Never Leave Your Machine

Your Alpaca API keys give access to your paper trading account.
Even though it's paper money, treat the keys like real credentials.

```
NEVER commit .env to git
NEVER share your API keys in Discord, GitHub issues, or chat
NEVER hardcode keys in source files
NEVER log keys to the console
```

---

## Environment Variables

### The two-file pattern
```
.env          ← real keys, gitignored, NEVER committed
.env.example  ← template with placeholder values, IS committed
```

### Correct .env.example (commit this)
```bash
VITE_ALPACA_API_KEY=your_paper_api_key_here
VITE_ALPACA_SECRET_KEY=your_paper_secret_key_here
VITE_ALPACA_BASE_URL=https://paper-api.alpaca.markets
VITE_ALPACA_DATA_URL=https://data.alpaca.markets
```

### Your actual .env (never commit this)
```bash
VITE_ALPACA_API_KEY=PKxxxxxxxxxxxxxxxxxxxxxxxx
VITE_ALPACA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_ALPACA_BASE_URL=https://paper-api.alpaca.markets
VITE_ALPACA_DATA_URL=https://data.alpaca.markets
```

### Validation on startup
```js
// src/utils/validateEnv.js
const REQUIRED_VARS = [
  'VITE_ALPACA_API_KEY',
  'VITE_ALPACA_SECRET_KEY',
  'VITE_ALPACA_BASE_URL',
  'VITE_ALPACA_DATA_URL',
]

export function validateEnv() {
  const missing = REQUIRED_VARS.filter(key => !import.meta.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\nCopy .env.example to .env and fill in your Alpaca paper trading keys.`
    )
  }
}
```

Call `validateEnv()` in `src/main.jsx` before rendering the app.

---

## Pre-Commit Security Check

**Run this before every commit:**
```bash
git status
git diff --staged | grep -i "VITE_ALPACA\|api_key\|secret"
```

If you ever see API key values in `git diff --staged` — **do not commit**.
Remove the values, verify `.env` is in `.gitignore`, and check `git status` again.

---

## .gitignore (required entries)

```
# Environment variables — NEVER commit
.env
.env.local
.env.*.local

# Dependencies
node_modules/

# Build output
dist/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# IDE
.vscode/settings.json
.idea/
```

---

## VITE_ Prefix Warning

Vite exposes any `VITE_` prefixed variable to the browser bundle.
This means your API keys **are visible in the browser** if someone opens DevTools.

This is acceptable for a personal paper trading tool (no real money, paper account only).

**If you ever switch to a live trading account:**
- Move all Alpaca API calls to a backend server (Node/Express or Vercel serverless functions)
- Never expose live trading keys to the browser
- This is a known limitation of the current architecture and it's fine for paper trading

---

## Dependency Security

### Before installing any package
```bash
npm info <package-name>    # Check it exists and is the right package
```

### After installing packages
```bash
npm audit                  # Check for vulnerabilities
npm audit fix              # Auto-fix if safe to do so
```

### Keep dependencies updated
```bash
npm outdated               # See what's out of date
npm update                 # Update within semver range
```

Never proceed if `npm audit` shows critical or high severity vulnerabilities
without understanding what they are and whether they affect this project.

---

## Alpaca API Security

- Use **paper trading** keys only: `paper-api.alpaca.markets`
- Paper keys cannot access or affect real money accounts
- If you ever create live trading keys, treat them as highly sensitive credentials
- Never use the same key for both paper and live accounts

---

## WebSocket Security

The Alpaca WebSocket requires authentication on connect:
```js
// Correct — keys sent as part of auth message on connect
ws.send(JSON.stringify({
  action: 'auth',
  key: import.meta.env.VITE_ALPACA_API_KEY,
  secret: import.meta.env.VITE_ALPACA_SECRET_KEY
}))
```

The keys travel over a secure WebSocket (wss://) connection.
Do not log the auth message or keys to the console.

---

## Vercel Deployment Security

When deploying to Vercel, add environment variables through the Vercel dashboard:
- Project Settings → Environment Variables
- Add each `VITE_*` variable with its value
- Never put real values in `vercel.json`

```json
// vercel.json — reference variable names only, not values
{
  "env": {
    "VITE_ALPACA_API_KEY": "@alpaca_api_key"
  }
}
```
