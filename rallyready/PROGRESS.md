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
| 5 — Curated library                     | ✅ Done                        |
| 6 — Load, readiness, why                | ✅ Done                        |
| 7 — Finding your way in                 | ✅ Done                        |
| **8 — Coach, rating, game, premium**    | ✅ **Done — ready for review** |

All eight phases are built. `npm run verify` is green: 0 type errors, 0 lint
errors/warnings, 421 unit tests passing, production build clean.

Earlier phases, one line each — the detail is in the git history:

- **1** — the timer engine, court board, audio-first cue layer and offline PWA.
- **2** — Supabase auth with local-to-account migration, the derived progress
  dashboard, and the B-ENDURANCE-style benchmark.
- **3** — conditioning circuits on the same engine, an eleven-exercise
  catalogue, and drawn demos.
- **4** — the periodiser, four built-in programs, and today's session on Train.
- **5** — the technique reference and one filterable library over everything.

---

## Phase 8 — a coach, a number, a game, and a price

The feedback was "it is getting boring and plain", twice, and a request for an
algorithm, something social, a mini-game and a premium tier. The boredom
complaint was the real signal: the app had become an excellent set of
instruments and still gave the player nothing to chase.

**The coach decides.** `lib/coach/pick.ts` takes readiness, load status, the
program, the neglected-drill history, the benchmark clock and the level, and
returns one instruction with one reason. Everything it needs already existed —
the player was just being asked to hold all of it in their head and choose.
A coach does not hand you a catalogue. It refuses to train you at all on a
plan's rest day or after two sessions, puts the program ahead of its own
preferences, and drops the retest suggestion on a day it has already told you
to back off.

**A rating that goes up.** 0–1000 from five parts — consistency, volume,
sharpness, engine, range — through six tiers from Newcomer to Machine.
Deliberately hard to farm: consistency is capped by _weeks_, so six sessions in
one day buys nothing that six weeks does, and sharpness measures improvement
against your own earliest sessions so a beginner is not punished for being slow
in absolute terms.

**Reflex Rush.** Thirty seconds, tap the corner that lights up. Fast reads are
worth ten times a slow one, wrong taps cost you, and it is the one thing a solo
player genuinely cannot train against a wall. Kept out of the training
repositories entirely: a streak you can hold by playing a phone game is a streak
that means nothing.

**Challenges, with no server.** The engine has been seed-deterministic since
phase one, which turns out to be the entire feature: a short code carrying a
drill, four settings and a seed reproduces the identical corner order on someone
else's phone, so "beat my score" is a fair contest. Codes use a base-32 alphabet
with no O/0 or I/1, and settings are clamped on the way in — a hand-edited code
must not be able to start a nine-hour drill.

### The premium line, and where it does not fall

Two rules decided it. **Nothing that prevents an injury is ever paywalled** —
the warm-up, the readiness check and the load warning are free for everyone, for
ever, and there is a test that fails the build if one of them turns up in the
paid list. And **the free app has to be good on its own**: every drill, the
whole reference, the benchmark, the game and your full history are free.

Premium buys the judgement on top — being told what to do today and why, the
rating breakdown, every program, and sending challenges. Taking a challenge is
free even though sending one is not, because a social loop that needs both
people to pay is not a loop.

Bundles are ₱99 / ₱199 / ₱599 for one, three and twelve months, against roughly
₱800 for a single coaching session locally.

**No payments are connected, and the page says so above the prices rather than
below them.** The entitlement lives in local storage, which anyone who opens the
devtools can switch on; a real subscription needs a provider and a server that
verifies the receipt. The store is shaped so that is a small change rather than
a rewrite. A screen that looks like a checkout and quietly does nothing is how
you lose someone's trust permanently.

### Found while building it

- The challenge separator was a hyphen, which silently destroyed every code:
  `encodeURIComponent` leaves hyphens alone because they are unreserved, so
  "six-corner-shadow" split into three fields. It is a comma now, chosen
  specifically because the escaping removes it from the values.
