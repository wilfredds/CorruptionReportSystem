import type { Drill } from '@/lib/data/types'

import { cornerIdsForLayout, type CornerId, type CourtLayout } from './corners'
import { applyMode } from './sequencer'
import type { DrillMode, DrillPlan, SprintSet } from './types'

/**
 * The editable shape of a drill as the user configures it, and the bridge from
 * there to a `DrillPlan` the timeline builder understands.
 */

export interface DrillConfig {
  layout: CourtLayout
  enabledCorners: CornerId[]
  mode: DrillMode
  weights: Partial<Record<CornerId, number>>
  intervalMs: number
  workSec: number
  restSec: number
  rounds: number
  warmupSec: number
  cooldownSec: number
  prepareSec: number
  sprint: SprintSet | null
  avoidImmediateRepeat: boolean
  deceptionProbability: number
  deceptionGapMs: number
}

/** §4: shot interval adjustable from 0.8s to 3s — up to ~60 calls a minute. */
export const MIN_INTERVAL_MS = 800
export const MAX_INTERVAL_MS = 3000
export const INTERVAL_STEP_MS = 50

export const MIN_SPLIT_STEP_LEAD_MS = 200
export const MAX_SPLIT_STEP_LEAD_MS = 700

export const DEFAULT_PREPARE_SEC = 5

export function configFromDrill(drill: Drill): DrillConfig {
  return {
    layout: drill.corners,
    enabledCorners: drill.enabledCorners ?? cornerIdsForLayout(drill.corners),
    mode: drill.defaultCallMode,
    weights: {},
    intervalMs: drill.defaultIntervalMs,
    workSec: drill.defaultWorkSec,
    restSec: drill.defaultRestSec,
    rounds: drill.defaultRounds,
    warmupSec: drill.defaultWarmupSec,
    cooldownSec: drill.defaultCooldownSec,
    prepareSec: DEFAULT_PREPARE_SEC,
    sprint: null,
    avoidImmediateRepeat: true,
    deceptionProbability: 0.35,
    deceptionGapMs: 600,
  }
}

export function planFromConfig(
  config: DrillConfig,
  options: { splitStepLeadMs: number; seed: number },
): DrillPlan {
  const sequencer = applyMode(
    {
      layout: config.layout,
      enabled: config.enabledCorners,
      selection: 'random',
      weights: config.weights,
      avoidImmediateRepeat: config.avoidImmediateRepeat,
      deception: {
        enabled: false,
        probability: config.deceptionProbability,
        gapMs: config.deceptionGapMs,
      },
      announce: 'position',
    },
    config.mode,
  )

  return {
    prepareSec: config.prepareSec,
    warmupSec: config.warmupSec,
    rounds: config.rounds,
    workSec: config.workSec,
    restSec: config.restSec,
    intervalMs: config.intervalMs,
    cooldownSec: config.cooldownSec,
    splitStepLeadMs: options.splitStepLeadMs,
    sprint: config.sprint ?? undefined,
    seed: options.seed,
    sequencer,
  }
}

/* --------------------------------------------------------------- presets */

export interface DifficultyPreset {
  id: string
  label: string
  description: string
  intervalMs: number
  avoidImmediateRepeat: boolean
  deceptionProbability: number
}

/** §4: Beginner → Pro, adjusting pace and how unpredictable the caller is. */
export const DIFFICULTY_PRESETS: DifficultyPreset[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Two seconds a call. Time to reach the corner and recover properly.',
    intervalMs: 2000,
    avoidImmediateRepeat: true,
    deceptionProbability: 0.2,
  },
  {
    id: 'improver',
    label: 'Improver',
    description: 'Quicker, but still room for a full movement to every corner.',
    intervalMs: 1650,
    avoidImmediateRepeat: true,
    deceptionProbability: 0.25,
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Club pace. You will have to cut the recovery short to keep up.',
    intervalMs: 1350,
    avoidImmediateRepeat: true,
    deceptionProbability: 0.3,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Rally speed. Footwork has to be efficient or you fall behind.',
    intervalMs: 1100,
    avoidImmediateRepeat: true,
    deceptionProbability: 0.35,
  },
  {
    id: 'pro',
    label: 'Pro',
    description: 'Relentless, and zones can repeat — no pattern to lean on.',
    intervalMs: 880,
    avoidImmediateRepeat: false,
    deceptionProbability: 0.45,
  },
]

export interface StructurePreset {
  id: string
  label: string
  description: string
  workSec: number
  restSec: number
  rounds: number
}

/**
 * Work/rest shapes. The default mirrors measured singles match data —
 * ~5.5s rallies against ~11.4s between them, so roughly 1:2.
 */
export const STRUCTURE_PRESETS: StructurePreset[] = [
  {
    id: 'match-rhythm',
    label: 'Match rhythm',
    description: '6s on / 12s off × 12 — the real 1:2 rally-to-rest ratio.',
    workSec: 6,
    restSec: 12,
    rounds: 12,
  },
  {
    id: 'long-rally',
    label: 'Long rally',
    description: '10s on / 15s off × 10 — for the rallies that do not end.',
    workSec: 10,
    restSec: 15,
    rounds: 10,
  },
  {
    id: 'classic-shadow',
    label: 'Classic shadow',
    description: '30s on / 30s off × 6 — the traditional shadow set.',
    workSec: 30,
    restSec: 30,
    rounds: 6,
  },
  {
    id: 'tabata',
    label: 'Tabata',
    description: '20s on / 10s off × 8 — four brutal minutes.',
    workSec: 20,
    restSec: 10,
    rounds: 8,
  },
]

export function matchDifficulty(config: DrillConfig): DifficultyPreset | undefined {
  return DIFFICULTY_PRESETS.find(
    (preset) =>
      preset.intervalMs === config.intervalMs &&
      preset.avoidImmediateRepeat === config.avoidImmediateRepeat,
  )
}

export function matchStructure(config: DrillConfig): StructurePreset | undefined {
  return STRUCTURE_PRESETS.find(
    (preset) =>
      preset.workSec === config.workSec &&
      preset.restSec === config.restSec &&
      preset.rounds === config.rounds,
  )
}

/** Total wall-clock length of a configured drill, in seconds. */
export function estimateDurationSec(config: DrillConfig): number {
  const main = config.rounds * config.workSec + Math.max(0, config.rounds - 1) * config.restSec
  const sprint = config.sprint
    ? config.sprint.rounds * config.sprint.workSec +
      config.sprint.rounds * config.sprint.restSec
    : 0
  return config.prepareSec + config.warmupSec + main + sprint + config.cooldownSec
}
