import { localDateKey } from './streaks'
import type { Session, SessionMetric } from './types'

/**
 * Training load — what a session actually cost you, rather than how long it took.
 *
 * Minutes are a bad measure of training. Twelve minutes of Tabata shadow work
 * and twelve minutes of technique footwork are the same number on a chart and
 * nothing like the same thing in the legs. The standard fix in every sport is
 * session RPE: rate the effort 1–10 immediately afterwards, multiply by the
 * duration, and you have a single number that compares a hard short session
 * with an easy long one.
 *
 * From that you get the figure that matters to someone training alone with
 * nobody watching for warning signs: how fast the workload is ramping. A week
 * far heavier than the month behind it is the classic way an enthusiastic
 * returning player picks up an overuse injury, and it is entirely invisible if
 * all you track is a streak.
 *
 * Pure functions over rows — no clock, no storage — so the thresholds are
 * unit-tested rather than eyeballed on a chart.
 */

/** Session RPE, on the Borg CR10 scale most coaches use. */
export const RPE_MIN = 1
export const RPE_MAX = 10

/**
 * What an unrated session is assumed to have cost. Excluding them entirely
 * would make a heavy week look light simply because it went unrated, which is
 * the opposite of a safety net; "moderate" is the least wrong guess.
 */
export const RPE_ASSUMED = 5

export interface RpeStep {
  value: number
  label: string
  /** How it felt, in the words someone would actually use. */
  hint: string
}

/**
 * Anchored in breathing and speech rather than adjectives — "hard" means
 * nothing on its own, "could not hold a conversation" is checkable.
 */
export const RPE_SCALE: RpeStep[] = [
  { value: 1, label: 'Very easy', hint: 'Barely moving. Could do this all day.' },
  { value: 2, label: 'Easy', hint: 'Warm-up pace. Breathing normally.' },
  { value: 3, label: 'Light', hint: 'Working, but chatting the whole way.' },
  { value: 4, label: 'Steady', hint: 'Comfortable. Full sentences.' },
  { value: 5, label: 'Moderate', hint: 'Noticeably working. Short sentences.' },
  { value: 6, label: 'Somewhat hard', hint: 'Breathing hard. A few words at a time.' },
  { value: 7, label: 'Hard', hint: 'Wanted the rest when it came.' },
  { value: 8, label: 'Very hard', hint: 'Counting down the last block.' },
  { value: 9, label: 'Brutal', hint: 'Nearly stopped early.' },
  { value: 10, label: 'Everything', hint: 'Could not have done one more round.' },
]

export function rpeStep(value: number): RpeStep {
  return RPE_SCALE[clampRpe(value) - 1] as RpeStep
}

export function clampRpe(value: number): number {
  // An infinity is clamped to the end it points at, not dumped on the default:
  // `Number.isFinite` alone would quietly turn "maximum effort" into "moderate".
  if (Number.isNaN(value)) return RPE_ASSUMED
  if (value === Infinity) return RPE_MAX
  if (value === -Infinity) return RPE_MIN
  return Math.min(RPE_MAX, Math.max(RPE_MIN, Math.round(value)))
}

/**
 * Session load = effort × minutes. A 10-minute session at RPE 8 (80) outranks
 * a 25-minute stroll at RPE 3 (75), which is the whole point.
 */
export function sessionLoad(durationSec: number, rpe: number | null): number {
  const minutes = Math.max(0, durationSec) / 60
  return Math.round(minutes * clampRpe(rpe ?? RPE_ASSUMED))
}

export interface DayLoad {
  /** `YYYY-MM-DD`, local. */
  date: string
  /** Short axis label, e.g. "12 Aug". */
  label: string
  load: number
  sessions: number
  /** Sessions that day carrying a real RPE rather than an assumed one. */
  rated: number
}

