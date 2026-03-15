# Git Conventions — Lumpia

> Follow these rules every session. Claude will remind you when to branch, commit, and PR.

---

## Branch Strategy

```
main
└── develop
    ├── feature/core-chart
    ├── feature/levels-vwap
    ├── feature/momentum-intelligence
    ├── feature/structure
    ├── feature/live-data
    └── feature/deploy
```

### Rules
- **Never commit directly to `main`** — only merges from `develop` via PR
- **Never commit directly to `develop`** — only merges from feature branches
- All work happens on `feature/*` branches
- One feature branch per phase (or per logical chunk of work)
- Delete feature branches after merging

---

## Branch Naming

```
feature/description-in-kebab-case
fix/what-was-broken
docs/what-was-documented
chore/what-maintenance-task
refactor/what-was-refactored
```

### Examples
```
feature/core-chart
feature/levels-vwap
fix/vwap-daily-reset
docs/update-indicators
chore/upgrade-dependencies
```

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
git commit -m "feat(levels): add previous day high/low lines and ORB zone"
git commit -m "fix(vwap): reset calculation at market open each day"
git commit -m "feat(ui): add ATR gauge and day type banner"
git commit -m "docs(roo): update tasks.md phase 1 complete"
git commit -m "chore(deps): install zustand and tanstack query"
```

### Rules
- Present tense: "add" not "added"
- Lowercase after the colon
- Under 72 characters for the subject line
- No period at the end

---

## Workflow — Every Feature

```bash
# 1. Make sure develop is up to date
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Do your work, commit often
git add .
git commit -m "feat(scope): what you did"

# 4. When feature is complete, merge back
git checkout develop
git merge feature/your-feature-name

# 5. Delete the feature branch (keep it clean)
git branch -d feature/your-feature-name

# 6. Push develop
git push origin develop

# 7. When develop is stable and battle-tested → merge to main
git checkout main
git merge develop
git push origin main
```

---

## When Claude Will Tell You to Commit

Claude will explicitly say **"time to commit"** at these moments:
- After initial project setup is verified working
- After each config file is confirmed
- After each phase is complete and `npm run build` passes
- Before starting any new phase
- Anytime a meaningful chunk of working code is done

**Never go more than ~30 minutes of working code without a commit.**

---

## .gitignore — What Never Gets Committed

```
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
```

`.env.example` **IS** committed — it shows the shape without exposing values.

---

## Security Check Before Every Commit

```bash
# Always run this before committing
git status
git diff --staged

# Confirm .env is NOT in the staged files
# If you ever see .env in git status — STOP, do not commit
```

---

## Initial Setup Commands

```bash
# After npm create vite and npm install:
git init
git add .
git commit -m "chore: init vite react project"

# Set up remote (after creating repo on github.com)
git remote add origin https://github.com/yourusername/lumpia.git
git push -u origin main

# Set up develop branch
git checkout -b develop
git push -u origin develop
```
