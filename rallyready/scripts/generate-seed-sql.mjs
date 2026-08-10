/**
 * Regenerates the drill seed block inside supabase/schema.sql from the
 * bundled TypeScript catalogue.
 *
 *   node --experimental-strip-types scripts/generate-seed-sql.mjs
 *   (or: npm run seed:sql)
 *
 * The client ships the catalogue so a fresh install works offline, and Postgres
 * needs the same rows. Maintaining both by hand drifts — it already did once —
 * so the TypeScript file is the source of truth and the SQL is derived from it.
 *
 * Node strips the types itself; the catalogue is plain data with a single
 * type-only import, so there is nothing to transpile.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SCHEMA = join(ROOT, 'supabase', 'schema.sql')
const START = '-- >>> generated from src/lib/data/seed/drills.ts — do not edit by hand'
const END = '-- <<< end generated drill seed'

const { SEED_DRILLS } = await import('../src/lib/data/seed/drills.ts')

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`
const textArray = (values) =>
  values.length === 0 ? `'{}'` : `array[\n      ${values.map(quote).join(',\n      ')}\n    ]`
const jsonOrNull = (value) => (value === null ? 'null' : `${quote(JSON.stringify(value))}::jsonb`)

const COLUMNS = [
  'slug',
  'name',
  'category',
  'mode',
  'description',
  'coaching_cues',
  'common_faults',
  'default_work_sec',
  'default_rest_sec',
  'default_rounds',
  'corners',
  'default_interval_ms',
  'default_call_mode',
  'enabled_corners',
  'default_warmup_sec',
  'default_cooldown_sec',
  'level',
  'is_public',
  'circuit',
  'circuit_rounds',
  'location',
  'equipment',
]

function row(drill) {
  return `(
  ${quote(drill.slug)}, ${quote(drill.name)}, ${quote(drill.category)}, ${quote(drill.style)},
  ${quote(drill.description)},
  ${textArray(drill.coachingCues)},
  ${textArray(drill.commonFaults)},
  ${drill.defaultWorkSec}, ${drill.defaultRestSec}, ${drill.defaultRounds}, ${drill.corners},
  ${drill.defaultIntervalMs}, ${quote(drill.defaultCallMode)},
  ${drill.enabledCorners === null ? 'null' : textArray(drill.enabledCorners)},
  ${drill.defaultWarmupSec}, ${drill.defaultCooldownSec}, ${quote(drill.level)}, ${drill.isPublic},
  ${jsonOrNull(drill.circuit)}, ${drill.circuitRounds}, ${quote(drill.location)},
  ${textArray(drill.equipment)}
)`
}

const updates = COLUMNS.filter((column) => column !== 'slug')
  .map((column) => `  ${column.padEnd(20)} = excluded.${column}`)
  .join(',\n')

const sql = `${START}
insert into public.drills (
  ${COLUMNS.join(', ')}
) values
${SEED_DRILLS.map(row).join(',\n')}
on conflict (slug) do update set
${updates};
${END}`

const schema = readFileSync(SCHEMA, 'utf8')
const startAt = schema.indexOf(START)
const endAt = schema.indexOf(END)
if (startAt === -1 || endAt === -1) {
  throw new Error(`Could not find the generated block markers in ${SCHEMA}`)
}

writeFileSync(SCHEMA, schema.slice(0, startAt) + sql + schema.slice(endAt + END.length))
console.log(`wrote ${SEED_DRILLS.length} drills into supabase/schema.sql`)
