/**
 * The court model: which target zones exist, where they sit on the board, and
 * how each one is announced by voice, tone and haptics.
 *
 * Coordinates are normalised to the court rectangle drawn by the board —
 * (0,0) is the net-side left corner, (1,1) the rear-side right corner. The
 * player is assumed to be defending this half, viewed from behind.
 */

export type CornerId =
  | 'net-left'
  | 'net-center'
  | 'net-right'
  | 'mid-left'
  | 'mid-right'
  | 'rear-left'
  | 'rear-center'
  | 'rear-right'

export type CourtRow = 'net' | 'mid' | 'rear'
export type CourtSide = 'left' | 'center' | 'right'

/** Number of target zones on the board. */
export type CourtLayout = 4 | 6 | 8

export interface CornerDef {
  id: CornerId
  row: CourtRow
  side: CourtSide
  /** Normalised position on the court rectangle. */
  x: number
  y: number
  /** Spoken by speechSynthesis, e.g. "net left". */
  spoken: string
  /** Two-line board label, e.g. ["NET", "LEFT"]. */
  label: [string, string]
  /** Screen-reader / tooltip description. */
  description: string
}

/**
 * Front is high, back is low — an intuitive mapping the ear learns in a
 * couple of rounds. Left/right is carried by stereo panning instead of pitch
 * so the three row tones stay far apart and unmistakable.
 */
export const ROW_TONE_HZ: Record<CourtRow, number> = {
  net: 1244.5,
  mid: 830.6,
  rear: 554.4,
}

/** Distinct buzz per row, so the wrist alone tells you front / middle / back. */
export const ROW_VIBRATION: Record<CourtRow, number[]> = {
  net: [30],
  mid: [30, 70, 30],
  rear: [110],
}

export const SIDE_PAN: Record<CourtSide, number> = {
  left: -0.8,
  center: 0,
  right: 0.8,
}

const DEF = (
  id: CornerId,
  row: CourtRow,
  side: CourtSide,
  x: number,
  y: number,
  spoken: string,
  label: [string, string],
  description: string,
): CornerDef => ({ id, row, side, x, y, spoken, label, description })

export const CORNERS: Record<CornerId, CornerDef> = {
  'net-left': DEF(
    'net-left',
    'net',
    'left',
    0.24,
    0.17,
    'net left',
    ['NET', 'LEFT'],
    'Front left corner — lunge to the net',
  ),
  'net-center': DEF(
    'net-center',
    'net',
    'center',
    0.5,
    0.13,
    'net centre',
    ['NET', 'CENTRE'],
    'Front centre — straight lunge to the net',
  ),
  'net-right': DEF(
    'net-right',
    'net',
    'right',
    0.76,
    0.17,
    'net right',
    ['NET', 'RIGHT'],
    'Front right corner — lunge to the net',
  ),
  'mid-left': DEF(
    'mid-left',
    'mid',
    'left',
    0.12,
    0.5,
    'mid left',
    ['MID', 'LEFT'],
    'Mid court left — sideways lunge to the drive',
  ),
  'mid-right': DEF(
    'mid-right',
    'mid',
    'right',
    0.88,
    0.5,
    'mid right',
    ['MID', 'RIGHT'],
    'Mid court right — sideways lunge to the drive',
  ),
  'rear-left': DEF(
    'rear-left',
    'rear',
    'left',
    0.24,
    0.85,
    'rear left',
    ['REAR', 'LEFT'],
    'Rear left corner — chassé back and scissor jump',
  ),
  'rear-center': DEF(
    'rear-center',
    'rear',
    'center',
    0.5,
    0.89,
    'rear centre',
    ['REAR', 'CENTRE'],
    'Rear centre — jump smash and recover',
  ),
  'rear-right': DEF(
    'rear-right',
    'rear',
    'right',
    0.76,
    0.85,
    'rear right',
    ['REAR', 'RIGHT'],
    'Rear right corner — chassé back and scissor jump',
  ),
}

/**
 * Zones in numbered order (reading order: front to back, left to right), so
 * Number mode and Sequential mode reinforce the same mental map.
 */
const LAYOUTS: Record<CourtLayout, CornerId[]> = {
  4: ['net-left', 'net-right', 'rear-left', 'rear-right'],
  6: ['net-left', 'net-right', 'mid-left', 'mid-right', 'rear-left', 'rear-right'],
  8: [
    'net-left',
    'net-center',
    'net-right',
    'mid-left',
    'mid-right',
    'rear-left',
    'rear-center',
    'rear-right',
  ],
}

export function cornerIdsForLayout(layout: CourtLayout): CornerId[] {
  return [...LAYOUTS[layout]]
}

export function cornersForLayout(layout: CourtLayout): CornerDef[] {
  return LAYOUTS[layout].map((id) => CORNERS[id])
}

/** 1-based zone number within a layout, or 0 if the corner is not in it. */
export function cornerNumber(layout: CourtLayout, id: CornerId): number {
  return LAYOUTS[layout].indexOf(id) + 1
}

/** Where the player returns to between shots. */
export const BASE_POSITION = { x: 0.5, y: 0.56 } as const

export function isCornerInLayout(layout: CourtLayout, id: CornerId): boolean {
  return LAYOUTS[layout].includes(id)
}
