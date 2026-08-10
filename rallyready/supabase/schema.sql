-- ============================================================================
--  RallyReady — Postgres schema for Supabase
-- ============================================================================
--  Run this once against a fresh Supabase project:
--    Dashboard → SQL Editor → New query → paste → Run
--  or:
--    psql "$SUPABASE_DB_URL" -f supabase/schema.sql
--
--  It is idempotent: re-running it is safe and will not drop your data.
--
--  Covers the complete data model from the product spec, including tables the
--  app does not read yet (programs, benchmarks, badges arrive in Phases 2-5).
--  Getting the schema and its policies right once is cheaper than migrating
--  a live database later.
--
--  Security model
--  --------------
--  Every table has Row-Level Security ON with no permissive default. A user
--  can read and write only their own rows. The exception is content marked
--  `is_public = true` (drills and programs), which everybody can read but only
--  the owner can modify.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enum types
do $$
begin
  if not exists (select 1 from pg_type where typname = 'skill_level') then
    create type skill_level as enum ('beginner', 'intermediate', 'advanced');
  end if;
  if not exists (select 1 from pg_type where typname = 'discipline') then
    create type discipline as enum ('singles', 'doubles', 'both');
  end if;
  if not exists (select 1 from pg_type where typname = 'drill_category') then
    create type drill_category as enum
      ('footwork', 'net', 'rear-court', 'conditioning', 'agility', 'plyometric');
  end if;
  if not exists (select 1 from pg_type where typname = 'drill_style') then
    create type drill_style as enum ('shadow', 'ghosting', 'ladder', 'hiit', 'custom');
  end if;
  if not exists (select 1 from pg_type where typname = 'call_mode') then
    create type call_mode as enum ('sequential', 'random', 'deception', 'number', 'weighted');
  end if;
  if not exists (select 1 from pg_type where typname = 'session_source') then
    create type session_source as enum ('timer', 'conditioning', 'benchmark');
  end if;
  if not exists (select 1 from pg_type where typname = 'program_focus') then
    create type program_focus as enum ('footwork', 'conditioning', 'rest', 'matchplay');
  end if;
  if not exists (select 1 from pg_type where typname = 'enrollment_status') then
    create type enrollment_status as enum ('active', 'paused', 'completed', 'abandoned');
  end if;
  if not exists (select 1 from pg_type where typname = 'benchmark_test') then
    create type benchmark_test as enum ('b_endurance_style', 'spider_sprint');
  end if;
  if not exists (select 1 from pg_type where typname = 'training_goal') then
    create type training_goal as enum ('stamina', 'footwork', 'match-ready', 'consistency');
  end if;
  if not exists (select 1 from pg_type where typname = 'drill_location') then
    create type drill_location as enum ('court', 'anywhere');
  end if;
end
$$;

-- ================================================================== profiles
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text        not null default 'Player',
  avatar_url         text,
  skill_level        skill_level   not null default 'intermediate',
  primary_discipline discipline    not null default 'both',
  goal               training_goal not null default 'footwork',
  created_at         timestamptz   not null default now()
);

-- Added in Phase 2; keeps an existing database in step with a fresh one.
alter table public.profiles
  add column if not exists goal training_goal not null default 'footwork';

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-readable" on public.profiles;
create policy "profiles are self-readable"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles are self-writable" on public.profiles;
create policy "profiles are self-writable"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles are self-updatable" on public.profiles;
create policy "profiles are self-updatable"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles are self-deletable" on public.profiles;
create policy "profiles are self-deletable"
  on public.profiles for delete using (auth.uid() = id);

