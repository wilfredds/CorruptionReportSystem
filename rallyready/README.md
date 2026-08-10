# RallyReady

Self-directed at-home badminton training for a solo player with no coach and no
partner. Guided footwork drills, conditioning, progression tracking, structured
programs and a vetted library — in one place, instead of scattered across
YouTube tabs.

**Phases 1 and 2 are complete and usable** — the guided drill trainer, accounts,
progress tracking and the fitness benchmark. Phases 3–5 (conditioning,
multi-week programs, and the vetted video library) are scaffolded and stated in
the app, not yet built. See `PROGRESS.md`.

---

## What makes it different

- **Audio-first.** Every corner call is spoken, carries a distinct tone, and
  buzzes the phone. You can complete a whole session without once looking at
  the screen — which is the point, because you cannot watch a screen and move
  to a corner at the same time.
- **Solo-native.** The app *is* the random caller. No partner, no feeder, no
  court required.
- **Split-step training.** An optional metronome tick fires a configurable
  0.2–0.7s before each call, so you learn to land the split-step as the call
  arrives. This is the single most common club-player fault.
- **Real deception.** A fake call, then the real one, forcing a second
  split-step. The fake sounds *identical* to a real call — a fake you can hear
  coming would train nothing.
- **Offline.** Installable as a PWA. The timer, the drills and the coaching
  notes all work with no connection at all, and sessions still log.
- **Real progression.** Sessions log themselves. The dashboard shows a weekly
  streak, training load, whether your pace is actually improving, personal
  bests per drill, and a trophy case — all derived from what you logged, none
  of it paywalled.
- **A number to chase.** A repeatable B-ENDURANCE-style benchmark: twelve
  levels of four-corner movement, work stepping 18s → 30s against a fixed 10s
  recovery. You go until you cannot hold the pace, and the score is charted
  over time.

---

## Setup

### Run it locally (no account, no backend)

```bash
npm install
npm run dev
```

That is genuinely all you need. With no Supabase configured the app stores
everything in local storage and every Phase 1 feature works.

### Optional: connect Supabase for accounts and sync

Accounts are entirely optional — the app never blocks on one. Connect Supabase
and you additionally get sign-in and cross-device sync; anything you logged
signed-out is uploaded to the account the first time you sign in.

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Run the schema.** Open your project → **SQL Editor** → **New query**,
   paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and
   **Run**. It is idempotent — re-running it is safe and will not drop data.
   It creates every table, turns on Row-Level Security with per-user policies,
   and seeds the drill catalogue and badge definitions.

   Or, with the CLI:

   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/schema.sql
   ```

3. **Set the environment variables.** Copy the example file and fill it in from
   **Project Settings → API**:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your anon public key>
   ```

   Both are safe in a browser bundle — the anon key only grants what RLS allows.

4. **Enable Google sign-in** (optional): Supabase dashboard →
   **Authentication → Providers → Google**, then add your OAuth client ID and
   secret and set the redirect URL to your app's origin. Email/password works
   with no extra setup.

   > If you leave **Confirm email** switched on (the default), sign-up will ask
   > the user to confirm before their first sign-in. Turn it off under
   > **Authentication → Providers → Email** if you want instant sign-up while
   > developing.

5. ```bash
   npm run dev
   ```

---

## Scripts

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Dev server with HMR                                    |
| `npm run build`     | Typecheck, then production build (incl. service worker)|
| `npm run preview`   | Serve the production build — needed to test the PWA    |
| `npm test`          | Unit tests (Vitest)                                    |
| `npm run lint`      | ESLint                                                 |
| `npm run typecheck` | `tsc --noEmit`                                         |
| `npm run format`    | Prettier                                               |
| `npm run verify`    | typecheck + lint + test + build, in that order         |

Icons are generated, not committed by hand:

```bash
node scripts/generate-icons.mjs
```

> **Testing offline behaviour:** the service worker is disabled in dev on
> purpose. Use `npm run build && npm run preview`, load the page once, then go
> offline.

---

## Architecture

