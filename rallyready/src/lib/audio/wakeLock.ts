/**
 * Screen Wake Lock.
 *
 * A phone propped against a wall will sleep 30 seconds into a drill and take
 * the visual board with it. The lock is also dropped by the browser whenever
 * the tab is hidden, so it has to be re-acquired when the user comes back.
 *
 * Unsupported on iOS below 16.4 and in some webviews — the drill still runs,
 * the screen just dims (§6: feature-detect and degrade).
 */

type WakeLockSentinelLike = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

export class WakeLockManager {
  #sentinel: WakeLockSentinelLike | null = null
  #wanted = false
  #onVisibility: (() => void) | null = null

  get active(): boolean {
    return this.#sentinel !== null && !this.#sentinel.released
  }

  async acquire(): Promise<boolean> {
    this.#wanted = true
    const ok = await this.#request()
    if (this.#onVisibility === null) {
      this.#onVisibility = () => {
        if (this.#wanted && document.visibilityState === 'visible') void this.#request()
      }
      document.addEventListener('visibilitychange', this.#onVisibility)
    }
    return ok
  }

  async release(): Promise<void> {
    this.#wanted = false
    if (this.#onVisibility) {
      document.removeEventListener('visibilitychange', this.#onVisibility)
      this.#onVisibility = null
    }
    try {
      await this.#sentinel?.release()
    } catch {
      /* already gone */
    }
    this.#sentinel = null
  }

  async #request(): Promise<boolean> {
    if (this.active) return true
    const nav = navigator as WakeLockNavigator
    if (!nav.wakeLock) return false
    try {
      const sentinel = await nav.wakeLock.request('screen')
      sentinel.addEventListener('release', () => {
        if (this.#sentinel === sentinel) this.#sentinel = null
      })
      this.#sentinel = sentinel
      return true
    } catch {
      // Thrown when the document is hidden or the OS refuses (low battery).
      return false
    }
  }
}