/**
 * `settling`  — too little history to judge a ramp honestly.
 * `detraining`— this week is well below the recent norm.
 * `steady`    — inside the range that maintains or builds safely.
 * `building`  — a real step up. Fine, but the next week should not be another.
 * `spiking`   — a jump big enough to be worth naming.
 */
export type LoadStatus = 'settling' | 'detraining' | 'steady' | 'building' | 'spiking'

export const LOAD_STATUS_COPY: Record<LoadStatus, { label: string; blurb: string }> = {
  settling: {
    label: 'Settling in',
    blurb: 'A few more weeks of training and this will start telling you something useful.',
  },
  detraining: {
    label: 'Easing off',
    blurb:
      'Lighter than your recent normal. Deliberate is fine — drifting is how fitness leaks away.',
  },
  steady: {
    label: 'Steady',
    blurb:
      'Your week sits right where your recent training says it should. This is the sweet spot.',
  },
  building: {
    label: 'Building',
    blurb: 'A genuine step up. Hold here for a week rather than stacking another jump on top.',
  },
  spiking: {
    label: 'Ramping fast',
    blurb:
      'A much bigger week than your body has been prepared for. This is where overuse injuries come from — back off before it costs you six weeks.',
  },
}

/** Below this the week is unusually light; above it, unusually heavy. */
const RATIO_LOW = 0.8
const RATIO_HIGH = 1.3
const RATIO_SPIKE = 1.5

/** Chronic load needs a month behind it before the ratio means anything. */
const MIN_HISTORY_DAYS = 21

const ACUTE_DAYS = 7
const CHRONIC_DAYS = 28

export interface LoadSummary {
  /** One entry per day for the whole window, oldest first, gaps included. */
  daily: DayLoad[]
  /** Load over the last 7 days. */
  acute: number
  /** Average weekly load across the last 28 days. */
  chronic: number
  /** acute ÷ chronic, or null when there is not enough history to say. */
  ratio: number | null
  status: LoadStatus
  /**
   * Rolling windows, not calendar weeks — deliberately. A ramp is a ramp
   * whether or not a Monday fell in the middle of it, and waiting for a fresh
   * calendar week to notice a spike would mean noticing it up to six days late.
   * Anything on screen showing these must be labelled "last 7 days" rather than
   * "this week", or it will contradict the calendar-week bars beside it.
   */
  last7: number
  previous7: number
  /** Sessions in the window that were never rated. */
  unrated: number
  /** Sessions in the window, rated or not. */
  sessions: number
  /** Mean RPE of the rated sessions in the window, or null. */
  averageRpe: number | null
}

export const EMPTY_LOAD: LoadSummary = {
  daily: [],
  acute: 0,
  chronic: 0,
  ratio: null,
  status: 'settling',
  last7: 0,
  previous7: 0,
  unrated: 0,
  sessions: 0,
  averageRpe: null,
}

/** The RPE recorded against each session, by session id. */
export function rpeBySession(metrics: SessionMetric[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const metric of metrics) {
    if (metric.metricKey === METRIC_RPE) map.set(metric.sessionId, clampRpe(metric.metricValue))
  }
  return map
}

/** The metric key an RPE is stored under. Kept here beside the maths. */
export const METRIC_RPE = 'rpe'

function dayKeysEnding(today: Date, days: number): string[] {
  // Walked with `setDate` from local midnight, so a daylight-saving change
  // shifts the clock without ever skipping or repeating a calendar day.
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  cursor.setDate(cursor.getDate() - (days - 1))
  const keys: string[] = []
  for (let i = 0; i < days; i++) {
    keys.push(localDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

function dayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1))
  return `${date.getUTCDate()} ${date.toLocaleString('en', { month: 'short', timeZone: 'UTC' })}`
}

/**
 * @param windowDays how many days of history the chart shows. The acute and
 *                   chronic figures always use 7 and 28 regardless.
 */