```
src/
  lib/
    timer/        the drill engine — pure, deterministic, unit-tested
    audio/        speech, tones, haptics, wake lock (all feature-detected)
    data/         the repository layer: ports, local adapter, Supabase adapter
    auth/         Supabase auth, wrapped so nothing else touches the client
    supabase/     the one place a Supabase client is constructed
  features/       one folder per domain (train, progress, benchmark, …)
  components/     ui/ holds the shadcn primitives; the rest is app chrome
  store/          Zustand — cue preferences and per-drill setup
```

### The timer engine

The part that has to be correct is the part that is easy to test, so it is
four small pure modules with no React in sight:

| Module         | Responsibility                                                         |
| -------------- | ---------------------------------------------------------------------- |
| `corners.ts`   | The court model for 4/6/8 zones, plus the audio and haptic mapping      |
| `sequencer.ts` | Picks the next zone: sequential, random, weighted, and deception feints |
| `timeline.ts`  | Expands a plan into absolute-timestamped events                         |
| `cursor.ts`    | Pure playback head; `clock.ts` owns pause, resume and seek              |
| `benchmark.ts` | The B-ENDURANCE-style protocol, expressed as a ladder of plan steps     |

A session's whole event timeline is **precomputed against absolute timestamps**
from a seed, rather than accumulated tick by tick. Three things fall out of
that: playback cannot drift, the session can be previewed before it starts, and
the entire engine is assertable in a test without touching a clock. If a
backgrounded tab freezes `requestAnimationFrame` for eight seconds, the cursor
catches up in a single step and suppresses the stale audio rather than dumping
a burst of callouts for moments that have passed.

### The repository layer

Components never touch storage. They call `useRepositories()`, which returns
implementations of the interfaces in `src/lib/data/ports.ts`. Two adapters exist
— local storage and Supabase — and swapping between them is one argument to
`createRepositories()`. An ESLint rule fails the build if anything outside
`src/lib/data/**` imports `@supabase/supabase-js`.

Streaks, dashboard statistics and badge unlocks are all **derived** from the
session history rather than stored as counters, in both adapters. A projection
cannot drift out of sync with reality; a counter can. Badge awarding is
therefore reconciliation, not an event: on every load the derived set is
compared against what is stored and the difference is written, so a badge can
never be missed because the app was closed at the wrong moment.

Streaks are counted in **weeks, not days** — missing a Tuesday should not wipe
out two months of consistent training.

### Design system

Live documentation at [`/design-system`](http://localhost:5173/design-system):
tokens, type scale, and every component rendered for real rather than pictured.

One accent (volt) on a neutral graphite base, and a colour per drill phase so
the state of a session is readable from across a room. Full dark mode, defaulting
to your OS setting and remembering an explicit choice. Inter is self-hosted, so
an installed PWA makes no network requests at all.

---

## Notable decisions

- **Everything degrades.** Speech synthesis, Web Audio, vibration and Wake Lock
  are each feature-detected; the cue settings sheet shows unsupported ones
  disabled with the reason rather than offering a switch that does nothing.
- **Audio is created on the Start tap, never at page load** — building an
  AudioContext earlier would interrupt whatever the user is listening to for no
  reason. Music and podcasts keep playing.
- **Speech cancels before every call.** At a 0.8s interval an utterance can
  outlast its slot, and `speechSynthesis` queues rather than interrupts; left
  alone the voice ends up calling corners from ten seconds ago.
- **Skipping a round does not count as completing it,** and the average shot
  interval only measures gaps between calls *within the same block* — spanning
  a rest would report the length of the break instead of the pace of the drill.
- **Three columns were added to `drills`** beyond the original data model
  (`default_interval_ms`, `default_call_mode`, `enabled_corners`, and the
  warm-up/cool-down/level fields). Without them a seeded drill cannot express
  "net corners only, slower interval, deception on", and those settings would
  have to be hard-coded in the client instead of living with the drill.
- **Accounts are never required.** Signing in adds sync and nothing else; the
  sign-in screen says so, and with no Supabase project attached the app states
  that plainly rather than offering a button that cannot work.
- **The benchmark runner has no Skip button.** Skipping a level would
  invalidate the score, so the only way out is to stop — and stopping *is* the
  measurement.

---

## Licence

Unlicensed private project.
