#!/bin/bash
# SessionStart hook — prepares this monorepo for Claude Code on the web.
#
# Installs the dependencies that tests, linters and type-checks need, so a
# session can verify its own work instead of discovering a missing node_modules
# halfway through. Safe to re-run: every step is idempotent.
#
# Local sessions already have a working checkout, so this exits early unless
# it is running in a remote (web) environment.

set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$ROOT"

# ---------------------------------------------------------------- autocare
# Next.js + Prisma. `postinstall` runs `prisma generate`, which reads
# DATABASE_URL from the schema's env() call, so the .env must exist first.
if [ -d autocare ]; then
  echo "==> autocare: npm install"
  if [ ! -f autocare/.env ]; then
    cp autocare/.env.example autocare/.env
  fi
  ( cd autocare && npm install --no-audit --no-fund )
fi

# ------------------------------------------------------- postgres (autocare)
# autocare's interesting tests — security.test.ts and access-control.test.ts,
# run by `npm run test:db` — need a real database. The image ships a PostgreSQL
# 16 server (docker is present but its daemon is not running), so bring up a
# throwaway local cluster. Best-effort: if any of this fails the session still
# works, just without the DB-backed suites.
PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1 || true)
PGDATA_DIR=/var/lib/postgresql/autocare-test

if [ -d autocare ] && [ -n "$PGBIN" ] && getent passwd postgres >/dev/null; then
  if ! "$PGBIN/pg_isready" -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
    echo "==> postgres: starting local cluster for autocare test:db"
    {
      if [ ! -s "$PGDATA_DIR/PG_VERSION" ]; then
        mkdir -p "$PGDATA_DIR"
        chown -R postgres "$PGDATA_DIR"
        su postgres -c "$PGBIN/initdb -D $PGDATA_DIR -U autocare --auth=trust"
      fi
      su postgres -c "$PGBIN/pg_ctl -D $PGDATA_DIR -l $PGDATA_DIR/server.log -o '-p 5432 -k /tmp' start"
      sleep 2
      # createdb is idempotent here only because we tolerate the "already exists" error.
      psql -h 127.0.0.1 -U autocare -d postgres -c "CREATE DATABASE autocare;" 2>/dev/null || true
    } >/dev/null 2>&1 || echo "    (postgres setup failed; npm run test:db will not work)"
  fi

  if "$PGBIN/pg_isready" -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
    echo "==> autocare: applying migrations"
    ( cd autocare \
      && DATABASE_URL="postgresql://autocare:autocare@127.0.0.1:5432/autocare?schema=public" \
         npx prisma migrate deploy ) >/dev/null 2>&1 \
      || echo "    (migrate deploy failed)"
  fi
fi

# -------------------------------------------------------------- rallyready
# Vite + React + Vitest. No database, no env needed.
if [ -d rallyready ]; then
  echo "==> rallyready: npm install"
  ( cd rallyready && npm install --no-audit --no-fund )
fi

# ------------------------------------------------------- webapp-testing skill
# The vendored webapp-testing skill drives Playwright from Python. The binding
# is not in the image and MUST match the bundled Chromium build (1194) — an
# unpinned install pulls a newer Playwright that hunts for a build that is not
# there. Never run `playwright install`; the browsers already exist at
# $PLAYWRIGHT_BROWSERS_PATH.
if ! python3 -c "import playwright" 2>/dev/null; then
  echo "==> playwright (python binding, pinned to match bundled chromium)"
  pip install --quiet "playwright==1.56.0" || echo "    (playwright install failed; webapp-testing skill will be unavailable)"
fi

# ------------------------------------------------------------ session env
# Persist for the rest of the session. Guarded so re-running the hook (resume,
# clear, compact) does not append the same exports over and over.
if [ -n "${CLAUDE_ENV_FILE:-}" ] && ! grep -q 'AUTOCARE_SESSION_ENV_WRITTEN' "$CLAUDE_ENV_FILE" 2>/dev/null; then
  {
    echo '# --- written by .claude/hooks/session-start.sh ---'
    echo 'export AUTOCARE_SESSION_ENV_WRITTEN=1'
    echo 'export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1'
    echo 'export NEXT_TELEMETRY_DISABLED=1'
    # So `npm run test:db` and `npm run seed` work without extra setup.
    echo 'export DATABASE_URL="postgresql://autocare:autocare@127.0.0.1:5432/autocare?schema=public"'
    echo 'export AUTH_SECRET="local-session-secret-not-for-production"'
  } >> "$CLAUDE_ENV_FILE"
fi

# cyclemind_ai (Flutter) is intentionally not handled: no Flutter/Dart SDK is
# present in this image, so it cannot be built or tested here. Its CI builds it
# via .github/workflows/deploy-web.yml instead.

echo "==> session-start hook complete"
