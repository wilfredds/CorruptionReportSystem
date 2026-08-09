/**
 * Elapsed-time bookkeeping with pause/resume and seeking.
 *
 * The current time is always passed in rather than read from `performance.now`
 * inside, so the clock is deterministic under test and the caller controls the
 * time source (rAF timestamps in the app, plain numbers in specs).
 */
export class DrillClock {
  #originMs = 0
  #pausedAtMs: number | null = null
  #started = false

  start(nowMs: number): void {
    this.#originMs = nowMs
    this.#pausedAtMs = null
    this.#started = true
  }

  elapsed(nowMs: number): number {
    if (!this.#started) return 0
    const reference = this.#pausedAtMs ?? nowMs
    return Math.max(0, reference - this.#originMs)
  }

  pause(nowMs: number): void {
    if (this.#started && this.#pausedAtMs === null) this.#pausedAtMs = nowMs
  }

  resume(nowMs: number): void {
    if (this.#pausedAtMs === null) return
    // Shift the origin forward by however long we sat paused.
    this.#originMs += nowMs - this.#pausedAtMs
    this.#pausedAtMs = null
  }

  /** Jumps to an absolute elapsed value, preserving paused-ness. */
  seek(targetElapsedMs: number, nowMs: number): void {
    this.#originMs = nowMs - Math.max(0, targetElapsedMs)
    if (this.#pausedAtMs !== null) this.#pausedAtMs = nowMs
  }

  stop(): void {
    this.#started = false
    this.#pausedAtMs = null
  }

  get isPaused(): boolean {
    return this.#pausedAtMs !== null
  }

  get isStarted(): boolean {
    return this.#started
  }
}
