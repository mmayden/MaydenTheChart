# Git Conventions — Lumpia (Cheechart)

> Current as of Phase 12B (2026-03-15).

---

## Branch Strategy

All work is committed directly to `main`. The project is solo-dev and
moves fast — feature branches add overhead without value at this stage.

```
main ← all commits go here
```

**When to revisit:** If collaborators join or the project is open-sourced,
introduce `develop` + `feature/*` branches with PR-based merges.

---

## Commit Message Format

Follow **Conventional Commits** spec: `type(scope): description`

### Types
| Type | When to use |
|---|---|
| `feat` | New feature or component |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no behavior change |
| `chore` | Build, config, dependencies |
| `test` | Adding or fixing tests |

### Examples
```bash
git commit -m "feat(chart): add candlestick chart with lightweight-charts v5"
git commit -m "feat(indicators): add EMA 9/48/200 overlays with exact colors"
git commit -m "fix(vwap): reset calculation at market open each day"
git commit -m "feat(ux): Phase 12B — Motion animations, accent colors, skeleton loading"
git commit -m "chore: code cleanup — add missing tests, fix ESLint warnings"
git commit -m "docs: update architecture.md, security.md for Phase 12B"
```

### Rules
- Present tense: "add" not "added"
- Lowercase after the colon
- Under 72 characters for the subject line
- No period at the end
- Phase commits use scope to indicate area: `feat(ux)`, `feat(prod)`, `feat(security)`

---

## Workflow

```bash
# 1. Do work
# 2. Run tests + build
npm run test && npm run build

# 3. Stage specific files (avoid git add -A)
git add src/path/to/changed/files

# 4. Commit
git commit -m "type(scope): description"

# 5. Push
git push origin main
```

---

## Security Check Before Every Commit

```bash
git status
git diff --staged | grep -i "ALPACA\|api_key\|secret\|token"

# Confirm .env is NOT in staged files
# If you see real credential values — STOP, do not commit
```

---

## .gitignore — What Never Gets Committed

```
node_modules/
dist/
.env
.env.local
.env.*.local
.DS_Store
Thumbs.db
*.log
npm-debug.log*
.vscode/settings.json
.idea/
```

`.env.example` **IS** committed — shows the variable shape without values.

---

## Deployment

Vercel auto-deploys from `main` on push. No manual deploy step needed
unless testing a specific build:

```bash
npm run build && npm run preview   # Test production build locally
vercel --prod                      # Manual deploy (rare)
```
