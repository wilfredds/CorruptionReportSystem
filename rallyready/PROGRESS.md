# RallyReady — progress

Running log of what is built, what is next, and the judgement calls made along
the way.

---

## Status

| Phase                                   | State                          |
| --------------------------------------- | ------------------------------ |
| 0 — Scaffold, design system, data layer | ✅ Done                        |
| 1 — Guided drill trainer                | ✅ Done                        |
| 2 — Accounts, progress, benchmark       | ✅ Done                        |
| 3 — Stamina & conditioning              | ✅ Done                        |
| **4 — Multi-week programs**             | ✅ **Done — ready for review** |
| 5 — Curated library                     | ⬜ Not started                 |

`npm run verify` is green: 0 type errors, 0 lint errors/warnings, 205 unit
tests passing, production build clean.

---

## Phase 4 — what the brief asked for

> _8–12 week returning-player programs: Base → Build → Sharpen → Deload. 3–5
> sessions a week mixing footwork, conditioning and rest. Enrolment tracking the
> current week and day, with "today's session" surfaced on the home screen.
> Volume adapted to level and court access. Users can publish their own._

| Item                              | Status | How                                                                                     |
| --------------------------------- | :----: | --------------------------------------------------------------------------------------- |
| Periodised 8–12 week programs     |   ✅   | 4–16 weeks supported; deload every fourth week plus a taper, then base/build/sharpen.   |
| 3–5 sessions a week               |   ✅   | 2–6, spread across fixed weekdays; deload weeks train one session fewer.                |
| Footwork, conditioning, rest      |   ✅   | Each phase has its own week pattern, including genuine rest days and match play.        |
| Enrolment tracks week and day     |   ✅   | One active enrolment; advance, jump to any day, leave, and a completion state.          |
| Today's session on the home screen |   ✅   | First card on Train: the day, its drill, one tap to run it, and progress through plan.  |
| Adapted to level and court access |   ✅   | Beginners skip reaction work; an anywhere program never names a court drill.            |
| Publish your own                  |   ✅   | Builder with a live phase preview; publish/unpublish; built-ins are read-only.          |

### Built

**A periodiser, not a calendar editor.** `src/lib/programs/periodise.ts` turns
four numbers — weeks, sessions a week, level, location — into a full plan. Every
fourth week is a deload and so is the last; the loading weeks left over split
base → build → sharpen, remainder to base. Deterministic, so a published program
looks identical to everyone who follows it, and testable without a UI (19 tests).

Hand-placing 84 days is not a task anyone finishes, and a plan assembled by hand
tends not to periodise at all. So the builder asks for the shape and generates
the rest.

**Intensity is gated by phase.** Each drill pool is ordered easiest first, and a
phase only draws from the part it has earned: base and deload weeks stay in the
gentler half, sharpen weeks in the harder half, build weeks use everything.
Without this, week one of a base block handed a returning player a plyometric
circuit under the heading "Easy conditioning".

**Today, on Train.** The active enrolment's current day is the first card on the
home screen: what today is, which drill it wants, and a single button that
starts it. Rest days get "Rested — next day" instead.

**Ticking a day off from the session summary.** Advancing is deliberate rather
than automatic — a session can be logged from anywhere, and the same summary can
be reopened days later. When the drill you just ran is the one the plan asked
for, the prompt says so; otherwise it offers the day as a choice.

**Four built-in programs.** Return to Court (8wk, beginner, court), Rebuild the
Engine (12wk, club, court), No-Court Comeback (10wk, club, anywhere) and Sharpen
for the Season (8wk, competitive, court) — 266 generated days, all derived from
the same periodiser and written into `schema.sql` by `npm run seed:sql`.

**Court access on the profile.** A fourth onboarding question, and the Programs
list puts plans you can actually train first.

---

## Decisions and their reasons

**Programs are generated, not stored day by day — locally.** The local backend
keeps only the program's shape and any day the user has actually edited, as a
sparse override; the days themselves are generated on read. The Supabase adapter
does the opposite and writes every day out as a row, because a published program
must look the same to every reader, including readers on a future version of the
periodiser.

**Editing the shape rebuilds the plan.** Changing the length or the sessions per
week regenerates the days and discards day-level edits. The alternative —
reconciling hand-edits against a new periodisation — produces a plan that is
neither what the user wrote nor what the periodiser would produce. The builder
says so on the create screen.

**One active enrolment at a time.** Enrolling in a second program pauses the
first rather than running both. Two periodised plans at once is not a training
programme, it is twice the volume with none of the structure.

**Progress is measured in days, not sessions.** A 56-day plan advances ~1.8% per
day, including rest days. Rest days are part of the plan, so skipping them in the
denominator would make the bar lie about how far through you are.

**Drills are referenced by slug, not id.** Slugs are stable across re-seeding and
identical on both backends; a uuid would have to be resolved twice and would
break the generated SQL seed.

### Deviations from the brief's data model

`programs` gains `location` and `sessions_per_week`; `profiles` gains
`court_access`; `program_days.drill_ids uuid[]` became `drill_slugs text[]` for
the reason above. `programs.total_weeks` is constrained to 4–16.

### Fixed while verifying in a browser

- The Today card's primary button read "Start Four-Corner Footwork" and pushed
  the second action off a 414px screen. The drill is named in the card body now
  and the button just says "Start".
- A day row at 360px truncated its title to "Fo…" — two actions were eating the
  width. The actions are icon-only with labels, and the title wraps.
- Ticking a day off showed no confirmation whenever the next day was a rest day,
  because the confirmation was rendered below the guard that hides the prompt on
  rest days.
- Finishing a program was completely silent: the enrolment completed and the
  button quietly reverted to "Start this program". There is a completion banner
  now, and the CTA reads "Start it again".
- Base weeks off court opened with Rally HIIT and a plyometric circuit. See
  intensity gating above.

### Known limitations

- **Days can be retitled but not re-planned.** You can jump to any day and skip
  it, but not swap the drill a specific day asks for. The shape controls are the
  intended lever; per-day authoring is a bigger surface than it is worth here.
- **No calendar dates.** Day 1 is whenever you start, and the plan tracks
  position rather than dates, so a missed week does not leave a hole. The cost is
  that "week 3, day 2" never means a particular Tuesday.
- **Demos are schematic, not filmed.** Phase 5 adds vetted clips alongside them.
- **The Supabase path is still unexercised against a live project** — no instance
  to point at here. Fully typed against the schema; the local backend is
  exercised end to end.

---

## Next: Phase 5 — curated drill and video library

1. Filter by category, level, solo or partner, court or home, and duration.
2. Short reference clips from reputable coaches and federations, vetted rather
   than scraped, with attribution.
3. Coaching cues, common faults and recommended reps on every entry — most of
   this already exists on the drill and exercise records.
4. One tap to start any entry as a timed drill, pre-configured.

The `drills` table already carries `video_url`, cues and faults, so the work is
curation plus a browsing surface rather than new plumbing.
