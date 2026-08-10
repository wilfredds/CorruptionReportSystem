import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_CUE_PREFERENCES, type CuePreferences } from '@/lib/audio/cues'
import { MAX_SPLIT_STEP_LEAD_MS, MIN_SPLIT_STEP_LEAD_MS } from '@/lib/timer/plan'
import { clamp } from '@/lib/utils'

interface CueStore extends CuePreferences {
  set<K extends keyof CuePreferences>(key: K, value: CuePreferences[K]): void
  reset(): void
}

/**
 * How the app sounds. Persisted, because nobody wants to re-enable haptics
 * before every session.
 */
export const useCueStore = create<CueStore>()(
  persist(
    (set) => ({
      ...DEFAULT_CUE_PREFERENCES,
      set: (key, value) =>
        set(() => ({
          [key]:
            key === 'splitStepLeadMs'
              ? clamp(value as number, MIN_SPLIT_STEP_LEAD_MS, MAX_SPLIT_STEP_LEAD_MS)
              : value,
        })),
      reset: () => set({ ...DEFAULT_CUE_PREFERENCES }),
    }),
    {
      name: 'rallyready.cue-preferences',
      version: 1,
      // Never persist the transient announce flag: it belongs to the drill mode.
      partialize: ({ announceNumbers: _announceNumbers, ...rest }) => rest,
    },
  ),
)

export function selectCuePreferences(state: CueStore): CuePreferences {
  return {
    voiceEnabled: state.voiceEnabled,
    voiceRate: state.voiceRate,
    voiceUri: state.voiceUri,
    toneEnabled: state.toneEnabled,
    toneVolume: state.toneVolume,
    vibrationEnabled: state.vibrationEnabled,
    countdownEnabled: state.countdownEnabled,
    splitStepEnabled: state.splitStepEnabled,
    splitStepLeadMs: state.splitStepLeadMs,
    wakeLockEnabled: state.wakeLockEnabled,
    announceNumbers: state.announceNumbers,
  }
}
