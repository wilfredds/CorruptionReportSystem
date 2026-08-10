# RallyReady — progress

Running log of what is built, what is next, and the judgement calls made along
the way.

---

## Status

| Phase                                    | State                         |
| ---------------------------------------- | ----------------------------- |
| 0 — Scaffold, design system, data layer  | ✅ Done                        |
| 1 — Guided drill trainer                 | ✅ Done                        |
| **2 — Accounts, progress, benchmark**    | ✅ **Done — ready for review** |
| 3 — Stamina & conditioning               | ⬜ Not started                 |
| 4 — Multi-week programs                  | ⬜ Not started                 |
| 5 — Curated library                      | ⬜ Not started                 |

`npm run verify` is green: 0 type errors, 0 lint errors/warnings, 161 unit
tests passing, production build clean.

---

## Phase 2 — acceptance criteria

> *Sessions auto-log to the user's account; dashboard shows real trends; a user
> can take the benchmark test and see their score history.*

| Criterion                     | Status | How                                                                                                                     |
| ----------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------ |
| Sessions log to the account   |   ✅   | Signing in swaps the repository bundle to Supabase; a signed-out history is uploaded on first sign-in.                     |
| Dashboard shows real trends   |   ✅   | Weekly streak calendar, training-load bars, pace line, personal bests, trophy case — every figure derived from real rows.  |
| Benchmark and score history   |   ✅   | Twelve-level protocol, score charted over time, per-attempt result pages.                                                  |

### Built

**Auth.** Email/password and Google OAuth through Supabase, wrapped so nothing
outside `src/lib/auth` and `src/lib/data` ever touches the client. `unavailable`
is a first-class state: with no Supabase project configured the sign-in screen
explains that plainly instead of offering a button that cannot work, and the
whole app carries on against local storage.

**Migration.** Signing in for the first time uploads the local history —
sessions, their metrics, benchmarks and badges — resolving drill slugs to uuids
on the way through. It runs once per account, and the local copy is deliberately
left in place: it is still the offline fallback, so a failed upload loses
nothing and simply retries next time.

**Onboarding.** Three questions — level, discipline, goal — then straight into
a drill chosen for those answers, with the reason shown so the pick does not
look arbitrary, plus a day-one badge. Available signed-out too; it is a
training profile, not an account feature.

**Progress dashboard.** Weekly streak calendar over twelve weeks, training load
in minutes per week, a pace trend, personal bests per drill, and the trophy
case. Recharts throughout, wired to the same CSS custom properties as the rest
of the app, so switching theme recolours every chart with no React involvement.

**Badges.** Nine achievements across bronze, silver and gold, so a beginner
always has one within reach and a returning competitor still has one to chase.
Locked badges show live progress towards the unlock.

**Benchmark.** Twelve levels of four-corner movement, work stepping 18s → 30s
against a fixed 10s recovery. Score is total corner touches — finer-grained than
the level alone, so two players who both fail in level 7 are still separated by
how far in they got. Charted over time, with each attempt compared against the
one before.

**Engine.** `DrillPlan` gained `ladder`: explicit per-step work/rest/interval
that replaces the uniform main set. The benchmark needs it, and Phase 3's
pyramid and ladder conditioning will too.

---

## Decisions and their reasons

**Everything derived, nothing counted.** Streaks, statistics and badges are all
projections over the session history. Badge awarding is reconciliation rather
than an event: each load compares the derived set against what is stored and
writes the difference. A badge cannot be missed because the app was closed at
the wrong moment, and cannot be awarded twice.

**The shot interval is fixed across the benchmark.** The load rises because the
work grows while the rest does not — 1.8:1 at level 1, 3:1 at level 12. Moving
the interval as well would confound endurance with reaction time, and the test
is meant to measure one thing.

**No warm-up inside the benchmark, and no split-step tick.** A folded-in warm-up
would change the score depending on how tired it left you; the metronome would
pace the athlete through a test of their own pacing.

**The benchmark runner has no Skip.** Skipping a level would invalidate the
score. Stopping is the measurement, and the confirmation dialog says so — "this
is the test, not a failure".

**The pace chart's Y axis is inverted.** Faster is a smaller number, and a chart
where improvement points downwards gets misread every time.

**Weekly streak calendar, two axis labels.** Twelve week-labels collide under
24px cells on a phone, so the calendar shows the first week and "This week" and
puts the rest in tooltips and screen-reader text.

### Deviations from the brief's data model

Beyond the Phase 1 additions to `drills`, Phase 2 adds:

- `profiles.goal` — onboarding asks what the player is training for, and the
  recommendation and (later) program adaptation both need it.
- `sessions.drill_name` (Phase 1) continues to earn its place: benchmark
  sessions have no `drill_id` at all and still need a name in the log.

### Fixed while verifying in a browser

- The Slider's `aria-label` sat on the Radix root, but the *thumb* is what
  carries `role="slider"` — so every slider in the app was anonymous to a
  screen reader. Now forwarded to the thumb.
- The benchmark's rest screen announced the level just finished rather than the
  one coming up.
- The pace chart clipped its own axis labels, and one decimal place collapsed
  distinct sessions onto the same tick.
- The quoted benchmark duration omitted the lead-in; it now comes from one
  helper that the test asserts against the built timeline.

### Known limitations

- **The Supabase path is written and fully typed but has not been run against a
  live project** in this environment — there is no Supabase instance to point
  at. The local backend is exercised end to end. The schema is idempotent and
  the adapter is typed against it, so the first real connection is the
  remaining unknown.
- **Session metrics are fetched whole** for the dashboard (one query, not
  N+1), which is fine at hundreds of sessions and would want pagination at
  tens of thousands.
- **Local sessions upload but do not sync back down.** Sign in on a second
  device and you see the account's history, not that device's local rows; those
  stay put as the offline fallback.
- **iOS backgrounding** still suspends `speechSynthesis` when the user switches
  apps. Unchanged from Phase 1, and not something a web app can fix.

---

## Next: Phase 3 — stamina and conditioning

1. Badminton-specific HIIT on real rally:rest ratios, and Tabata — both already
   expressible as plans; mostly a content and UI job.
2. Multifeed-style shadow intervals, favouring short sharp efforts so movement
   quality holds.
3. Agility-ladder circuits (in-out, lateral shuffle, crossover, high knees) and
   plyometric circuits (jump squats, tuck jumps, box/step jumps), each with
   on-court and at-home variants.
4. These need a non-court "circuit" board — the six-corner map does not describe
   a jump squat. Likely a simple exercise-card view driven by the same timeline.

The `ladder` steps added for the benchmark already cover pyramid and
progressive circuits, so the engine should need no further changes.
