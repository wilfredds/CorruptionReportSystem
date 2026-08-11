import { ROW_TONE_HZ, SIDE_PAN, type CourtRow, type CourtSide } from '@/lib/timer/corners'

/**
 * Web Audio cues. Every call gets a tone as well as a voice, so the drill is
 * followable even if speech synthesis is unavailable or too slow on a device.
 *
 * The mapping is deliberately learnable: pitch tells you the row (front is
 * high, back is low) and stereo position tells you the side. After a couple of
 * rounds the tone alone is enough and the voice becomes confirmation.
 *
 * Nothing is created until the user starts a drill — an AudioContext built at
 * page load would interrupt whatever they are listening to for no reason.
 */

interface ToneSpec {
  frequency: number
  durationMs: number
  /** -1 hard left … 1 hard right */
  pan?: number
  gain?: number
  type?: OscillatorType
  /** Delay before the tone starts, for multi-note cues. */
  delayMs?: number
}

let context: AudioContext | null = null
let master: GainNode | null = null
let volume = 0.8

type AudioContextCtor = typeof AudioContext

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { webkitAudioContext?: AudioContextCtor }
  return window.AudioContext ?? w.webkitAudioContext ?? null
}

export function isAudioSupported(): boolean {
  return audioContextCtor() !== null
}

/**
 * Must be called from inside a user gesture. Safari and Chrome both start an
 * AudioContext suspended otherwise, and every tone would silently do nothing.
 */
export async function unlockAudio(): Promise<boolean> {
  const Ctor = audioContextCtor()
  if (!Ctor) return false
  try {
    if (!context) {
      context = new Ctor()
      master = context.createGain()
      master.gain.value = volume
      master.connect(context.destination)
    }
    if (context.state === 'suspended') await context.resume()
    return context.state === 'running'
  } catch {
    return false
  }
}

export function setToneVolume(next: number): void {
  volume = Math.min(1, Math.max(0, next))
  if (master && context) master.gain.setValueAtTime(volume, context.currentTime)
}

export function closeAudio(): void {
  try {
    void context?.close()
  } catch {
    /* nothing to do */
  }
  context = null
  master = null
}

function play(spec: ToneSpec): void {
  if (!context || !master || context.state !== 'running') return
  try {
    const start = context.currentTime + (spec.delayMs ?? 0) / 1000
    const duration = spec.durationMs / 1000
    const peak = spec.gain ?? 0.35

    const oscillator = context.createOscillator()
    oscillator.type = spec.type ?? 'sine'
    oscillator.frequency.setValueAtTime(spec.frequency, start)

    // A short attack and an exponential tail: a raw gate would click.
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(peak, start + 0.008)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    let tail: AudioNode = envelope
    if (spec.pan !== undefined && typeof context.createStereoPanner === 'function') {
      const panner = context.createStereoPanner()
      panner.pan.setValueAtTime(spec.pan, start)
      envelope.connect(panner)
      tail = panner
    }

    oscillator.connect(envelope)
    tail.connect(master)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  } catch {
    /* a failed tone is never worth interrupting a drill for */
  }
}

/* ------------------------------------------------------------------- cues */

/**
 * A corner call. Feints use this too, and deliberately sound identical — a
 * fake you can hear coming is not a fake, and the drill would train nothing.
 */
export function playCornerTone(row: CourtRow, side: CourtSide): void {
  play({
    frequency: ROW_TONE_HZ[row],
    durationMs: 150,
    pan: SIDE_PAN[side],
    gain: 0.4,
  })
}

/** The metronome tick that trains split-step timing. Quiet and dry. */
export function playSplitStepTick(): void {
  play({ frequency: 2100, durationMs: 28, gain: 0.16, type: 'triangle', pan: 0 })
}

/** Rising blips into a work block: 3 … 2 … 1. */
export function playCountdownTone(secondsLeft: number): void {
  const pitches: Record<number, number> = { 3: 622, 2: 740, 1: 880 }
  play({ frequency: pitches[secondsLeft] ?? 660, durationMs: 110, gain: 0.3, pan: 0 })
}

/** Two-note rise for "go", fall for "recover". */
export function playPhaseTone(kind: 'work' | 'rest' | 'cooldown'): void {
  if (kind === 'work') {
    play({ frequency: 660, durationMs: 110, gain: 0.34, pan: 0 })
    play({ frequency: 990, durationMs: 160, gain: 0.34, pan: 0, delayMs: 105 })
    return
  }
  play({ frequency: 620, durationMs: 130, gain: 0.28, pan: 0 })
  play({ frequency: 415, durationMs: 200, gain: 0.28, pan: 0, delayMs: 125 })
}

/** Session finished: a small ascending arpeggio. */
export function playCompleteTone(): void {
  play({ frequency: 523.25, durationMs: 140, gain: 0.3, pan: 0 })
  play({ frequency: 659.25, durationMs: 140, gain: 0.3, pan: 0, delayMs: 130 })
  play({ frequency: 783.99, durationMs: 320, gain: 0.32, pan: 0, delayMs: 260 })
}