- The game's first timing loop scheduled itself with `setTimeout` recursion and
  read a ref during render. Rewritten as a single animation frame asking "what
  should be on screen now?" — simpler, and impossible to leak timers.
- `Date.now()` in a React render is impure. The benchmark clock moved into
  `pickToday`, where the reference time is an injectable parameter.

---

## Phase 7 — finding your way in

A badminton coach and varsity player was handed the app and said, in Tagalog,
the most useful thing anyone has said about it: put it in categories. If a
player wants to improve their agility they should tap Agility and be shown the
drills that do that. Separate beginner from intermediate and advanced. And for
beginners, the basics — how to hold the racket, the backhand grip, the swing of
a smash, proper footwork — **with pictures**.

He was right on every count, and the two gaps he found were real.

**A flat catalogue only helps someone who already knows the answer.** Twelve
drills in a list is useful if you know that a six-corner shadow drill is the
thing that fixes your movement. Nobody new knows that. What a player does know
is what they want to be better at — so Train now opens with eight goals in the
player's own words ("I want to be quicker", "I want to last three games"), each
mapped onto the categories the catalogue already carried. The flat list is still
there underneath, as "or browse everything".

**Levels are now a filter, not a badge.** A beginner sees beginner material by
default and can move the level up whenever they like. Nothing is ever locked —
a hidden count says how much more is there, because permanently hiding things
from someone is its own kind of insult. Power is the one area that can be empty
for a beginner, deliberately: plyometrics punish cold, untrained legs, which is
why the periodiser keeps them out of base weeks too. The card reads "for later"
rather than "nothing", which is the truth.

**The basics, drawn.** Six new topics — the forehand grip, the backhand grip,
the ready stance, the overhead clear, the smash and the low serve — plus three
existing footwork ones, presented as a numbered path in teaching order rather
than alphabetically, because the order _is_ the pedagogy. Every one carries a
diagram the app draws from numbers:

- **Grips** get a racket alongside the handle in cross-section, with the exact
  bevel highlighted. The cross-section alone is how every coaching manual draws
  a grip, and on its own it is an octagon with a squiggle beside it — manuals
  get away with it because there is a photograph on the facing page. The racket
  anchors what you are looking down, and carries a second real instruction
  (hold it low) the cross-section cannot show.
- **Swings** reuse the warm-up skeleton with a racket in hand, and the motion
  arc follows the racket head rather than the wrist.

**A first visit now gets an introduction.** No profile and nothing logged means
a welcome card that says what the app is and offers one obvious first tap. The
recommended drill is withheld until then — "Start here: Six-Corner Shadow,
Intermediate" directly under "never played before?" is two pieces of advice
arguing with each other.

### The figures are testable now

Every defect in these drawings across the whole project has been found by
rendering one and squinting at it: a figure floating above the floor, an arrow
attached to a faded far-side limb, a racket swinging off the canvas. Squinting
does not scale to fifty poses, so the geometry moved out of the component into
`lib/figures/skeleton.ts` and the checks became arithmetic — feet on the floor,
nothing outside the canvas, labels short enough not to clip, a wide stance
actually wider than the hips, and every keyframe visibly different from the one
before it.

It immediately found a bug that had been shipping for weeks. Positive angles
mean "away from the centreline" on both sides, because the renderer does the
mirroring — but the warm-up poses were written `legL: -16, legR: 16`, which
draws a figure leaning to one side with its feet together. Thirty-three angles
across the exercise catalogue were wrong, so **"land wide, low" had been drawn
as a lean** in the split-step figure the user looks at every warm-up. Also
caught: a calf stretch reaching past the edge of its canvas, and three of the
new swings whose frames barely differed.

---

## Phase 6 — the app starts listening

Everything up to here was a very good timer with a very good plan attached. It
still could not tell the difference between a session that wrecked you and one
that did not, and it did not care how you felt when you opened it. Three
changes, in the order they matter.

**Session RPE and training load.** One tap on the summary screen, 1–10, rated
while you can still feel it. Effort × minutes is the standard measure in every
sport for a reason: twelve minutes of Tabata and twelve of technique footwork
are the same number of minutes and nothing like the same session. From that the
app derives the acute:chronic ratio — this week against the last four — which
is the closest thing amateur sport has to an early warning for overuse injury,
and exactly what a solo player has nobody to spot for them.

