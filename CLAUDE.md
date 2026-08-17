# CorruptionReportSystem — repository guide

This repository is a **monorepo of five unrelated projects**. Despite the
repository name, most of the code here has nothing to do with corruption
reporting — the name is historical. There is no shared build, no workspace
tooling, and no dependency between projects. Treat each directory as its own
codebase and work inside it.

| Directory | What it is | Stack | Build/test here? |
|---|---|---|---|
| `autocare/` | Job-management system for a car care shop | Next.js, Prisma, PostgreSQL, next-auth | Yes — full |
| `rallyready/` | Solo badminton training app | Vite, React, TypeScript, Supabase | Yes — full |
| `cyclemind_ai/` | AI cycling coach and bike doctor | Flutter, Riverpod, Firebase | **No — no Flutter SDK** |
| `corruption-reporting-system-final/` | Corruption reporting site | Static HTML/CSS/JS, Firebase | No build step |
| `bike-guide-app/` | Cycling guide PWA | Static HTML/CSS/JS, Firebase | No build step |

Each project has its own `CLAUDE.md` with specifics. Read that one before
working in it.

## Environment

A `SessionStart` hook (`.claude/hooks/session-start.sh`) prepares remote
sessions: it installs npm dependencies for `autocare` and `rallyready`, starts a
local PostgreSQL cluster and applies autocare's migrations, and installs the
pinned Python Playwright binding. It only runs when `CLAUDE_CODE_REMOTE=true`,
so local checkouts are untouched.

If something seems missing, run it by hand:

```bash
CLAUDE_CODE_REMOTE=true ./.claude/hooks/session-start.sh
```

### Known environment limits

- **No Flutter or Dart SDK.** `cyclemind_ai` cannot be built, run or tested
  here. Its CI builds it via `.github/workflows/deploy-web.yml`. Change its
  Dart source by reading carefully — you cannot verify it locally, so say so
  rather than claiming a change is tested.
- **Docker is installed but its daemon is not running.** `autocare`'s
  `docker-compose.yml` will not work. The hook starts PostgreSQL directly
  instead.
- **Playwright must stay pinned** to `1.56.0` for the Python binding — it has
  to match the bundled Chromium build `1194`. Never run `playwright install`;
  the browsers already live at `$PLAYWRIGHT_BROWSERS_PATH`.

## Skills

`.claude/skills/` contains 23 vendored skills (UI/UX Pro Max, Anthropic's
`frontend-design` and `webapp-testing`, and obra/superpowers). See
`.claude/skills/README.md` for provenance, licenses and runtime requirements.

For UI work, the design database is queryable directly:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard" --stack shadcn
```

Useful stacks for this repo: `shadcn`, `nextjs`, `react`, `html-tailwind`.
Flutter coverage is sparse and often returns no match.

## CI

- `.github/workflows/autocare-ci.yml` — lint, typecheck, test, migrate, seed,
  DB tests and build for `autocare`. Path-filtered to `autocare/**`.
- `.github/workflows/deploy-web.yml` — builds `cyclemind_ai` for web in mock
  mode and publishes to GitHub Pages.

There is **no CI for `rallyready`** or the two static sites. Run their checks
locally before claiming they pass.

## Conventions

- Each project keeps its own `.gitignore` for project-specific entries; the
  root one only covers `node_modules/`, `.vite/`, `.DS_Store` and `*.log`.
- The READMEs in `autocare/`, `rallyready/` and `cyclemind_ai/` are detailed and
  current. Read them before making architectural changes.