-- A profile row should exist the moment someone signs up, so the app never has
-- to special-case "signed in but no profile yet".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'Player'), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==================================================================== drills
--  `default_interval_ms`, `default_call_mode`, `enabled_corners`,
--  `default_warmup_sec`, `default_cooldown_sec` and `level` extend the model in
--  the spec. Without them a seeded drill cannot express what §4 asks for —
--  "net corners only", "slower interval", "deception on" — so the timer would
--  need those settings hard-coded in the client instead of living with the drill.
create table if not exists public.drills (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text           not null unique,
  name                 text           not null,
  category             drill_category not null,
  mode                 drill_style    not null,
  description          text           not null default '',
  coaching_cues        text[]         not null default '{}',
  common_faults        text[]         not null default '{}',
  default_work_sec     integer        not null default 30 check (default_work_sec between 1 and 1800),
  default_rest_sec     integer        not null default 30 check (default_rest_sec between 0 and 1800),
  default_rounds       integer        not null default 6  check (default_rounds between 1 and 100),
  corners              integer        not null default 6  check (corners in (4, 6, 8)),
  video_url            text,
  is_public            boolean        not null default false,
  created_by           uuid references auth.users (id) on delete set null,
  default_interval_ms  integer        not null default 1400
                         check (default_interval_ms between 300 and 10000),
  default_call_mode    call_mode      not null default 'random',
  enabled_corners      text[],  -- null = every zone in the layout
  default_warmup_sec   integer        not null default 60 check (default_warmup_sec >= 0),
  default_cooldown_sec integer        not null default 60 check (default_cooldown_sec >= 0),
  level                skill_level    not null default 'intermediate',
  -- Phase 3. A non-null `circuit` makes this a conditioning circuit rather than
  -- a corner-calling drill: an ordered list of
  -- {exerciseSlug, workSec, restSec}, repeated `circuit_rounds` times. Kept as
  -- jsonb rather than a child table because it is an ordered value object that
  -- is always read and written whole, never queried into.
  circuit              jsonb,
  circuit_rounds       integer        not null default 1 check (circuit_rounds between 1 and 20),
  location             drill_location not null default 'court',
  equipment            text[]         not null default '{}',
  created_at           timestamptz    not null default now()
);

-- Added in Phase 3; keeps an existing database in step with a fresh one.
alter table public.drills
  add column if not exists circuit        jsonb,
  add column if not exists circuit_rounds integer not null default 1,
  add column if not exists location       drill_location not null default 'court',
  add column if not exists equipment      text[] not null default '{}';

create index if not exists drills_public_idx on public.drills (is_public) where is_public;
create index if not exists drills_created_by_idx on public.drills (created_by);

alter table public.drills enable row level security;

drop policy if exists "public drills are readable by everyone" on public.drills;
create policy "public drills are readable by everyone"
  on public.drills for select using (is_public or auth.uid() = created_by);

drop policy if exists "users create their own drills" on public.drills;
create policy "users create their own drills"
  on public.drills for insert with check (auth.uid() = created_by);

drop policy if exists "users update their own drills" on public.drills;
create policy "users update their own drills"
  on public.drills for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "users delete their own drills" on public.drills;
create policy "users delete their own drills"
  on public.drills for delete using (auth.uid() = created_by);

-- ================================================================== sessions
--  `drill_name` is denormalised on purpose: a training log should record what
--  you actually did, even after the drill is renamed, deleted, or was a
--  one-off custom setup with no drill_id at all.
create table if not exists public.sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid           not null references auth.users (id) on delete cascade,
  drill_id             uuid references public.drills (id) on delete set null,
  drill_name           text,
  started_at           timestamptz    not null default now(),
  duration_sec         integer        not null default 0 check (duration_sec >= 0),
  rounds_completed     integer        not null default 0 check (rounds_completed >= 0),
  avg_shot_interval_ms integer        check (avg_shot_interval_ms is null or avg_shot_interval_ms >= 0),
  notes                text,
  source               session_source not null default 'timer',
  created_at           timestamptz    not null default now()
);

create index if not exists sessions_user_started_idx
  on public.sessions (user_id, started_at desc);

alter table public.sessions enable row level security;

drop policy if exists "sessions are private" on public.sessions;
create policy "sessions are private"
  on public.sessions for select using (auth.uid() = user_id);

drop policy if exists "users log their own sessions" on public.sessions;
create policy "users log their own sessions"
  on public.sessions for insert with check (auth.uid() = user_id);

drop policy if exists "users edit their own sessions" on public.sessions;
create policy "users edit their own sessions"
  on public.sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete their own sessions" on public.sessions;
create policy "users delete their own sessions"
  on public.sessions for delete using (auth.uid() = user_id);

-- ========================================================== session_metrics
create table if not exists public.session_metrics (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid   not null references public.sessions (id) on delete cascade,
  metric_key   text   not null,
  metric_value numeric not null
);

create index if not exists session_metrics_session_idx on public.session_metrics (session_id);

