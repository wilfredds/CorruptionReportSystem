# Hiroshi Master Grill Samgyupsal

Reservation web app for an unli samgyupsal restaurant in General Trias, Cavite.
Built to the plan in `hiroshi-build-spec.md`.

Two faces, one codebase:

- **Public site** — branding, unli sets, rice & ramen menu, house rules,
  location, and a reservation request form. No login.
- **Staff portal** — login required, role-aware dashboard for crew, host and
  owner. _(Milestones 4–5, not built yet.)_

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 (configured in CSS, not a JS config file) |
| Validation | Zod — one schema shared by the browser form and the server |
| Backend / auth | Supabase (Postgres + Auth + Row Level Security) — milestone 2 |
| Hosting | Vercel |

## Running it

```bash
npm install
cp .env.example .env.local     # then fill it in
npm run dev                    # http://localhost:3000
```

```bash
npm run build && npm run start # production build
npm run lint
npm test                       # endpoint tests — no server, no database needed
npm run db:test                # apply the schema to a scratch DB, test the policies
```

Database setup — creating the Supabase project, the environment variables, and
the staff accounts — is in [`supabase/README.md`](supabase/README.md).

## Milestone status

| # | Milestone | State |
| --- | --- | --- |
| 1 | Scaffold, design tokens, public site | **Done** |
| 2 | Supabase tables, RLS policies | **Done** — 37 policy tests pass |
| 3 | `/api/reservations` — server validation + rate limit | **Done** — 29 endpoint tests |
| 4 | Supabase Auth login at `/portal` | Placeholder page only |
| 5 | `/portal/dashboard` with role-aware controls | Not started |
| 6 | Honeypot/Turnstile, per-role testing | Honeypot wired; Turnstile pending |
| 7 | SEO + deploy | Metadata & JSON-LD done |

## ⚠️ Before this goes public

Every business detail on the site is a **placeholder**, sitting in two files so
it can be corrected in one place:

- `src/lib/restaurant.ts` — address, phone, hours, map coordinates
- `src/lib/menu.ts` — packages, prices, à la carte items, house rules

The address, phone number and hours are also fed to Google as structured data.
Publishing wrong ones there is worse than publishing none.

## What is already secure, and why

Security was not left to the end — the foundational pieces are in the scaffold.

**Security headers** (`next.config.ts`) — HSTS so the browser refuses plain
http after the first visit; `X-Frame-Options: DENY` so the staff portal cannot
be iframed and clickjacked; `nosniff`; a locked-down `Permissions-Policy`.

**Content-Security-Policy with a per-request nonce** (`src/proxy.ts`) — the
interesting one. A static `script-src 'self'` looks strict but breaks the App
Router, because Next boots React from inline `<script>` tags; the browser
blocks them, hydration never runs, and the reservation form becomes dead HTML.
This project hit exactly that and the screenshots proved it. The tempting fix,
`'unsafe-inline'`, throws away the main thing a CSP does. The real fix is a
nonce: a fresh random token per response, stamped on the scripts we trust.
Injected script tags cannot guess it.

The cost is stated honestly in that file — a nonce is per-response, so pages
using one render per request instead of being served from a build-time cache.

**One validation schema, run twice** (`src/lib/reservation.ts`) — the browser
runs it for friendly errors as the guest types. That is UX and can be bypassed
by anyone with dev tools. `/api/reservations` imports the *same schema* and
re-runs it on the request it actually received, and that run is the one that
protects the database. The endpoint then stores the schema's **output**, not the
body it was sent — trimmed, coerced, unknown keys dropped. Handing the raw body
onward after validating it is a quietly common way to undo the validation you
just did.

**Honeypot field** — a hidden input a real guest never sees, that bots fill in.
A filled honeypot gets the same cheerful `201` a real booking gets, and is
silently dropped without touching the database. Telling a bot it was caught
teaches whoever wrote it to stop filling the field; success teaches them
nothing.

**Rate limiting in Postgres** (`check_rate_limit` in `schema.sql`) — not in a
JavaScript variable, because on Vercel each serverless instance has its own
memory and a bot that trips an in-memory limit just lands on a fresh instance.
An in-memory limiter on serverless is a limiter that does not limit. The counter
is one atomic `INSERT … ON CONFLICT DO UPDATE`; the naive read-then-write races
under exactly the burst it exists to stop. Verified with 30 concurrent
connections against a limit of 10 — exactly 10 got through.

**IPs are salted and hashed, never stored** — the limiter only needs to know
"same caller as before?", and a hash answers that while leaving the database
holding no record of who visited. Unsalted would be pointless: there are only
four billion IPv4 addresses, so a plain SHA-256 is reversible in seconds.

