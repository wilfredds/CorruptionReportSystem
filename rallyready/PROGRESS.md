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
| 4 — Multi-week programs                 | ✅ Done                        |
| **5 — Curated library**                 | ✅ **Done — ready for review** |

All five phases are built. `npm run verify` is green: 0 type errors, 0 lint
errors/warnings, 249 unit tests passing, production build clean.

Earlier phases, one line each — the detail is in the git history:

- **1** — the timer engine, court board, audio-first cue layer and offline PWA.
- **2** — Supabase auth with local-to-account migration, the derived progress
  dashboard, and the B-ENDURANCE-style benchmark.
- **3** — conditioning circuits on the same engine, an eleven-exercise
  catalogue, and drawn demos.
- **4** — the periodiser, four built-in programs, and today's session on Train.

---

## After the brief — from testing on a real phone

The first person to actually train with this asked for a warm-up, and was
right: the app explained warming up in the Library and gave you no way to do
one, which is the wrong way round for the only advice in here that prevents an
injury rather than improving a shot.

**A guided warm-up and cool-down.** Three routines — Full (6:25), Quick (3 min)
and a five-minute cool-down — built as circuits on the existing engine, so no
timer work at all. RAMP structure: raise the heart rate, mobilise the joints
badminton punishes in the order it loads them, then two minutes of sharp
court-specific movement. Seventeen new movements across two new exercise kinds.

Every step rests for zero seconds, because the timeline already drops
zero-length rests — a warm-up flows from one movement to the next instead of
stopping to cool you down between them.

**Warm-ups do not log a session.** Logging them would let someone hold a streak
by stretching, and drag the training load and pace charts towards work that was
deliberately easy. The app remembers only _that_ you warmed up, so the prompt
can get out of the way for 45 minutes and then come back.

**Export and import.** Local storage is scoped to one origin in one browser —
we watched a domain change make a whole history unreachable during this build.
One JSON file holds every session, its metrics and every benchmark. Importing
merges rather than replaces, de-duplicating on when a session started rather
than on its id, because ids are assigned by whichever device stored the row and
never match across a backup. Importing the same file twice is a no-op.

**A share card.** The session drawn onto a 1080×1350 canvas in the app's own
palette, handed to `navigator.share` so it reaches Messenger, Facebook and
Instagram through the OS share sheet — no per-platform SDKs, no API keys, and it
works from an installed PWA. Where no share sheet exists it downloads the image
instead, so the button is never a dead end.

### Deliberately not built

- **Push reminders.** iOS only delivers them to an installed PWA, they are
  unreliable across platforms, and a daily nag is very easy to get wrong. A
  training app that annoys you is one you delete.
- **User-authored custom drills.** A large surface for something with little
  daily value next to the twelve that ship.

---

## Phase 5 — what the brief asked for

> _A curated, vetted library of drills and short reference clips from reputable
> coaches and federations. Filter by category, level, solo or partner, court or
> home, and duration. Coaching cues, common faults and recommended reps on every
> entry. One tap to start any entry as a timed drill, pre-configured._

| Item                                 | Status | How                                                                               |
| ------------------------------------ | :----: | --------------------------------------------------------------------------------- |
| One browsable reference              |   ✅   | 33 entries: 10 technique topics, 12 drills, 11 exercises, in one filterable list. |
| Filter by category                   |   ✅   | Only categories that exist are offered, derived from the entries themselves.      |
| Filter by level                      |   ✅   | Beginner / Intermediate / Advanced.                                               |
| Filter by solo or partner            |   ✅   | Everything trains solo except the two topics that honestly need a feeder.         |
| Filter by court or home              |   ✅   | Same `location` tag the drills and programs already use.                          |
| Filter by duration                   |   ✅   | Under 10 / 10–20 / over 20 minutes — run time for a drill, read time for a topic. |
| Cues, faults, recommended reps       |   ✅   | On every entry. Reps were added to the exercise catalogue, where they belong.     |
| One tap to start, pre-configured     |   ✅   | Every drill, and every topic that has a drill training it.                        |
| Short clips from coaches/federations |   ⬜   | Not shipped. The field exists and renders; nothing goes in it. See below.         |

### Built

