import { ROW_VIBRATION, type CourtRow } from '@/lib/timer/corners'

/**
 * Vibration cues. A distinct buzz per court row means the wrist alone can tell
 * you front, middle or back — useful with a phone in a pocket, and the third
 * channel that makes eyes-free training work when a room is loud.
 *
 * Unsupported on desktop and on iOS Safari; every call is a no-op there.
 */

export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

function buzz(pattern: number | number[]): void {
  if (!isVibrationSupported()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* some browsers throw when the page is not visible */
  }
}

export function vibrateCorner(row: CourtRow): void {
  buzz(ROW_VIBRATION[row])
}

export function vibrateCountdown(): void {
  buzz(20)
}

/**
 * The lightest buzz the API can express, for a tap that changed something.
 *
 * Deliberately far shorter than any drill cue: a navigation tap must never be
 * mistakeable for a corner call. Callers gate this on the same `vibrationEnabled`
 * preference as the cues — somebody who turned vibration off meant all of it.
 */
export function vibrateTap(): void {
  buzz(8)
}

export function vibrateComplete(): void {
  buzz([80, 60, 80, 60, 180])
}

export function stopVibration(): void {
  buzz(0)
}
