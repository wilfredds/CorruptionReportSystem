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
```

## Milestone status

| # | Milestone | State |
| --- | --- | --- |
| 1 | Scaffold, design tokens, public site | **Done** |
| 2 | Supabase tables, RLS policies | Not started |
| 3 | `/api/reservations` — server validation + rate limit | Not started |
| 4 | Supabase Auth login at `/portal` | Placeholder page only |
| 5 | `/portal/dashboard` with role-aware controls | Not started |
| 6 | Honeypot/Turnstile, per-role testing | Honeypot done |
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
by anyone with dev tools. The API route (milestone 3) imports the *same schema*
and re-runs it on the server, and that run is the one that protects the
database. Sharing the definition is what stops the two drifting apart.

**Honeypot field** — a hidden input a real guest never sees, that bots fill in.
It is already in the form and already in the schema.

**Timezone-correct date handling** — "is this date in the past?" is answered in
`Asia/Manila`, not in the server's UTC. Otherwise a 9pm booking made in Manila
gets rejected as yesterday's.

**No secrets in the bundle** — see `.env.example`. The service-role key bypasses
Row Level Security completely and must never carry a `NEXT_PUBLIC_` prefix.

### Still to come

Row Level Security (milestone 2) is the piece that makes the rest real: it is
Postgres refusing a customer's read of the reservations table before any of our
code runs. Rate limiting on the reservation and login endpoints, and per-role
testing, land in milestones 3 and 6.

## Layout

```
src/
  app/
    layout.tsx        fonts, metadata, JSON-LD, reads the CSP nonce
    page.tsx          the public landing page
    portal/page.tsx   placeholder — real sign-in in milestone 4
    globals.css       design tokens (Tailwind v4 @theme)
  components/         one file per section of the landing page
  lib/
    restaurant.ts     business details + Schema.org markup   ⚠️ placeholders
    menu.ts           packages, à la carte, house rules      ⚠️ placeholders
    reservation.ts    the shared Zod schema
    format.ts         peso formatting
  proxy.ts            per-request CSP nonce
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
