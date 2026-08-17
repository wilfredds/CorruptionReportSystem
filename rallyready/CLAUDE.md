# RallyReady — working notes

Self-directed at-home badminton training for a solo player with no coach and no
partner: guided footwork drills, conditioning, progression tracking, periodised
programs and a reference library.

**Stack:** Vite · React · TypeScript · Supabase · TanStack Query · Zustand ·
React Router · Tailwind · Radix/shadcn · Framer Motion · Recharts · Vitest ·
vite-plugin-pwa

## Node version

**Requires Node 22.22.2 or newer.** `jsdom@30` (engines `^22.22.2 || ^24.15.0
|| >=26.0.0`) and the `undici@8` it pulls in (engines `>=22.19.0`) both demand
it.

On Node 20 the failure is misleading: every vitest worker dies before running a
test with `TypeError: webidl.util.markAsUncloneable is not a function`, and the
summary reads `Test Files no tests` — which looks like a config problem rather
than a version one. `package.json` declares no `engines` field, so nothing warns
you up front.

## Commands

```bash
npm run verify      # typecheck && lint && test && build — run this before claiming done
npm run dev
npm run typecheck   # tsc -b --noEmit
npm run lint        # eslint .
npm run lint:fix
npm test            # vitest run
npm run test:watch
npm run build       # tsc -b && vite build
npm run format
```

`npm run verify` is the single gate. Prefer it over running the four
individually. Baseline is **341 tests across 20 files, all passing** — if you
see fewer, something is being skipped.

## What matters here

- **Audio-first is the point.** Every corner call is spoken, carries a distinct
  tone and buzzes the phone, so a whole session can be completed without
  looking at the screen. Do not introduce a change that only communicates
  visually — you cannot watch a screen and move to a corner simultaneously.
- **Split-step timing is precise.** An optional metronome tick fires a
  configurable 0.2–0.7s *before* each call. Timing code (`lib/timer`,
  `lib/audio`) is latency-sensitive; changes there need tests.
- **The app is the random caller.** No partner, no feeder, no court. Features
  that assume a second person are out of scope.
- **Curated third-party video is deliberately absent.** See the README's
  library section and `PROGRESS.md` for the reasoning before adding it.

## Layout

- `src/features/` — `train`, `progress`, `programs`, `conditioning`,
  `benchmark`, `library`, `auth`, `profile`, `onboarding`, `design-system`
- `src/lib/` — `audio`, `timer`, `programs`, `data`, `supabase`, `auth`,
  `figures`, `library`, `share`, `theme.ts`
- `src/store/` — Zustand state · `src/hooks/` · `src/components/`
- `supabase/schema.sql` — database schema
- `scripts/generate-seed-sql.mjs` — run via `npm run seed:sql`

## Deployment

`vercel.json` configures Vercel. PWA assets come from `vite-plugin-pwa`.

## Gotchas

- `.github/workflows/rallyready-ci.yml` runs `npm run verify` on every push to
  `main` and every PR touching `rallyready/**`. It runs the same single command
  you would, rather than reimplementing the steps, so CI and local cannot drift.
  Still run `verify` locally first — CI is a safety net, not a substitute.
- Supabase credentials come from environment variables; the app expects them at
  build time via Vite's `import.meta.env`.
- `npm install` warns about a deprecated transitive `glob@11.1.0`. Harmless.
