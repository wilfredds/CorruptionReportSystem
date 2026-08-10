# RallyReady — progress

Running log of what is built, what is next, and the judgement calls made along
the way.

---

## Status

| Phase                                   | State                          |
| --------------------------------------- | ------------------------------ |
| 0 — Scaffold, design system, data layer | ✅ Done                         |
| **1 — Guided drill trainer**            | ✅ **Done — ready for review**  |
| 2 — Accounts, progress, benchmark       | ⬜ Not started                  |
| 3 — Stamina & conditioning              | ⬜ Not started                  |
| 4 — Multi-week programs                 | ⬜ Not started                  |
| 5 — Curated library                     | ⬜ Not started                  |

`npm run verify` is green: 0 type errors, 0 lint errors/warnings, 98 unit tests
passing, production build clean.

---

## Phase 1 — acceptance criteria

> *A user can start a footwork session in ≤2 taps from home, complete it
> entirely by ear without looking at the screen, and see it logged afterward.
> Audio, tone, and haptics all fire on each call. Works installed as a PWA
> offline.*

| Criterion                        | Status | How                                                                                                                |
| -------------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------ |
| Start in ≤2 taps                 |   ✅   | Home → **Start** on a drill card (1) → **Start drill** (2). The second tap is required: browsers only unlock audio inside a user gesture. |
| Completable by ear               |   ✅   | Speech + tone + haptics on every call; 3-2-1 countdown into each work block; spoken phase changes.                   |
| Audio, tone, haptics on each call|   ✅   | `src/lib/audio/cues.ts` fans one timeline event out to all three channels.                                            |
| Session logged afterwards        |   ✅   | Auto-creates a session row on finish, then routes to a permalinked summary; streak updates.                          |
| Works offline as a PWA           |   ✅   | Verified in a real browser: SW registered, went fully offline, deep-linked into a drill, ran it, logged the session.  |

### Built

**The court board.** Real half-court proportions (5.18m × 6.70m). 4, 6 or 8
zones, optional numbering. The live target lights up with a countdown pip that
drains as its slot runs out, and a base marker travels out to the corner and
back to reinforce recovery. Legible across a room; scales from a 375px phone to
a 1280px desktop, and lays the dial and board side by side in landscape.

**The dial.** Seconds left in the current interval as the largest element on
screen, ringed by a thin overall-progress arc. A colour per phase — volt for
work, cool blue for rest, amber for sprint — washed behind the whole screen.

**Cueing.** Speech via `speechSynthesis`; a Web Audio tone whose *pitch* encodes
the row (front high, back low) and whose *stereo position* encodes the side, so
the tone alone is enough after a couple of rounds; a distinct vibration pattern
per row. Configurable split-step tick 200–700ms ahead of each call. Wake Lock
so the phone does not sleep mid-drill.

**Modes.** Sequential, Random, Deception, Number and Weighted, plus per-zone
enable/disable, per-zone weighting, no-immediate-repeat, and Beginner → Pro
difficulty presets.

**Structure.** Prepare → warm-up → work/rest rounds → optional sprint set →
cool-down. Structure presets: Match rhythm (6s/12s × 12), Long rally, Classic
shadow (30/30 × 6) and Tabata (20/10 × 8).

**Seven seeded drills** — the five from the brief plus Match Rhythm Intervals
and Tabata Shadow — each with real coaching cues and common faults shown right
on the setup screen, so you never leave to learn the technique.

**Supporting work.** Repository layer with local and Supabase adapters; full
Postgres schema with RLS for every table in the model; `/design-system` route;
bottom nav with the five sections; dark mode; installable PWA.

---

## Decisions and their reasons

**The timeline is precomputed from a seed, not accumulated tick by tick.**
Playback cannot drift, a session can be previewed before it starts, and the
engine is assertable in a test with no clock involved. The cost is that changing
the interval mid-drill would need a rebuild of the remainder — worth it.

**A feint sounds exactly like a real call.** Distinguishable fakes train
nothing: you would learn to ignore them. Only the summary knows the difference.

**Streaks are weekly and derived, not daily and stored.** The brief asks for a
non-punishing cadence; deriving from history means the number can never drift
out of sync with the sessions that produced it.

**Number mode is a display choice, not a selection algorithm.** Internally the
five UI modes decompose into three orthogonal knobs (selection, deception,
announce style). The UI still shows exactly the five the brief lists.

**The warm-up calls at 1.6× the working interval and never feints.** A warm-up
that opens with a deception drill is not a warm-up.

**No rest block after the final round.** Sessions end on work or cool-down.

**Two seeded drills had their default interval nudged by 50ms** (1400→1350,
1600→1650) so they land exactly on a named difficulty preset. Same training
effect, and the setup screen can say "Intermediate" instead of "Custom".

**`videoUrl` is null on every seeded drill.** Curating vetted clips is Phase 5;
inventing links now would just plant dead ones.

### Deviations from the brief's data model

Three additions, all in `drills`, all necessary:

- `default_interval_ms`, `default_call_mode`, `enabled_corners` — without these
  a seeded drill cannot express what §4 asks for ("net corners only", "slower
  interval", "deception on"), and the settings would have to be hard-coded in
  the client instead of living with the drill.
- `default_warmup_sec`, `default_cooldown_sec`, `level` — session structure and
  card metadata.
- `sessions.drill_name` is denormalised: a training log should record what you
  actually did, even after a drill is renamed, deleted, or was a custom setup
  with no `drill_id` at all.

### Known limitations

- **iOS backgrounding.** Wake Lock keeps the screen on, but if the user
  switches apps, iOS suspends `speechSynthesis`. Nothing a web app can do; the
  drill catches up correctly on return and suppresses the stale callouts.
- **Web Audio and other apps.** Short beeps mix with background audio on
  Android and desktop. iOS may duck it — the browser gives no control over the
  audio session category.
- **The Supabase adapter is written but not yet exercised**, because Phase 1
  ships without sign-in, so `createRepositories()` always resolves to the local
  backend. It is fully typed against the schema and switches on with one
  argument the moment auth lands.
- **Local sessions do not migrate to an account yet.** Phase 2 will resolve
  drill slugs to uuids and upload the backlog.
- **One JS bundle, ~170KB gzipped.** Fine for now; route-level code splitting
  is the obvious first move if it grows.

---

## Next: Phase 2

1. Supabase auth — email/password and Google — and flip `DataProvider` to pass
   a real `userId`.
2. Migrate local sessions into the account on first sign-in.
3. Two-minute onboarding: skill level, discipline, goal → straight into a
   recommended drill → day-one badge.
4. Progress dashboard: streak calendar, sessions per week, personal bests,
   Recharts trends, trophy case.
5. The B-ENDURANCE-style benchmark: 4-corner sequences stepping 18s→30s with
   ~10s recovery, recording the level reached, charted over time.

Phase 2 needs no new engine work — the benchmark is a `DrillPlan` with a
stepped structure, and conditioning in Phase 3 reuses the same timer.