Two judgement calls in there. The ratio is withheld until three weeks of
history exist, because before that it screams "spike" at everyone who has just
started, and a warning that cries wolf on day two is one people learn to
ignore. And an unrated session counts as a moderate effort rather than being
skipped — dropping it would make a heavy week look light purely because it went
unrated, which is backwards for a safety net.

**The readiness check and auto-regulation.** Sleep, legs, energy; three taps,
no submit button, saved on the third answer. The result plus the load status
produce one instruction, and the player accepts it or ignores it — the app is
allowed an opinion about today, but it does not overrule anyone.

The rule that earns its keep: any single answer at the bottom of its scale
forces "lighter" regardless of the other two. "Slept fine, energy fine, legs
wrecked" averages to a perfectly respectable 50, and is not a day to go and do
repeated lunging. Averaging hides the answer that matters. The reverse
asymmetry is deliberate too — it will back you off on feel alone, but never
push you harder unless the workload figures agree, because a wrong "take it
easy" costs one ordinary session and a wrong "push" costs six weeks.

Accepting an adjustment does not touch the saved drill configuration. It is
applied at the moment the drill starts and expires overnight, so a tired
Tuesday never quietly becomes a drill's new normal. Rounds are trimmed before
work time, because "four instead of six" is a decision you can hold in your
head mid-drill and "42 seconds instead of 60" is just an odd number on a clock.

**Why today.** The Today card now names the block and the let-up — "Base week 3
of 12", "Next week backs off — hold on until then" — derived from the same
periodiser that generated the plan, so it cannot drift out of step with it. The
weeks people quit on are the ugly ones in the middle of a build block, and they
quit because from the inside a twelve-week plan is indistinguishable from an
infinite one.

### Found by looking rather than by testing

- A session you had already rated came back showing no rating. The metrics
  query only starts once the session has loaded, so the rating arrived a render
  after the prompt mounted and `useState(initial)` had already missed it.
  Derived during render instead.
- The load strip said "this week" over a rolling seven-day window while the
  bars directly beneath it were calendar weeks — two different weeks, two
  different numbers, in one card. Relabelled; the rolling window is the correct
  one for a ramp and the field names now say so.
- The load chart's Y axis was sized for two-digit minutes and silently ate the
  leading digit of every three-digit load.
- The check-in asked "How did you sleep? 1 2 3 4 5" with no indication of which
  end was good. Anchor labels now sit under each row, before the first tap
  rather than after it.

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
  is exercised end to end. Phase 6 adds a `readiness_checks` table and a unique
  index on `session_metrics (session_id, metric_key)`; re-running `schema.sql`
  applies both, and it de-duplicates any existing metric rows first so the index
  can build.
- **The load ratio needs three weeks before it says anything.** By design, but
  it does mean a new player sees "Settling in" for most of their first month.

---

## Where this could go next

Nothing in the brief remains. If it were carried on:

1. **Record and review your own swing.** The biggest hole left in solo
   training: nobody ever tells you your overhead is wrong, so a flaw gets
   grooved for six months. Camera, an eight-second clip, quarter-speed playback
   beside the technique checklist, and last month's clip next to this one.
   Needs IndexedDB rather than local storage, a camera permission flow and a
   storage-budget story — its own release, not a bullet point.
2. **Vet and add the clips** from an environment with network access — the seam
   is built and tested.
3. **Session-linked notes**, so a player can record what actually went wrong in
   a session against the fault it matches.
4. **Exercise-level circuit authoring**, the one thing Phase 3 deferred and
   Phase 4 did not pick up: swapping a single exercise inside a circuit.
5. **A wider desktop layout.** The content column caps at `max-w-3xl`, which
   uses under half of a 1440px screen. Real, but nobody trains from a desk.
6. **Real device testing.** Everything has been verified in Chromium at phone
   and desktop widths, but wake lock, vibration and speech behave differently on
   actual iOS and Android hardware.