**Trusting the right header** — `x-forwarded-for` is client-supplied and can say
anything. Taking its leftmost value blindly lets an attacker use a fresh fake
address per request and never hit the cap. On Vercel, `x-vercel-forwarded-for`
is set by the platform, so that is what we prefer.

**Errors that say nothing useful to an attacker** — a failed insert returns one
sentence; the real error, full of table and constraint names, goes to the server
log. The endpoint also refuses non-JSON content types, caps the body at 8 KB
before parsing, and checks the real size rather than the `content-length` the
caller claims.

**Timezone-correct date handling** — "is this date in the past?" is answered in
`Asia/Manila`, not in the server's UTC. Otherwise a 9pm booking made in Manila
gets rejected as yesterday's.

**No secrets in the bundle** — see `.env.example`. The service-role key bypasses
Row Level Security completely and must never carry a `NEXT_PUBLIC_` prefix.

**Row Level Security** (`supabase/schema.sql`) — the piece that makes the rest
real. Every table denies by default, so what a role can do is exactly what a
policy says and nothing else. A customer with the public key and dev tools open
still cannot read one reservation, because the database refuses before any of
our code runs.

Three gaps in the spec's own policies are fixed there and marked ✱: the public
insert was unbounded enough to let anyone file a pre-confirmed booking; crew had
no UPDATE policy at all and so could not do the one job crew exists for; and
phone-number masking moved from React into a SQL view, because a UI mask lasts
only until someone opens the network tab.

**Tested, not asserted** — two suites, both offline and both fast.
`npm run db:test` builds a scratch database, applies the real schema and runs 43
assertions covering the spec's §9 checklist, impersonating each role the way a
real request does. `npm test` drives the reservation endpoint through 29 cases,
most of which check that something did *not* happen — the honeypot request never
reached the database, the oversized body was never parsed, the pre-confirmed
payload never got through. Those are the paths clicking around never exercises,
which is why they are the ones that rot.

Both suites have caught real bugs in this project, listed in the commit
messages.

**No self-service roles** — there is no insert policy on `profiles`, so no
request from any browser with any key creates a host or an owner. Accounts are
made with `npm run staff:create`, which is the one deliberate, human-run use of
the service key.

### Still to come

Sign-in and its own (stricter, fail-closed) rate limit land in milestone 4;
Turnstile in milestone 6.

## Layout

```
src/
  app/
    layout.tsx        fonts, metadata, JSON-LD, reads the CSP nonce
    page.tsx          the public landing page
    api/reservations/route.ts   POST — a thin adapter over handler.ts
    portal/page.tsx   placeholder — real sign-in in milestone 4
    globals.css       design tokens (Tailwind v4 @theme)
  components/         one file per section of the landing page
  lib/
    restaurant.ts     business details + Schema.org markup   ⚠️ placeholders
    menu.ts           packages, à la carte, house rules      ⚠️ placeholders
    reservation.ts    the shared Zod schema
    rate-limit.ts     client IP, salted hashing, the limit check
    reservations/
      handler.ts      the endpoint's logic, with side effects injected
      insert.ts       the write — anon key, so RLS still judges it
    format.ts         peso formatting
    supabase/
      env.ts          reads the keys; the dangerous one throws in the browser
      client.ts       browser client (anon key, subject to RLS)
      server.ts       server client, plus the RLS-bypassing admin client
      types.ts        database types
  proxy.ts            per-request CSP nonce
supabase/
  schema.sql          tables, policies, triggers, the masked staff view
  verify-rls.sql      37 policy tests
  local/              Supabase shim so the tests run without a project
tests/
  reservation-handler.test.ts   npm test
scripts/
  create-staff.mjs    the only way an account gets a role
  db-test.sh          npm run db:test
```

## Design tokens

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#FBF6EF` | page ground |
| `lacquer` | `#B01E24` | brand accent, buttons, prices |
| `sumi` | `#17130F` | body text, dark panels |
| `gold` | `#C9A24B` | decoration, and text **on sumi only** |

Gold on paper is roughly 2.2:1 contrast — well under the 4.5:1 that WCAG AA
wants for body text. So gold is used for hairlines and dividers on light
backgrounds, and only becomes text on the dark sumi panels, where it reaches
7.4:1.

Fonts are Fraunces (display) and Hanken Grotesk (body), self-hosted by
`next/font` at build time. No visitor's browser ever calls Google Fonts, which
means no third party gets a log of who visits, and `font-src 'self'` can stay
strict.
