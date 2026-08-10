import type { RallyReadyClient } from '@/lib/supabase/client'
import type { CourtLayout } from '@/lib/timer/corners'

import type {
  DrillRepository,
  ProfileRepository,
  Repositories,
  SessionRepository,
  StreakRepository,
} from '../ports'
import { computeStreak, localDateKey } from '../streaks'
import type {
  Drill,
  NewSession,
  NewSessionMetric,
  Profile,
  Session,
  SessionMetric,
} from '../types'
import type { DrillRow, ProfileRow, SessionMetricRow, SessionRow } from './database.types'

/**
 * The signed-in backend. Row-Level Security (see `supabase/schema.sql`) is what
 * actually scopes these queries to the current user; the `user_id` filters here
 * are belt-and-braces and keep the intent readable.
 */

function toDrill(row: DrillRow): Drill {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    style: row.mode,
    description: row.description,
    coachingCues: row.coaching_cues ?? [],
    commonFaults: row.common_faults ?? [],
    defaultWorkSec: row.default_work_sec,
    defaultRestSec: row.default_rest_sec,
    defaultRounds: row.default_rounds,
    corners: row.corners as CourtLayout,
    videoUrl: row.video_url,
    isPublic: row.is_public,
    createdBy: row.created_by,
    defaultIntervalMs: row.default_interval_ms,
    defaultCallMode: row.default_call_mode,
    enabledCorners: row.enabled_corners,
    defaultWarmupSec: row.default_warmup_sec,
    defaultCooldownSec: row.default_cooldown_sec,
    level: row.level,
  }
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    drillId: row.drill_id,
    drillName: row.drill_name,
    startedAt: row.started_at,
    durationSec: row.duration_sec,
    roundsCompleted: row.rounds_completed,
    avgShotIntervalMs: row.avg_shot_interval_ms,
    notes: row.notes,
    source: row.source,
  }
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    skillLevel: row.skill_level,
    primaryDiscipline: row.primary_discipline,
    createdAt: row.created_at,
  }
}

function toMetric(row: SessionMetricRow): SessionMetric {
  return {
    id: row.id,
    sessionId: row.session_id,
    metricKey: row.metric_key,
    metricValue: row.metric_value,
  }
}

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`)
}

export function createSupabaseRepositories(
  client: RallyReadyClient,
  userId: string,
): Repositories {
  const drills: DrillRepository = {
    async list() {
      // RLS already limits this to public drills plus the user's own.
      const { data, error } = await client.from('drills').select('*').order('name')
      fail('Could not load drills', error)
      return (data ?? []).map(toDrill)
    },
    async getBySlug(slug) {
      const { data, error } = await client
        .from('drills')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      fail('Could not load drill', error)
      return data ? toDrill(data) : null
    },
    async getById(id) {
      const { data, error } = await client.from('drills').select('*').eq('id', id).maybeSingle()
      fail('Could not load drill', error)
      return data ? toDrill(data) : null
    },
  }

  const sessions: SessionRepository = {
    async create(input: NewSession, metrics: NewSessionMetric[] = []) {
      const { data, error } = await client
        .from('sessions')
        .insert({
          user_id: userId,
          drill_id: input.drillId,
          drill_name: input.drillName,
          started_at: input.startedAt.toISOString(),
          duration_sec: input.durationSec,
          rounds_completed: input.roundsCompleted,
          avg_shot_interval_ms: input.avgShotIntervalMs,
          notes: input.notes ?? null,
          source: input.source,
        })
        .select('*')
        .single()
      fail('Could not save session', error)
      if (!data) throw new Error('Could not save session: no row returned')

      if (metrics.length > 0) {
        const { error: metricError } = await client.from('session_metrics').insert(
          metrics.map((metric) => ({
            session_id: data.id,
            metric_key: metric.metricKey,
            metric_value: metric.metricValue,
          })),
        )
        fail('Could not save session metrics', metricError)
      }

      return toSession(data)
    },

    async getById(id) {
      const { data, error } = await client
        .from('sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      fail('Could not load session', error)
      return data ? toSession(data) : null
    },

    async listRecent(limit = 20) {
      const { data, error } = await client
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit)
      fail('Could not load sessions', error)
      return (data ?? []).map(toSession)
    },

    async listMetrics(sessionId) {
      const { data, error } = await client
        .from('session_metrics')
        .select('*')
        .eq('session_id', sessionId)
      fail('Could not load session metrics', error)
      return (data ?? []).map(toMetric)
    },

    async listSessionDates() {
      const { data, error } = await client
        .from('sessions')
        .select('started_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: true })
      fail('Could not load session history', error)
      return (data ?? []).map((row) => localDateKey(new Date(row.started_at)))
    },
  }

  const streaks: StreakRepository = {
    async get() {
      // Derived from the session history for the same reason as the local
      // backend: a counter can drift, a projection cannot. The `streaks` row is
      // then refreshed so the value is queryable server-side too.
      const streak = computeStreak(await sessions.listSessionDates())
      await client.from('streaks').upsert(
        {
          user_id: userId,
          current_streak: streak.currentStreak,
          longest_streak: streak.longestStreak,
          last_active_date: streak.lastActiveDate,
          weekly_sessions_count: streak.weeklySessionsCount,
        },
        { onConflict: 'user_id' },
      )
      return streak
    },
  }

  const profiles: ProfileRepository = {
    async get() {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      fail('Could not load profile', error)
      return data ? toProfile(data) : null
    },
    async save(patch) {
      const { data, error } = await client
        .from('profiles')
        .upsert({
          id: userId,
          display_name: patch.displayName ?? 'Player',
          avatar_url: patch.avatarUrl ?? null,
          skill_level: patch.skillLevel ?? 'intermediate',
          primary_discipline: patch.primaryDiscipline ?? 'both',
        })
        .select('*')
        .single()
      fail('Could not save profile', error)
      if (!data) throw new Error('Could not save profile: no row returned')
      return toProfile(data)
    },
  }

  return { drills, sessions, streaks, profiles, backend: 'supabase' }
}
