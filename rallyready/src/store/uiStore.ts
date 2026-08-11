import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiStore {
  /** The "set up your profile" prompt, once the user has said no thanks. */
  setupPromptDismissed: boolean
  dismissSetupPrompt(): void
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
    }),
    { name: 'rallyready.ui', version: 1 },
  ),
)