export function computeLoad(
  sessions: Session[],
  metrics: SessionMetric[],
  today: Date = new Date(),
  windowDays = CHRONIC_DAYS,
): LoadSummary {
  if (sessions.length === 0) {
    return {
      ...EMPTY_LOAD,
      daily: dayKeysEnding(today, windowDays).map((date) => ({
        date,
        label: dayLabel(date),
        load: 0,
        sessions: 0,
        rated: 0,
      })),
    }
  }

  const rpes = rpeBySession(metrics)

  const byDay = new Map<string, { load: number; sessions: number; rated: number }>()
  let earliest = Infinity
  for (const session of sessions) {
    const startedAt = new Date(session.startedAt)
    const time = startedAt.getTime()
    if (Number.isFinite(time)) earliest = Math.min(earliest, time)

    const key = localDateKey(startedAt)
    const rpe = rpes.get(session.id) ?? null
    const bucket = byDay.get(key) ?? { load: 0, sessions: 0, rated: 0 }
    bucket.load += sessionLoad(session.durationSec, rpe)
    bucket.sessions += 1
    if (rpe !== null) bucket.rated += 1
    byDay.set(key, bucket)
  }

  const span = Math.max(windowDays, CHRONIC_DAYS + ACUTE_DAYS)
  const allKeys = dayKeysEnding(today, span)
  const loadFor = (key: string) => byDay.get(key)?.load ?? 0

  const acute = allKeys.slice(-ACUTE_DAYS).reduce((sum, key) => sum + loadFor(key), 0)
  const previous7 = allKeys
    .slice(-(ACUTE_DAYS * 2), -ACUTE_DAYS)
    .reduce((sum, key) => sum + loadFor(key), 0)
  const chronicTotal = allKeys.slice(-CHRONIC_DAYS).reduce((sum, key) => sum + loadFor(key), 0)
  const chronic = Math.round(chronicTotal / (CHRONIC_DAYS / ACUTE_DAYS))

  const historyDays = Number.isFinite(earliest)
    ? Math.floor((today.getTime() - earliest) / 86_400_000)
    : 0
  const ratio = historyDays >= MIN_HISTORY_DAYS && chronic > 0 ? acute / chronic : null

  const windowKeys = allKeys.slice(-windowDays)
  const daily: DayLoad[] = windowKeys.map((date) => {
    const bucket = byDay.get(date)
    return {
      date,
      label: dayLabel(date),
      load: bucket?.load ?? 0,
      sessions: bucket?.sessions ?? 0,
      rated: bucket?.rated ?? 0,
    }
  })

  const inWindow = new Set(windowKeys)
  let windowSessions = 0
  let windowUnrated = 0
  let rpeTotal = 0
  let rpeCount = 0
  for (const session of sessions) {
    if (!inWindow.has(localDateKey(new Date(session.startedAt)))) continue
    windowSessions += 1
    const rpe = rpes.get(session.id)
    if (rpe === undefined) windowUnrated += 1
    else {
      rpeTotal += rpe
      rpeCount += 1
    }
  }

  return {
    daily,
    acute,
    chronic,
    ratio,
    status: statusFor(ratio),
    last7: acute,
    previous7,
    unrated: windowUnrated,
    sessions: windowSessions,
    averageRpe: rpeCount > 0 ? Math.round((rpeTotal / rpeCount) * 10) / 10 : null,
  }
}

export function statusFor(ratio: number | null): LoadStatus {
  if (ratio === null) return 'settling'
  if (ratio < RATIO_LOW) return 'detraining'
  if (ratio <= RATIO_HIGH) return 'steady'
  if (ratio <= RATIO_SPIKE) return 'building'
  return 'spiking'
}

/**
 * How much room is left this week before the ramp gets steep — the practical
 * question behind the ratio. Null whenever the ratio itself is not trustworthy.
 */
export function loadHeadroom(summary: LoadSummary): number | null {
  if (summary.ratio === null || summary.chronic <= 0) return null
  return Math.max(0, Math.round(summary.chronic * RATIO_HIGH - summary.acute))
}