alter table public.session_metrics enable row level security;

-- Ownership is inherited from the parent session.
drop policy if exists "metrics follow their session" on public.session_metrics;
create policy "metrics follow their session"
  on public.session_metrics for select
  using (exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));

drop policy if exists "metrics are written with their session" on public.session_metrics;
create policy "metrics are written with their session"
  on public.session_metrics for insert
  with check (exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));

drop policy if exists "metrics are deletable by their owner" on public.session_metrics;
create policy "metrics are deletable by their owner"
  on public.session_metrics for delete
  using (exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));

-- ================================================================== programs
create table if not exists public.programs (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null,
  description text        not null default '',
  total_weeks integer     not null default 8 check (total_weeks between 1 and 52),
  level       skill_level not null default 'intermediate',
  is_public   boolean     not null default false,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.programs enable row level security;

drop policy if exists "public programs are readable by everyone" on public.programs;
create policy "public programs are readable by everyone"
  on public.programs for select using (is_public or auth.uid() = created_by);

drop policy if exists "users create their own programs" on public.programs;
create policy "users create their own programs"
  on public.programs for insert with check (auth.uid() = created_by);

drop policy if exists "users update their own programs" on public.programs;
create policy "users update their own programs"
  on public.programs for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "users delete their own programs" on public.programs;
create policy "users delete their own programs"
  on public.programs for delete using (auth.uid() = created_by);

-- ============================================================== program_days
create table if not exists public.program_days (
  id         uuid          primary key default gen_random_uuid(),
  program_id uuid          not null references public.programs (id) on delete cascade,
  week_no    integer       not null check (week_no >= 1),
  day_no     integer       not null check (day_no between 1 and 7),
  title      text          not null,
  focus      program_focus not null,
  drill_ids  uuid[]        not null default '{}',
  notes      text,
  unique (program_id, week_no, day_no)
);

create index if not exists program_days_program_idx on public.program_days (program_id, week_no, day_no);

alter table public.program_days enable row level security;

-- Visibility is inherited from the parent program.
drop policy if exists "program days follow their program" on public.program_days;
create policy "program days follow their program"
  on public.program_days for select
  using (exists (
    select 1 from public.programs p
    where p.id = program_id and (p.is_public or p.created_by = auth.uid())
  ));

drop policy if exists "authors write their program days" on public.program_days;
create policy "authors write their program days"
  on public.program_days for insert
  with check (exists (
    select 1 from public.programs p where p.id = program_id and p.created_by = auth.uid()
  ));

drop policy if exists "authors update their program days" on public.program_days;
create policy "authors update their program days"
  on public.program_days for update
  using (exists (
    select 1 from public.programs p where p.id = program_id and p.created_by = auth.uid()
  ));

drop policy if exists "authors delete their program days" on public.program_days;
create policy "authors delete their program days"
  on public.program_days for delete
  using (exists (
    select 1 from public.programs p where p.id = program_id and p.created_by = auth.uid()
  ));

-- ======================================================= program_enrollments
create table if not exists public.program_enrollments (
  id           uuid              primary key default gen_random_uuid(),
  user_id      uuid              not null references auth.users (id) on delete cascade,
  program_id   uuid              not null references public.programs (id) on delete cascade,
  started_on   date              not null default current_date,
  current_week integer           not null default 1 check (current_week >= 1),
  current_day  integer           not null default 1 check (current_day between 1 and 7),
  status       enrollment_status not null default 'active',
  created_at   timestamptz       not null default now(),
  unique (user_id, program_id)
);

alter table public.program_enrollments enable row level security;

drop policy if exists "enrollments are private" on public.program_enrollments;
create policy "enrollments are private"
  on public.program_enrollments for select using (auth.uid() = user_id);

drop policy if exists "users enrol themselves" on public.program_enrollments;
create policy "users enrol themselves"
  on public.program_enrollments for insert with check (auth.uid() = user_id);

drop policy if exists "users update their enrollment" on public.program_enrollments;
create policy "users update their enrollment"
  on public.program_enrollments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users leave a program" on public.program_enrollments;
create policy "users leave a program"
  on public.program_enrollments for delete using (auth.uid() = user_id);

-- ================================================================ benchmarks
create table if not exists public.benchmarks (
  id            uuid           primary key default gen_random_uuid(),
  user_id       uuid           not null references auth.users (id) on delete cascade,
  test_type     benchmark_test not null,
  taken_at      timestamptz    not null default now(),
  score         numeric        not null,
  level_reached integer,
  raw           jsonb          not null default '{}'::jsonb
);

create index if not exists benchmarks_user_taken_idx
  on public.benchmarks (user_id, test_type, taken_at desc);

alter table public.benchmarks enable row level security;

drop policy if exists "benchmarks are private" on public.benchmarks;
create policy "benchmarks are private"
  on public.benchmarks for select using (auth.uid() = user_id);

drop policy if exists "users record their own benchmarks" on public.benchmarks;
create policy "users record their own benchmarks"
  on public.benchmarks for insert with check (auth.uid() = user_id);

drop policy if exists "users delete their own benchmarks" on public.benchmarks;
create policy "users delete their own benchmarks"
  on public.benchmarks for delete using (auth.uid() = user_id);

-- =================================================================== streaks
create table if not exists public.streaks (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null unique references auth.users (id) on delete cascade,
  current_streak        integer     not null default 0,
  longest_streak        integer     not null default 0,
  last_active_date      date,
  weekly_sessions_count integer     not null default 0,
  updated_at            timestamptz not null default now()
);

alter table public.streaks enable row level security;

drop policy if exists "streaks are private" on public.streaks;
create policy "streaks are private"
  on public.streaks for select using (auth.uid() = user_id);

drop policy if exists "users write their own streak" on public.streaks;
create policy "users write their own streak"
  on public.streaks for insert with check (auth.uid() = user_id);

drop policy if exists "users update their own streak" on public.streaks;
create policy "users update their own streak"
  on public.streaks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==================================================== badges / user_badges
create table if not exists public.badges (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null,
  description text        not null default '',
  icon        text        not null default 'award',
  -- Grouped so beginners and advanced players both have something in reach.
  tier        text        not null default 'bronze' check (tier in ('bronze', 'silver', 'gold')),
  created_at  timestamptz not null default now()
);

alter table public.badges enable row level security;

-- Badge definitions are catalogue data: readable by anyone, writable by nobody
-- through the anon key (seeded by this script / the service role).
drop policy if exists "badge definitions are public" on public.badges;
create policy "badge definitions are public" on public.badges for select using (true);

create table if not exists public.user_badges (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  badge_id   uuid        not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table public.user_badges enable row level security;

drop policy if exists "unlocks are private" on public.user_badges;
create policy "unlocks are private"
  on public.user_badges for select using (auth.uid() = user_id);

drop policy if exists "users record their own unlocks" on public.user_badges;
create policy "users record their own unlocks"
  on public.user_badges for insert with check (auth.uid() = user_id);

-- ============================================================================
--  Seed content
-- ============================================================================
--  Mirrors src/lib/data/seed/drills.ts, keyed by slug. Kept in sync by hand;
--  the client bundles the same catalogue so a fresh install works offline.

-- >>> generated from src/lib/data/seed/drills.ts — do not edit by hand
insert into public.drills (
  slug, name, category, mode, description, coaching_cues, common_faults, default_work_sec, default_rest_sec, default_rounds, corners, default_interval_ms, default_call_mode, enabled_corners, default_warmup_sec, default_cooldown_sec, level, is_public, circuit, circuit_rounds, location, equipment
) values
(
  'six-corner-shadow', 'Six-Corner Shadow', 'footwork', 'shadow',
  'The benchmark solo session. Six targets, random calls, full shadow swing at every corner. Builds the movement pattern and the engine behind it at the same time.',
  array[
      'Split-step as the call lands — land light, weight on the balls of your feet.',
      'Racket up and in front on every recovery; never let it drop below your waist.',
      'Chassé to the sides and rear, lunge to the net. Running flat-footed wastes a step.',
      'Recover through base after every corner, not around it.',
      'Finish each movement with a shadow swing so the arm learns the timing too.'
    ],
  array[
      'Standing tall between calls instead of staying loaded in a low ready position.',
      'Skipping the split-step and starting late.',
      'Crossing the feet on the way to the rear corners.',
      'Drifting past base on the recovery and getting caught flat.'
    ],
  30, 30, 6, 6,
  1350, 'random',
  null,
  60, 60, 'intermediate', true,
  null, 1, 'court',
  '{}'
),
(
  'four-corner-footwork', 'Four-Corner Footwork', 'footwork', 'ghosting',
  'The classic four-corner pattern: two net corners, two rear corners. Fewer targets means longer travel and a harder recovery — the best place to start if six feels frantic.',
  array[
      'Two-step chassé to the rear, lunge to the front. Economy beats effort.',
      'Push off the outside foot to change direction rather than shuffling round.',
      'Keep the hips square to the net until the last step.',
      'Land each lunge with the knee tracking over the toes, never inside them.'
    ],
  array[
      'Over-striding to the net so there is nothing left to push back out with.',
      'Turning the shoulders early and losing balance on the way back.',
      'Bouncing on the spot instead of holding a stable, loaded base.'
    ],
  30, 30, 6, 4,
  1650, 'random',
  null,
  60, 60, 'beginner', true,
  null, 1, 'court',
  '{}'
),
(
  'net-footwork', 'Front-Court Net Footwork', 'net', 'shadow',
  'Net corners only, at a deliberate pace. This is a technique drill disguised as a fitness drill — every rep is a full lunge and a full push back to base.',
  array[
      'The racket leg leads every lunge — right leg for right-handers.',
      'Drive out of the lunge with the front leg. The back leg is a brake, not an engine.',
      'Take the shuttle early and high: reach in front of the knee, not beside it.',
      'Chest up. Bending at the waist kills the recovery before it starts.'
    ],
  array[
      'Landing on a straight leg and jarring the knee.',
      'Letting the racket head drop below the net tape.',
      'Standing up out of the lunge before pushing back.'
    ],
  20, 25, 6, 4,
  1800, 'random',
  array[
      'net-left',
      'net-right'
    ],
  60, 60, 'beginner', true,
  null, 1, 'court',
  '{}'
),
(
  'rear-court-scissor', 'Rear-Court Scissor Recovery', 'rear-court', 'shadow',
  'Rear corners only, slow calls, maximum quality. Get behind the shuttle, scissor-jump the legs, land balanced and recover. The most common place a returning player loses time.',
  array[
      'Turn side-on early, then chassé back. Never run backwards.',
      'Scissor the legs in the air: hitting leg back, landing leg forward.',
      'Land on the non-racket foot first and let it absorb the drop.',
      'Rotate hips and shoulders through the shot; the arm follows the body.'
    ],
  array[
      'Reaching backwards for the shuttle instead of getting behind it.',
      'Landing flat on both feet, which stalls the recovery.',
      'Losing the racket-up ready position on the way back to base.'
    ],
  20, 40, 6, 4,
  2200, 'random',
  array[
      'rear-left',
      'rear-right'
    ],
  90, 60, 'intermediate', true,
  null, 1, 'court',
  '{}'
),
(
  'deception-reaction', 'Deception Reaction', 'footwork', 'ghosting',
  'A fake call, then the real one. Trains the second split-step — the thing that separates players who get wrong-footed from players who do not.',
  array[
      'Split-step on the first call and again on the second. That is the whole drill.',
      'Tall in the hips, low in the knees — you cannot redirect out of a deep squat.',
      'Move your eyes before your feet.',
      'Accept a slower first step in exchange for never being wrong-footed.'
    ],
  array[
      'Committing full body weight to the fake and losing the second step.',
      'Freezing on the fake instead of re-splitting.',
      'Anticipating a pattern rather than reacting to the call.'
    ],
  25, 35, 5, 6,
  1800, 'deception',
  null,
  90, 60, 'advanced', true,
  null, 1, 'court',
  '{}'
),
(
  'match-rhythm-intervals', 'Match Rhythm Intervals', 'conditioning', 'ghosting',
  'Built on measured singles match data — roughly 5–6 second rallies against 11–12 seconds between them. Short, sharp work blocks at a true 1:2 ratio, so the session trains the energy system a match actually uses.',
  array[
      'Treat every work block as a rally: full intensity, then genuinely recover.',
      'Use the rest. Walk, breathe through the nose, let the heart rate drop.',
      'Movement quality matters more than the number of corners covered.'
    ],
  array[
      'Pacing the work block like a jog because you are saving energy for later.',
      'Standing still during rest instead of walking it off.'
    ],
  6, 12, 12, 6,
  1100, 'random',
  null,
  90, 90, 'intermediate', true,
  null, 1, 'anywhere',
  '{}'
),
(
  'tabata-shadow', 'Tabata Shadow', 'conditioning', 'hiit',
  'Twenty seconds on, ten seconds off, eight times. Four minutes that will tell you exactly how much base you have — and nothing to hide behind.',
  array[
      'Twenty seconds is short. Go from the first call, not the third.',
      'When you tire, shorten the recovery step — never the split-step.',
      'Hold the racket up even when your arms want to drop.'
    ],
  array[
      'Fading in rounds 5 to 8 because rounds 1 and 2 were too hard.',
      'Letting footwork collapse into running once fatigue sets in.'
    ],
  20, 10, 8, 6,
  1000, 'random',
  null,
  120, 120, 'advanced', true,
  null, 1, 'anywhere',
  '{}'
),
(
  'multifeed-shadow', 'Multifeed Shadow Intervals', 'conditioning', 'ghosting',
  'Ten seconds flat out, thirty to recover, over and over. Short efforts are the point: multifeed falls apart as a training tool the moment your movement gets sloppy, so the block ends before it can.',
  array[
      'Ten seconds is a sprint, not a pace. Empty the tank each block.',
      'The moment your footwork turns into running, the block has done its job.',
      'Use the full thirty seconds — this is not a work-capacity drill, it is a speed one.',
      'Racket up throughout, even on the last round.'
    ],
  array[
      'Treating the work block as a jog to preserve energy for later rounds.',
      'Cutting the rest short and turning a speed session into a slog.'
    ],
  10, 30, 10, 6,
  880, 'random',
  null,
  120, 120, 'advanced', true,
  null, 1, 'anywhere',
  '{}'
),
(
  'rally-hiit', 'Rally HIIT', 'conditioning', 'hiit',
  'Longer rallies than a match usually gives you, with match-length recovery. Fifteen seconds on, fifteen off — a 1:1 ratio that is deliberately harder than real play, so real play feels easy.',
  array[
      'Fifteen seconds is roughly three long rallies back to back. Pace accordingly.',
      'Breathe through the nose in the rest; it settles the heart rate faster.',
      'Hold your movement quality to round eight, not just round three.'
    ],
  array[
      'Going out at a pace you can only hold for four rounds.',
      'Standing still in the rest instead of walking it off.'
    ],
  15, 15, 10, 6,
  1100, 'random',
  null,
  120, 120, 'intermediate', true,
  null, 1, 'anywhere',
  '{}'
),
(
  'agility-ladder-circuit', 'Agility Ladder Circuit', 'agility', 'ladder',
  'Four ladder patterns, three times through. Trains foot speed and coordination rather than lungs — go for clean feet at high cadence, not for exhaustion.',
  array[
      'Cadence over stride. The ladder rewards how often your feet land, not how far they travel.',
      'Stay on the balls of the feet the whole way through.',
      'Chest up and eyes forward — looking down slows every pattern.',
      'Stop the block early if the pattern falls apart. Sloppy reps train sloppy feet.'
    ],
  array[
      'Chasing speed before the pattern is automatic.',
      'Letting the heels touch down and turning quick feet into running.'
    ],
  30, 25, 3, 4,
  1000, 'random',
  null,
  0, 120, 'intermediate', true,
  '[{"exerciseSlug":"ladder-in-out","workSec":30,"restSec":25},{"exerciseSlug":"ladder-lateral-shuffle","workSec":30,"restSec":25},{"exerciseSlug":"ladder-crossover","workSec":30,"restSec":25},{"exerciseSlug":"ladder-high-knees","workSec":25,"restSec":40}]'::jsonb, 3, 'anywhere',
  array[
      'agility ladder (or tape)'
    ]
),
(
  'plyometric-power-circuit', 'Plyometric Power Circuit', 'plyometric', 'custom',
  'Five explosive movements, three rounds. This is the drive behind a jump smash and the push out of a deep lunge — power work, so quality matters far more than the count.',
  array[
      'Every landing is a rep too. Land soft, absorb, then go again.',
      'Quality drops before your legs do. Stop the block when the jumps get scrappy.',
      'Full recovery between exercises — this is power training, not conditioning.',
      'Do this on a forgiving surface, never on concrete.'
    ],
  array[
      'Rushing the reps and turning a power session into a cardio one.',
      'Landing stiff-legged, which is where the knee and shin complaints start.',
      'Adding rounds instead of adding height.'
    ],
  25, 35, 3, 4,
  1000, 'random',
  null,
  0, 180, 'advanced', true,
  '[{"exerciseSlug":"plyo-jump-squat","workSec":25,"restSec":35},{"exerciseSlug":"plyo-split-jump","workSec":25,"restSec":35},{"exerciseSlug":"plyo-lateral-bound","workSec":25,"restSec":35},{"exerciseSlug":"plyo-tuck-jump","workSec":20,"restSec":40},{"exerciseSlug":"plyo-step-jump","workSec":25,"restSec":45}]'::jsonb, 3, 'anywhere',
  array[
      'a low step or box (optional)'
    ]
),
(
  'home-court-circuit', 'No-Court Home Circuit', 'conditioning', 'custom',
  'No court, no ladder, no box — two square metres and your own bodyweight. Built for the evenings when the hall is shut and doing nothing is the alternative.',
  array[
      'Nothing here needs equipment. If a movement hurts, halve the range, not the effort.',
      'Keep the rest honest: forty seconds is enough to go hard again.',
      'Two rounds done properly beats four rounds rushed.'
    ],
  array[
      'Letting the lunges get shallow as the rounds add up.',
      'Rocking the hips through the plank taps, which removes the whole point.'
    ],
  30, 30, 3, 4,
  1000, 'random',
  null,
  0, 120, 'beginner', true,
  '[{"exerciseSlug":"shadow-lunge","workSec":40,"restSec":25},{"exerciseSlug":"plyo-jump-squat","workSec":25,"restSec":35},{"exerciseSlug":"plyo-lateral-bound","workSec":30,"restSec":30},{"exerciseSlug":"core-plank-reach","workSec":40,"restSec":40}]'::jsonb, 3, 'anywhere',
  '{}'
)
on conflict (slug) do update set
  name                 = excluded.name,
  category             = excluded.category,
  mode                 = excluded.mode,
  description          = excluded.description,
  coaching_cues        = excluded.coaching_cues,
  common_faults        = excluded.common_faults,
  default_work_sec     = excluded.default_work_sec,
  default_rest_sec     = excluded.default_rest_sec,
  default_rounds       = excluded.default_rounds,
  corners              = excluded.corners,
  default_interval_ms  = excluded.default_interval_ms,
  default_call_mode    = excluded.default_call_mode,
  enabled_corners      = excluded.enabled_corners,
  default_warmup_sec   = excluded.default_warmup_sec,
  default_cooldown_sec = excluded.default_cooldown_sec,
  level                = excluded.level,
  is_public            = excluded.is_public,
  circuit              = excluded.circuit,
  circuit_rounds       = excluded.circuit_rounds,
  location             = excluded.location,
  equipment            = excluded.equipment;
-- <<< end generated drill seed

--  Mirrors src/lib/data/badges.ts. Tiers are segmented on purpose: a beginner
--  always has a bronze within reach and a returning competitor still has a
--  gold to chase.
insert into public.badges (slug, name, description, icon, tier) values
  ('getting-started', 'Getting Started',    'Set your level and discipline.',              'flag',           'bronze'),
  ('first-session',   'First Steps',        'Complete your first session.',                'footprints',     'bronze'),
  ('week-one',        'Week One Down',      'Train twice in a single week.',               'calendar-check', 'bronze'),
  ('benchmarked',     'Know Your Number',   'Take the fitness benchmark.',                 'gauge',          'silver'),
  ('streak-4',        'Four in a Row',      'Four consecutive weeks with a session.',      'flame',          'silver'),
  ('thousand-calls',  'A Thousand Corners', 'Answer 1,000 corner calls.',                  'target',         'silver'),
  ('streak-12',       'Season Builder',     'Twelve consecutive weeks with a session.',    'trophy',         'gold'),
  ('deception-pro',   'Never Wrong-Footed', 'Complete ten Deception sessions.',            'shuffle',        'gold'),
  ('ten-hours',       'Ten Hours In',       'Ten hours of logged training.',               'hourglass',      'gold')
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  tier        = excluded.tier;
