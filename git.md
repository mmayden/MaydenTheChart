# Git Conventions — Cheechart (Lumpia)

> Follow these conventions for all commits.
> Last updated: 2026-03-15

---

## Current Workflow

All work is currently on `main`. Feature branches and develop branch
will be introduced when the project is shared or has collaborators.

```bash
# Typical workflow
git add <specific-files>
git commit -m "feat(scope): description"
git push origin main
```

---

## Commit Message Format

Follow **Conventional Commits**: `type(scope): description`

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

### Scopes

Common scopes: `chart`, `indicators`, `ui`, `panels`, `store`, `api`, `security`, `deps`

### Examples

```bash
git commit -m "feat(chart): add candlestick chart with lightweight-charts v5"
git commit -m "feat(indicators): add EMA 9/48/200 overlays with exact colors"
git commit -m "fix(vwap): reset calculation at market open each day"
git commit -m "feat(panels): add backtest panel with equity curve"
git commit -m "chore(deps): upgrade motion to v12"
git commit -m "test(confluence): add 19 unit tests for score calculation"
```

### Rules
- Present tense: "add" not "added"
- Lowercase after the colon
- Under 72 characters for the subject line
- No period at the end

---

## Future Branch Strategy (when collaborating)

```
main
└── develop
    ├── feature/description
    ├── fix/description
    └── chore/description
```

- `main` — production only, merges from develop via PR
- `develop` — integration branch
- `feature/*` — all new work

---

## Security Check Before Every Commit

```bash
git status                                     # .env must NOT appear
git diff --staged | grep -i "api_key\|secret"  # must return nothing
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

`.env.example` IS committed (template with placeholder values).
