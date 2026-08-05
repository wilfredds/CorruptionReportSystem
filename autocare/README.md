# AutoCare

An information management system for **HI-OCTEN CAR CARE SERVICES**.

It replaces the shop's paper notebook. The owner taps through seven short
screens to record a finished job; the running total is calculated for him and
can never be typed by hand. Every job can be printed or downloaded as a PDF
receipt.

---

## Table of contents

1. [What it does](#what-it-does)
2. [Requirements](#requirements)
3. [Local setup](#local-setup)
4. [Logging in](#logging-in)
5. [Deploying to Vercel + Neon](#deploying-to-vercel--neon)
6. [How the money maths works](#how-the-money-maths-works)
7. [Security](#security)
8. [Languages](#languages)
9. [Tests](#tests)
10. [Project layout](#project-layout)

---

## What it does

| Screen | Who | What it is for |
| --- | --- | --- |
| **Home** | everyone | Today's jobs and income, this month's income, unpaid total, last 10 jobs, and one very large **Record New Job** button. |
| **Record New Job** | everyone | The seven-step wizard. One decision per screen. |
| **Jobs** | everyone | Search and filter every job; open one to print or download its receipt. |
| **Customers / Vehicles** | everyone | Add and edit people and their vehicles; see a customer's full history. |
| **Services** | admin edits, staff views | The catalog of repeatable services and their usual prices. |
| **Reports** | admin | Daily and monthly income, most-used spare parts, top customers, CSV/JSON backup. |
| **Users** | admin | Create staff accounts, turn them on and off, change passwords, unlock accounts. |
| **Settings** | admin | The shop details printed on receipts, and your own language. |
| **Activity Log** | admin | Every login and every change anyone made. |

### Not built in v1 (by design)

Public customer sign-up, online payments, SMS/email, inventory stock levels and
multi-branch support are **not** implemented. The database schema leaves room
for all of them — see the notes at the top of `prisma/schema.prisma`.

---

## Requirements

- **Node.js 20 or newer** (`node --version`)
- **PostgreSQL** — either Docker, or a free [Neon](https://neon.tech) database

---

## Local setup

### 1. Install

```bash
cd autocare
npm install
```

### 2. Start a database

**Option A — Docker (easiest):**

```bash
docker compose up -d
```

This starts PostgreSQL 16 on `localhost:5432` with user/password/database all
set to `autocare`.

**Option B — Neon (no Docker needed):** create a free project at
[neon.tech](https://neon.tech) and copy its connection string.

### 3. Configure

```bash
cp .env.example .env
```

Open `.env` and set two values:

- `DATABASE_URL` — the first line of `.env.example` already matches the Docker
  option above. For Neon, paste your connection string instead.
- `AUTH_SECRET` — generate one with:

  ```bash
  openssl rand -base64 32
  ```

### 4. Create the tables and demo data

```bash
npx prisma migrate dev
npm run seed
```

The seed prints the two admin usernames and their temporary passwords **once**.
Write them down.

### 5. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

### All five commands together

```bash
npm install && npx prisma migrate dev && npm run seed && npm run dev
```

---

## Logging in

The seed creates the two owner accounts:

| Name | Username | Temporary password |
| --- | --- | --- |
| RAUL V. SANTOS | `raul` | `HiOcten#2026raul` |
| Francis Wilfred Antiporda | `france` | `HiOcten#2026france` |

Both are **ADMIN**. Change these passwords after the first login:
**Users → Change password**.

To seed different passwords instead, set them before running the seed:

```bash
SEED_RAUL_PASSWORD='...' SEED_FRANCE_PASSWORD='...' npm run seed
```

On a user's very first login the app shows the **Rules of Use** page and will
not let them go any further until they tick the box. That is deliberate.

---

## Deploying to Vercel + Neon

Follow these in order. It takes about fifteen minutes.

### Step 1 — Create the database on Neon

1. Go to <https://neon.tech> and sign up (the free tier is enough).
2. Click **New Project**. Name it `autocare`. Pick the region closest to the
   Philippines (Singapore is usually the best choice).
3. When it finishes, Neon shows a **Connection string**. Choose the **Pooled
   connection** version and copy it. It looks like:

   ```
   postgresql://user:password@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

4. Keep this tab open — you need that string in Step 3.

### Step 2 — Put the code on GitHub

If it is not there already:

```bash
git add .
git commit -m "AutoCare"
git push
```

### Step 3 — Create the Vercel project

1. Go to <https://vercel.com> and sign in with GitHub.
2. Click **Add New → Project** and pick this repository.
3. **Important:** set **Root Directory** to `autocare` (this repo holds more
   than one project). Click **Edit** next to Root Directory and choose it.
4. Framework Preset should already say **Next.js**. Leave the build settings
   alone.
5. Open **Environment Variables** and add these two:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the pooled connection string from Step 1 |
   | `AUTH_SECRET` | run `openssl rand -base64 32` and paste the result |

   Optionally also add `SHOP_TIMEZONE` = `Asia/Manila`.

6. Click **Deploy** and wait for it to finish.

### Step 4 — Create the tables on Neon

The deploy builds the app but does **not** create the tables. Pick whichever of
these suits you — they produce exactly the same database.

**Option A — paste one file into Neon (no local setup needed).**

1. In Neon, open your project and click **SQL Editor**.
2. Open [`prisma/bootstrap.sql`](prisma/bootstrap.sql), copy the whole file,
   paste it in, and press **Run**.

That creates the schema, the two owner accounts, the service catalog and two
sample jobs in one go. It also records the migration as applied, so a later
`npx prisma migrate deploy` correctly reports "No pending migrations".

**Option B — from your own computer** (needs Node and a clone of this repo):

```bash
cd autocare
npm install
DATABASE_URL="<your Neon connection string>" npx prisma migrate deploy
DATABASE_URL="<your Neon connection string>" npm run seed
```

Write down the passwords the seed prints.

Either way, verify it worked by running this in the Neon SQL Editor — it should
return two users and two jobs:

```sql
SELECT (SELECT count(*) FROM "User") AS users,
       (SELECT count(*) FROM "Job")  AS jobs;
```

### Step 5 — Log in

Open the URL Vercel gave you and log in as `raul` or `france`. Accept the Rules
of Use, then go to **Users → Change password** and set real passwords for both
owners.

### Step 6 (optional) — Your own domain

In Vercel: **Project → Settings → Domains → Add**, then follow the instructions
for your domain registrar.

### If a later deploy needs a schema change

After changing `prisma/schema.prisma`, create the migration locally
(`npx prisma migrate dev`), commit it, then apply it to Neon with
`DATABASE_URL="<neon>" npx prisma migrate deploy` before or just after the
deploy finishes.

---

## How the money maths works

All of it lives in one file: **`lib/calc.ts`**. The browser imports it to show
the live total, and the server imports the *same* function to compute what it
stores. They cannot disagree.

```
subtotal = laborCharge + expenses + sum(part.quantity x part.unitPrice) + sum(service.price)
total    = subtotal - discount
balance  = total - amountPaid
status   = PAID if balance <= 0 ; UNPAID if amountPaid == 0 ; otherwise PARTIAL
```

Two rules are enforced rather than merely intended:

- **The total is never an input.** In the UI it is rendered text
  (`components/wizard/total-bar.tsx`), never a form field.
- **The server never trusts the client.** `jobSchema` in `lib/validation.ts`
  does not even *accept* `subtotal`, `total`, `balance` or `status` — a client
  that posts them has them silently dropped, and `saveJobAction` recomputes
  everything from the line items before writing. There is a test for this
  (`tests/job-integrity.test.ts`).

Arithmetic is done in whole centavos, so adding ten ₱0.07 lines gives exactly
₱0.70.

---

## Security

| Control | Where |
| --- | --- |
| bcrypt password hashing, cost 12 | `lib/password.ts` |
| Password policy: 8+ chars, upper, lower, number, symbol | `lib/validation.ts` (server) + `components/forms/password-fields.tsx` (live checklist) |
| Lockout after 5 failed logins, for 15 minutes | `lib/auth-logic.ts` |
| Rate limit on the login route | `lib/rate-limit.ts` |
| JWT sessions in httpOnly + secure + sameSite cookies, 30-minute idle timeout | `auth.config.ts` |
| RBAC in middleware **and** re-checked server-side | `middleware.ts`, `lib/rbac.ts`, `lib/session.ts` |
| Zod validation on every mutation | `lib/validation.ts` |
| Audit logging | `lib/audit.ts` |
| Security headers + CSP | `next.config.mjs` |
| Acceptable Use Policy, acknowledged on first login | `app/policy/` |

A few things worth knowing:

- **The middleware is a convenience, not the boundary.** It sends people
  somewhere sensible instead of rendering a page they cannot use. The real
  control is `requireUser` / `requireAdmin` / `requireCapability` in
  `lib/session.ts`, called inside every server action and route handler,
  because a request can always be aimed straight at an endpoint.
- **CSRF** is handled by Next.js Server Actions, which verify the `Origin`
  header against the `Host` header on every call. If you put the app behind a
  proxy or a second domain, list it in `ALLOWED_ORIGINS`.
- **The login rate limiter is per server instance** (an in-memory map). On
  Vercel several instances may serve traffic, so it is a cheap first line of
  defence, not a hard global cap. The durable control is the per-account
  lockout, which lives in Postgres and is therefore shared. To make the IP
  limit global too, swap `hit()` in `lib/rate-limit.ts` for a Redis `INCR` —
  the signature is designed to stay the same.
- **Passwords are never logged.** There is a test asserting no audit row ever
  contains one.
- `bcryptjs` is used rather than the native `bcrypt` binding: it is the same
  algorithm and hash format, and it deploys to Vercel's serverless runtime
  without a native build step.

---

## Languages

Filipino is the default; English, Spanish, Japanese, Korean and Chinese ship
alongside it. All six catalogs are complete (404 keys each) — no UI text is
hardcoded.

### Adding another language

1. Copy `messages/en.json` to `messages/<code>.json` and translate it.
2. Add one entry to the `locales` array in `i18n/locales.ts`.

That is the whole procedure. Any key you have not translated yet falls back to
English automatically (`i18n/request.ts` deep-merges over the English base), so
a partly finished file is safe to ship.

The language is stored in a cookie and, for signed-in users, on their `User`
record, so it follows them to a new device. URLs stay clean — there is no
`/fil/...` prefix.

---

## Tests

```bash
npm test        # money maths — no database needed
npm run test:db # job integrity + security policy — needs DATABASE_URL
npm run test:all
npm run typecheck
```

`npm test` covers `lib/calc.ts`: rounding, the status rule, float drift, and
negative input. `npm run test:db` proves the client cannot dictate a total, and
drives the real lockout/audit code against a live database.

### Continuous integration

`.github/workflows/autocare-ci.yml` runs on every push to `main` and every pull
request that touches `autocare/**`. It spins up a throwaway PostgreSQL service
container and runs the whole sequence for real — lint, type-check, unit tests,
`prisma migrate deploy`, seed, the database-backed tests, and the production
build. Nothing is mocked or skipped.

The workflow ignores changes to the other projects in this repository, and its
`DATABASE_URL` / `AUTH_SECRET` are throwaway values scoped to the runner.

### Regenerating the bootstrap SQL

`prisma/bootstrap.sql` is generated, not hand-written. After adding a migration
or changing the seed, regenerate it so the two stay in step:

```bash
npx tsx scripts/make-bootstrap-sql.ts
```

It embeds every migration in `prisma/migrations/`, computes each one's SHA-256
checksum for the `_prisma_migrations` bookkeeping table, and hashes the admin
passwords with bcrypt at cost 12 — the plaintext is never written to the file.

### Dependency overrides

`package.json` pins two transitive dependencies via `overrides`:

| Package | Why |
| --- | --- |
| `sharp` → 0.35.3 | Next ships an older `sharp` for image optimization, which carries libvips CVEs. This app uses no images at all, but the override clears the advisory without a Next major bump. |
| `postcss` → 8.5.25 | Next pins `postcss@8.4.31` internally, which has path-traversal and XSS advisories. 8.5.25 is the same major and is already what Tailwind and autoprefixer use here. |

Both are same-major bumps. Re-check them when upgrading Next — if a later
release ships patched versions itself, the overrides can be dropped.
`npm audit` currently reports zero vulnerabilities.

---

## Project layout

```
app/
  (auth)/login/          login page + its server action
  (app)/                 the signed-in shell (top bar, nav, footer)
    dashboard/           home screen
    jobs/                list, new (wizard), [id] detail, edit, print
    customers/ vehicles/ services/ reports/ users/ settings/ audit/
  policy/                Acceptable Use Policy + first-login gate
  api/
    auth/[...nextauth]/  Auth.js endpoints
    jobs/[id]/receipt/   PDF receipt
    export/              CSV / JSON backup
components/
  ui/                    buttons, inputs, dialogs — all 64px+ tap targets
  wizard/                the New Job wizard and its steps
  forms/  receipt/  app-shell/
lib/
  calc.ts                the money engine (the important one)
  validation.ts          every Zod schema
  session.ts  rbac.ts    authorization
  auth-logic.ts          login rules, lockout
  audit.ts  prisma.ts  settings.ts  jobs.ts  password.ts  rate-limit.ts
  pdf/receipt-pdf.tsx    the A4 PDF
messages/                fil, en, es, ja, ko, zh
i18n/                    locale registry + next-intl request config
prisma/                  schema, migrations, seed
tests/
```

### Elderly-first UI rules, and where they are enforced

- Body text 18px, money 24px bold, the grand total 36px — `tailwind.config.ts`
  (`text-base`, `text-money`, `text-total`).
- Every interactive element at least 64px tall — the `min-h-tap` token; the
  `Button` component has no icon-only variant, so buttons always carry a label.
- WCAG AA contrast — the colour tokens at the top of `app/globals.css`, with
  the measured ratios written next to them.
- Confirmation before every delete — `components/ui/confirm-dialog.tsx`, which
  offers two full-width buttons reading "Yes, delete it" / "No, keep it".

---

## For the owner

A short guide in plain Filipino: **[GABAY-PARA-SA-MAY-ARI.md](GABAY-PARA-SA-MAY-ARI.md)**