**One list over three catalogues.** `src/lib/library/entries.ts` derives a
single `LibraryEntry` list from the drills, the exercises and the new technique
topics. Derived rather than copied: a cue fixed on a drill is fixed in the
library on the next render, and the two can never disagree. Pure, so the
filtering is unit-tested (21 tests) and the whole library works offline.

**Ten technique topics.** The split step, base and recovery, chassé versus
crossover, the net lunge, the scissor jump, grips, net play, deception, warming
up and the injuries to avoid, and how to train solo without wasting the time.
Each explains one thing a solo player can act on, names the faults that make it
go wrong, and links to the drills that train it.

**Search that reads the cues.** Searching "knee" finds the net-lunge topic,
whose title does not contain the word but whose cues do. Every word in the query
has to match, so adding a word narrows rather than widens.

**Integrated learning, both directions.** A drill's setup screen now links to
the technique behind it — three topics and a link to the rest — and every
technique topic has a Drill it button that starts the matching drill.

### The one thing not shipped, and why

The brief asks for short reference clips from reputable coaches and federations.
That means vouching for each link: that it resolves, that the channel is who it
claims to be, and that the coaching is sound. From this environment none of that
can be checked — outbound access to YouTube, the BWF, the national federations
and even Wikipedia is blocked by the egress proxy, so a curated list would be a
list of guesses formatted to look vetted. That is worse than none.

So the reference is written instead of linked, and it is the app's own: ten
topics with the same cues-and-faults structure as everything else. The seam for
clips is real rather than hypothetical — `ExternalReference` on a topic and
`videoUrl` on a drill, both rendered with attribution the moment either is
filled in, and a test asserting that nothing currently is. A curator with
network access can populate it without touching a component.

---

## Decisions and their reasons

**Entries are namespaced by kind, not by slug.** `rear-court-scissor` is both a
drill and a technique topic, and would have silently shadowed itself. Ids are
`kind/slug` and the route is `/library/:kind/:slug`, which is also a more
readable URL than a synthetic composite would have been.

**Technique sorts above drills.** The library exists so you can learn the thing
before drilling it; a list that opens with twelve drills buries the teaching
under the training.

**Recommended reps live with the exercise, not the library.** Adding a field to
eleven exercise records is more code than a lookup table in the library module,
and it is the right home: the exercise knows how much of itself to do.

**An exercise is not runnable on its own.** Tuck jumps are a component of a
circuit, not a session, so an exercise entry has cues, a demo and reps but no
Start button. The circuit that contains it is one tap away instead.

**The duration filter measures reading too.** "How long will this take me" is a
fair question about an article as well as a drill, so a topic's reading time
goes through the same buckets rather than being exempt from them.

### Deviations from the brief's data model

None. The library needs no table: it is derived from content already bundled
with the app, and technique topics are reference material like the exercises,
not user data. `drills.video_url` has been in the schema since Phase 0 and is
where a vetted clip would go.

### Fixed while verifying in a browser

- A ladder diagram on a 360px screen filled the entire viewport — the demo is
  1.5× as tall as it is wide and nothing capped its height. It is boxed now.
- The drill setup screen listed six technique topics, because half the
  catalogue touches a four-corner drill somehow. Three, plus a link to the rest.
- Durations read "4 mins" in the library and "4 min" everywhere else.

### Known limitations

- **No vetted clips.** Explained above. Everything else in the library is
  written, drawn or derived, and works offline.
- **The technique topics are text and diagrams.** They convey the what and the
  why well; timing and touch are the parts that genuinely want video.
- **Search is substring matching, not a real index.** Correct and instant across
  33 entries; it would want stemming and ranking at ten times the size.
- **The Supabase path is still unexercised against a live project** — no
  instance to point at here. Fully typed against the schema; the local backend
  is exercised end to end.

---

## Where this could go next

Nothing in the brief remains. If it were carried on:

1. **Vet and add the clips** from an environment with network access — the seam
   is built and tested.
2. **Session-linked notes**, so a player can record what actually went wrong in
   a session against the fault it matches.
3. **Exercise-level circuit authoring**, the one thing Phase 3 deferred and
   Phase 4 did not pick up: swapping a single exercise inside a circuit.
4. **Real device testing.** Everything has been verified in Chromium at phone
   and desktop widths, but wake lock, vibration and speech behave differently on
   actual iOS and Android hardware.
