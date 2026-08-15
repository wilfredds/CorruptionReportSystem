import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Adjustment } from '@/lib/data/readiness'
import type { SkillLevel } from '@/lib/data/types'

/**
 * A warm-up is good for about this long. Past it you have cooled down and the
 * prompt comes back; inside it, the app stops asking. Roughly the window the
 * sports-science literature gives for the raised muscle temperature that makes
 * a warm-up worth doing at all.
 */
export const WARM_FOR_MS = 45 * 60 * 1000

interface UiStore {
  /** The "set up your profile" prompt, once the user has said no thanks. */
  setupPromptDismissed: boolean
  dismissSetupPrompt(): void
  /** When the last warm-up finished, so the app can stop nagging. */
  lastWarmupAt: number | null
  markWarmedUp(): void
  /**
   * The auto-regulation the player accepted, and the day they accepted it for.
   * Dated rather than timed: an adjustment is a decision about today, and it
   * has to expire on its own overnight instead of quietly lightening tomorrow.
   */
  adjustment: Adjustment | null
  adjustmentDate: string | null
  setAdjustment(adjustment: Adjustment | null, date: string): void
  /**
   * The level the catalogue is filtered to. Null means "follow my profile" —
   * once the player picks one here, their choice wins, because browsing above
   * your level to see what is coming is a legitimate thing to want.
   */
  browseLevel: SkillLevel | null
  setBrowseLevel(level: SkillLevel | null): void
}

/**
 * Small persisted bits of UI state that are not settings and not data.
 *
 * A prompt you cannot dismiss is a nag, and a nag that reappears on every visit
 * teaches people to ignore that part of the screen.
 */
export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      setupPromptDismissed: false,
      dismissSetupPrompt: () => set({ setupPromptDismissed: true }),
      lastWarmupAt: null,
      markWarmedUp: () => set({ lastWarmupAt: Date.now() }),
      adjustment: null,
      adjustmentDate: null,
      setAdjustment: (adjustment, date) =>
        set({ adjustment, adjustmentDate: adjustment === null ? null : date }),
      browseLevel: null,
      setBrowseLevel: (browseLevel) => set({ browseLevel }),
    }),
    { name: 'rallyready.ui', version: 4 },
  ),
)

/** The accepted adjustment, but only while it is still today's. */
export function adjustmentFor(
  state: Pick<UiStore, 'adjustment' | 'adjustmentDate'>,
  today: string,
): Adjustment | null {
  if (state.adjustmentDate !== today) return null
  return state.adjustment
}

/** True if a warm-up finished recently enough to still count. */
export function isStillWarm(lastWarmupAt: number | null, now = Date.now()): boolean {
  if (lastWarmupAt === null) return false
  return now - lastWarmupAt < WARM_FOR_MS
}
