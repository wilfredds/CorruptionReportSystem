import { Settings2 } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { isVibrationSupported } from '@/lib/audio/haptics'
import { isSpeechSupported } from '@/lib/audio/speech'
import { isAudioSupported } from '@/lib/audio/tones'
import { isWakeLockSupported } from '@/lib/audio/wakeLock'
import { MAX_SPLIT_STEP_LEAD_MS, MIN_SPLIT_STEP_LEAD_MS } from '@/lib/timer/plan'
import { useCueStore } from '@/store/cueStore'

interface ToggleRowProps {
  id: string
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  disabledHint?: string
}

function ToggleRow({ id, label, hint, checked, onChange, disabled, disabledHint }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <Label htmlFor={id} className={disabled ? 'text-muted-foreground' : undefined}>
          {label}
        </Label>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {disabled ? disabledHint : hint}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked && !disabled}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}

/**
 * Cue settings. Anything the device cannot do is shown disabled with the
 * reason, rather than hidden or — worse — offered and silently ignored.
 */
export function CueSettingsDialog() {
  const cues = useCueStore()

  // Capability checks are stable for the life of the page.
  const support = useMemo(
    () => ({
      speech: isSpeechSupported(),
      audio: isAudioSupported(),
      vibration: isVibrationSupported(),
      wakeLock: isWakeLockSupported(),
    }),
    [],
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Audio and cue settings">
          <Settings2 />
          <span className="sr-only">Audio and cue settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cues</DialogTitle>
          <DialogDescription>
            How the drill reaches you. Keep voice and tone on and you never need to look at the
            screen.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-border divide-y">
          <ToggleRow
            id="cue-voice"
            label="Spoken callouts"
            hint="Says the corner as it is called."
            checked={cues.voiceEnabled}
            onChange={(value) => cues.set('voiceEnabled', value)}
            disabled={!support.speech}
            disabledHint="This browser has no speech synthesis."
          />
          <ToggleRow
            id="cue-tone"
            label="Tones"
            hint="Pitch tells you the row, stereo position tells you the side."
            checked={cues.toneEnabled}
            onChange={(value) => cues.set('toneEnabled', value)}
            disabled={!support.audio}
            disabledHint="This browser has no Web Audio support."
          />
          <ToggleRow
            id="cue-vibration"
            label="Vibration"
            hint="A distinct buzz per row — net, mid or rear."
            checked={cues.vibrationEnabled}
            onChange={(value) => cues.set('vibrationEnabled', value)}
            disabled={!support.vibration}
            disabledHint="This device does not expose vibration to the browser."
          />
          <ToggleRow
            id="cue-countdown"
            label="Countdown into work"
            hint="Three beeps before every work block starts."
            checked={cues.countdownEnabled}
            onChange={(value) => cues.set('countdownEnabled', value)}
          />
          <ToggleRow
            id="cue-wakelock"
            label="Keep the screen awake"
            hint="Stops the phone sleeping mid-drill."
            checked={cues.wakeLockEnabled}
            onChange={(value) => cues.set('wakeLockEnabled', value)}
            disabled={!support.wakeLock}
            disabledHint="This browser has no Wake Lock API."
          />

          <ToggleRow
            id="cue-splitstep"
            label="Split-step tick"
            hint="A metronome tick just before each call, to train the timing of your split-step."
            checked={cues.splitStepEnabled}
            onChange={(value) => cues.set('splitStepEnabled', value)}
            disabled={!support.audio}
            disabledHint="Needs Web Audio, which this browser does not have."
          />

          {cues.splitStepEnabled && support.audio && (
            <div className="py-4">
              <div className="mb-2 flex items-baseline justify-between">
                <Label htmlFor="cue-lead">Tick lead time</Label>
                <span className="tnum text-muted-foreground text-sm">
                  {cues.splitStepLeadMs} ms before the call
                </span>
              </div>
              <Slider
                id="cue-lead"
                min={MIN_SPLIT_STEP_LEAD_MS}
                max={MAX_SPLIT_STEP_LEAD_MS}
                step={50}
                value={[cues.splitStepLeadMs]}
                onValueChange={([value]) => cues.set('splitStepLeadMs', value ?? 400)}
                aria-label="Split-step tick lead time in milliseconds"
              />
              <p className="text-muted-foreground mt-2 text-xs">
                Land the split-step as the call arrives. Around 300–500ms suits most players.
              </p>
            </div>
          )}

          {support.audio && (
            <div className="py-4">
              <div className="mb-2 flex items-baseline justify-between">
                <Label htmlFor="cue-volume">Tone volume</Label>
                <span className="tnum text-muted-foreground text-sm">
                  {Math.round(cues.toneVolume * 100)}%
                </span>
              </div>
              <Slider
                id="cue-volume"
                min={0}
                max={1}
                step={0.05}
                value={[cues.toneVolume]}
                onValueChange={([value]) => cues.set('toneVolume', value ?? 0.8)}
                aria-label="Tone volume"
              />
            </div>
          )}

          {support.speech && (
            <div className="py-4">
              <div className="mb-2 flex items-baseline justify-between">
                <Label htmlFor="cue-rate">Voice speed</Label>
                <span className="tnum text-muted-foreground text-sm">
                  {cues.voiceRate.toFixed(2)}×
                </span>
              </div>
              <Slider
                id="cue-rate"
                min={0.8}
                max={2}
                step={0.05}
                value={[cues.voiceRate]}
                onValueChange={([value]) => cues.set('voiceRate', value ?? 1.3)}
                aria-label="Voice speed"
              />
              <p className="text-muted-foreground mt-2 text-xs">
                Faster is better at short intervals — the call has to finish before you move.
              </p>
            </div>
          )}
        </div>

        <Button variant="ghost" onClick={cues.reset} className="self-start">
          Reset to defaults
        </Button>
      </DialogContent>
    </Dialog>
  )
}
