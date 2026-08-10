# RallyReady — progress

Running log of what is built, what is next, and the judgement calls made along
the way.

---

## Status

| Phase                                    | State                         |
| ---------------------------------------- | ----------------------------- |
| 0 — Scaffold, design system, data layer  | ✅ Done                        |
| 1 — Guided drill trainer                 | ✅ Done                        |
| 2 — Accounts, progress, benchmark        | ✅ Done                        |
| **3 — Stamina & conditioning**           | ✅ **Done — ready for review** |
| 4 — Multi-week programs                  | ⬜ Not started                 |
| 5 — Curated library                      | ⬜ Not started                 |

`npm run verify` is green: 0 type errors, 0 lint errors/warnings, 184 unit
tests passing, production build clean.

---

## Phase 3 — what the brief asked for

> *Badminton-specific HIIT built on real rally:rest ratios; Tabata; multifeed-style
> shadow intervals. Agility-ladder and plyometric circuits with short demo clips
> and coaching cues. On-court and at-home variants. Reuse the Phase-1 timer
> engine; conditioning logs to `sessions` too.*

| Item                             | Status | How                                                                                     |
| -------------------------------- | :----: | ----------------------------------------------------------------------------------------- |
| HIIT on real rally:rest ratios   |   ✅   | Match Rhythm (6/12 × 12, a true 1:2) and Rally HIIT (15/15 × 10, deliberately harder).      |
| Tabata                           |   ✅   | Shipped in Phase 1 as a drill *and* a structure preset on any drill.                        |
| Multifeed shadow intervals       |   ✅   | 10s flat out / 30s recovery × 10 — short efforts so movement quality never degrades.        |
| Agility-ladder circuits          |   ✅   | Four patterns: in-and-out, lateral shuffle, crossover, high knees.                          |
| Plyometric circuits              |   ✅   | Jump squats, split jumps, lateral bounds, tuck jumps, step jumps.                           |
| Demo clips + coaching cues       |   ◑   | Cues and faults in full; demos are drawn schematics rather than video — see below.          |
| On-court and at-home variants    |   ✅   | Every workout is tagged, every exercise lists a no-kit substitute, and Train has a filter.  |
| Reuse the timer engine           |   ✅   | One engine; circuits are ladder steps that name an exercise instead of calling a corner.    |
| Conditioning logs to `sessions`  |   ✅   | Same session row, `source: 'conditioning'`, feeding the same streak and dashboard.          |

### Built

**Circuits in the engine.** A ladder step can now carry an `exerciseSlug`. A
step that does issues no corner calls, and the block records which exercise to
perform. That one addition is the whole of the engine work — the clock, cursor,
countdowns, pause/resume, wake lock and session logging are all untouched and
shared.

**The exercise catalogue.** Eleven exercises with real coaching cues, common
faults, and an explicit substitute for anyone without the kit. Bundled with the
app, so a circuit runs in a garage with no signal.

**Drawn demos.** Ladder work gets an animated footfall diagram; everything else
gets a side-view figure computed from pose parameters — squat depth, height off
the floor, tuck, arm swing, foot split, and lead-leg asymmetry. One renderer
covers every non-ladder exercise, which is what makes a demo affordable for all
of them.

**The circuit board.** In place of the court board: the exercise named large
enough to read from the floor, the looping schematic, and the single cue that
matters most. During a rest it switches to what is coming next, because that is
the only thing worth knowing while you catch your breath. And the voice
announces the exercise by name, so a circuit is as eyes-free as a drill —
"tuck jumps" tells you everything, "go" tells you nothing.

**Train, split.** Drills and Conditioning as tabs, plus a "No court" filter.
Seven of the twelve workouts now need nothing but floor space.

**Generated SQL seed.** The catalogue and the Postgres seed had already drifted
once, so `npm run seed:sql` now derives the SQL from the TypeScript. One source
of truth.

---

## Decisions and their reasons

**Circuits are drills, not a separate entity.** They share the table, the
runner, the session log, the streak and the dashboard. A conditioning workout
differs from a footwork drill in what it asks you to do, not in what it *is* —
modelling it separately would have duplicated all of that for nothing.

**Demos are drawn rather than embedded.** Vetted clips are Phase 5, and made-up
links rot. Rendering the demo means it works offline, matches the theme, and
costs nothing to keep. For ladder patterns — where the pattern, not the effort,
is the hard part — a diagram is arguably clearer than a video you would have to
scrub back and forth.

**The figure holds each keyframe.** Blending continuously between poses looked
like a person swaying: the figure spent all its time between positions and never
actually showed the one being taught. It now sits in each keyframe for 45% of
the slot, then moves.

**A lunge needed asymmetric legs.** Mirroring the two legs rendered every lunge
as a wide stance. Poses now carry a `lead` parameter: front knee stacked over
the ankle, trailing knee dropped towards the floor, torso upright rather than
pitched forward.

**Circuits drop the warm-up, the split-step tick and the sprint set.** All three
are corner-call concepts. A metronome tick before a jump squat is meaningless,
and a "warm-up" of corner calls makes no sense in a room with no court.

**Countdowns are keyed on the phase, not on whether calls are issued.** A
circuit block calls no corners but still needs "3, 2, 1" — otherwise the first
few seconds of every exercise are guesswork.

### Deviations from the brief's data model

`drills` gains four Phase-3 columns: `circuit` (jsonb), `circuit_rounds`,
`location` and `equipment`. The circuit is jsonb rather than a child table
because it is an ordered value object that is always read and written whole and
never queried into — a `circuit_steps` table would buy joins nobody needs.

### Fixed while verifying in a browser

- `sanitizePlan` rebuilt ladder steps and dropped `exerciseSlug`, silently
  turning every circuit back into a corner-calling drill. Caught by a test
  written before the UI existed.
- The runner's status line read "Then · Rest" during a circuit — technically
  true, useless in practice. It now names the next exercise.
- The session summary showed "Calls: 0" and a blank average interval for
  circuits. Those tiles are now dropped and "Rounds" reads "Exercises".
- The figure's head clipped the top of its viewBox at full standing height.
- The pose caption named the keyframe being left rather than the one on screen,
  so "TUCK" was shown over a figure standing on the ground.

### Known limitations

- **Demos are schematic, not filmed.** They convey pattern and shape well and
  tempo poorly. Phase 5 adds vetted clips alongside them, not instead of them.
- **Circuits are not editable per step.** You can change the number of rounds
  and the cool-down, but not swap an exercise or retime an individual block.
  Custom circuits belong with the user-authored content in Phase 4.
- **The Supabase path is still unexercised against a live project** — no
  instance to point at here. Fully typed against the schema; the local backend
  is exercised end to end.
- **`equipment` is free text.** Fine for the seeded catalogue, too loose for
  filtering once users author their own workouts.

---

## Next: Phase 4 — structured multi-week programs

1. Periodised 8–12 week returning-player programs: Base → Build → Sharpen →
   Deload, 3–5 sessions a week mixing footwork, conditioning and rest days.
2. Enrolment tracking current week and day; "Today's session" on the home
   screen.
3. Volume adapted to level and court access — the `location` tag added in this
   phase is what makes an anywhere-only program possible.
4. Users authoring and publishing their own programs (`is_public`), which is
   also where per-step circuit editing belongs.

The `programs`, `program_days` and `program_enrollments` tables and their RLS
policies have been in the schema since Phase 0, so this is app work only.
