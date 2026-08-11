import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    }),
    { name: 'rallyready.ui', version: 2 },
  ),
)

/** True if a warm-up finished recently enough to still count. */
export function isStillWarm(lastWarmupAt: number | null, now = Date.now()): boolean {
  if (lastWarmupAt === null) return false
  return now - lastWarmupAt < WARM_FOR_MS
}
