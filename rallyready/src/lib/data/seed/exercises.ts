/**
 * The conditioning exercise catalogue (§4 Phase 3).
 *
 * Bundled with the app rather than stored, for the same reason the drills are:
 * this is reference content, not user data, and a circuit has to be runnable
 * in a garage with no signal.
 *
 * The brief asks for short demo clips. Curating vetted video is Phase 5, and
 * inventing links now would plant dead ones — so each exercise instead carries
 * a *schematic* demo the app can draw itself: a footfall pattern for ladder
 * work, and side-view keyframes for everything else. Both animate offline, and
 * for ladder patterns a diagram is arguably clearer than video anyway.
 */

export type ExerciseKind = 'ladder' | 'plyometric' | 'bodyweight'
export type Equipment = 'none' | 'ladder' | 'step'

/**
 * A foot on the ladder diagram. `x` runs across the ladder (-1 fully outside
 * left, ±0.28 inside, +1 outside right); `y` counts cells along it.
 */
export interface FootPose {
  x: number
  y: number
  /** Drawn small and faded — the foot is in the air at this moment. */
  lifted?: boolean
}

export interface FootFrame {
  left: FootPose
  right: FootPose
}

/**
 * A side-view pose, as parameters rather than coordinates, so one renderer
 * draws every exercise.
 */
export interface FigurePose {
  /** 0 standing tall … 1 deep squat. */
  squat: number
  /** 0 grounded … 1 peak of the jump. */
  air: number
  /** 0 legs under you … 1 knees to chest. */
  tuck: number
  /** -1 arms swung back … 1 arms driven forward and up. */
  arms: number
  /** Horizontal split of the feet: 0 together, 1 wide or staggered. */
  split: number
  /**
   * 0 = both legs mirror each other; 1 = a true lunge — front knee stacked
   * over the ankle, trailing knee dropped towards the floor. Without this a
   * lunge just renders as a wide stance.
   */
  lead?: number
  label: string
}

export interface Exercise {
  slug: string
  name: string
  kind: ExerciseKind
  equipment: Equipment
  /** One line, shown on the card during the workout. */
  summary: string
  cues: string[]
  faults: string[]
  /** What to do without the kit or the court. */
  substitute: string | null
  /** How much of it to do when practising the exercise on its own. */
  recommendedReps: string
  /** Ladder work only. */
  pattern?: FootFrame[]
  /** Everything else. */
  poses?: FigurePose[]
}

/* --------------------------------------------------------------- patterns */

const IN_AND_OUT: FootFrame[] = [
  { left: { x: -0.28, y: 0.5 }, right: { x: 0.28, y: 0.5 } },
  { left: { x: -1, y: 1 }, right: { x: 1, y: 1 } },
  { left: { x: -0.28, y: 1.5 }, right: { x: 0.28, y: 1.5 } },
  { left: { x: -1, y: 2 }, right: { x: 1, y: 2 } },
  { left: { x: -0.28, y: 2.5 }, right: { x: 0.28, y: 2.5 } },
  { left: { x: -1, y: 3 }, right: { x: 1, y: 3 } },
]

const LATERAL_SHUFFLE: FootFrame[] = [
  { left: { x: -0.3, y: -0.4 }, right: { x: 0.3, y: 0.5 } },
  { left: { x: -0.3, y: 0.5 }, right: { x: 0.3, y: 0.5 } },
  { left: { x: -0.3, y: 0.5 }, right: { x: 0.3, y: 1.5 } },
  { left: { x: -0.3, y: 1.5 }, right: { x: 0.3, y: 1.5 } },
  { left: { x: -0.3, y: 1.5 }, right: { x: 0.3, y: 2.5 } },
  { left: { x: -0.3, y: 2.5 }, right: { x: 0.3, y: 2.5 } },
]

const CROSSOVER: FootFrame[] = [
  { left: { x: -0.28, y: 0.5 }, right: { x: 1, y: 0.1 } },
  { left: { x: -1, y: 0.9 }, right: { x: 0.28, y: 0.6 } },
  { left: { x: -0.28, y: 1.5 }, right: { x: 1, y: 1.1 } },
  { left: { x: -1, y: 1.9 }, right: { x: 0.28, y: 1.6 } },
  { left: { x: -0.28, y: 2.5 }, right: { x: 1, y: 2.1 } },
  { left: { x: -1, y: 2.9 }, right: { x: 0.28, y: 2.6 } },
]

const HIGH_KNEES: FootFrame[] = [
  { left: { x: -0.28, y: 0.5 }, right: { x: 0.28, y: 0.2, lifted: true } },
  { left: { x: -0.28, y: 1.2, lifted: true }, right: { x: 0.28, y: 1.5 } },
  { left: { x: -0.28, y: 2.5 }, right: { x: 0.28, y: 2.2, lifted: true } },
  { left: { x: -0.28, y: 3.2, lifted: true }, right: { x: 0.28, y: 3.5 } },
]

/* ------------------------------------------------------------------ poses */

const pose = (
  label: string,
  squat: number,
  air: number,
  tuck: number,
  arms: number,
  split = 0,
  lead = 0,
): FigurePose => ({ label, squat, air, tuck, arms, split, lead })

/* -------------------------------------------------------------- catalogue */

export const EXERCISES: Exercise[] = [
  {
    slug: 'ladder-in-out',
    name: 'In and out',
    kind: 'ladder',
    equipment: 'ladder',
    summary: 'Two feet in the cell, two feet out astride it. Straight up the ladder.',
    cues: [
      'Stay on the balls of your feet — heels never touch down.',
      'Small, fast steps. The ladder rewards frequency, not stride length.',
      'Arms drive as if you were running; they set the rhythm for the feet.',
      'Look up the ladder, not down at it.',
    ],
    faults: [
      'Watching your feet, which drops the chest and slows everything down.',
      'Landing flat and heavy instead of springing off the forefoot.',
      'Widening the "out" step so far that the next "in" step is a lunge.',
    ],
    substitute: 'No ladder? Chalk or tape eight 40cm squares, or just imagine the rungs.',
    recommendedReps:
      '4 lengths of the ladder, walking back between each. Stop when the feet get heavy.',
    pattern: IN_AND_OUT,
  },
  {
    slug: 'ladder-lateral-shuffle',
    name: 'Lateral shuffle',
    kind: 'ladder',
    equipment: 'ladder',
    summary: 'Side-on to the ladder. Lead foot in, trail foot follows, move along.',
    cues: [
      'Stay side-on the whole way — the hips never turn to face the ladder.',
      'Push off the trailing foot rather than reaching with the lead one.',
      'Keep a low, athletic base; this is the shape you defend a smash in.',
      'Come back the other way so both sides lead.',
    ],
    faults: [
      'Crossing the feet, which is a different drill and a rolled ankle waiting.',
      'Standing up tall between cells and losing the loaded position.',
      'Only ever leading with the same foot.',
    ],
    substitute: 'Tape a line of squares, or shuffle between two markers about 4m apart.',
    recommendedReps: '3 lengths leading with each foot, walking back between each.',
    pattern: LATERAL_SHUFFLE,
  },
  {
    slug: 'ladder-crossover',
    name: 'Crossover',
    kind: 'ladder',
    equipment: 'ladder',
    summary: 'One foot in, the other crosses over behind. The classic icky shuffle.',
    cues: [
      'The crossing foot goes over and in front, not around the back.',
      'Rotate through the hips, not the shoulders.',
      'Build the rhythm slowly before you chase speed — this one rewards patience.',
    ],
    faults: [
      'Turning the whole body instead of letting the hips rotate underneath.',
      'Rushing before the pattern is automatic, and tangling the feet.',
    ],
    substitute: 'Tape or chalk works fine. This pattern is about coordination, not the kit.',
    recommendedReps: '3 lengths in each direction. Slow it down until the pattern is right.',
    pattern: CROSSOVER,
  },
  {
    slug: 'ladder-high-knees',
    name: 'High knees',
    kind: 'ladder',
    equipment: 'ladder',
    summary: 'One foot per cell, knees driven high, as fast as you can hold form.',
    cues: [
      'Drive the knee to hip height; the foot follows the knee.',
      'Ground contact should be almost silent and almost instant.',
      'Stay tall — chest up, hips forward, no leaning back.',
    ],
    faults: [
      'Leaning back to get the knees up, which stalls the whole drill.',
      'Slowing the cadence to get the knees higher. Cadence wins.',
    ],
    substitute: 'Run them on the spot with a marker line, or over eight taped squares.',
    recommendedReps: '4 lengths, flat out, with a full walk back. This one is a sprint.',
    pattern: HIGH_KNEES,
  },

  {
    slug: 'plyo-jump-squat',
    name: 'Jump squats',
    kind: 'plyometric',
    equipment: 'none',
    summary: 'Squat to about parallel, drive up and out of the floor, land soft.',
    cues: [
      'Sit back into the hips before you jump — this is not a bounce.',
      'Swing the arms up as you drive; they are worth height for free.',
      'Land through the whole foot and absorb straight into the next rep.',
      'Knees track over the toes, never inside them.',
    ],
    faults: [
      'Landing stiff-legged, which turns a power drill into an impact drill.',
      'Getting shallower every rep as fatigue arrives.',
      'Letting the knees collapse inwards on landing.',
    ],
    substitute: null,
    recommendedReps: '3 rounds of 8–10, fully recovered between rounds.',
    poses: [
      pose('Load', 0.85, 0, 0, -0.8, 0.35),
      pose('Drive', 0.1, 0.75, 0, 1, 0.25),
      pose('Land', 0.6, 0, 0, -0.2, 0.35),
    ],
  },
  {
    slug: 'plyo-tuck-jump',
    name: 'Tuck jumps',
    kind: 'plyometric',
    equipment: 'none',
    summary: 'Jump from a quarter squat and pull both knees to your chest.',
    cues: [
      'Jump first, tuck second. Tucking early costs you height.',
      'Pull the knees up rather than reaching the chest down.',
      'Land in the same square metre you left from.',
    ],
    faults: [
      'Folding at the waist to meet the knees, which is not the same movement.',
      'Drifting forwards rep by rep until you are travelling across the room.',
    ],
    substitute: 'Swap for jump squats if the ceiling is low or the knees are complaining.',
    recommendedReps: '3 rounds of 6–8. Quality drops fast; stop the round when it does.',
    poses: [
      pose('Dip', 0.55, 0, 0, -0.7, 0.2),
      pose('Tuck', 0.15, 1, 1, 0.5, 0.1),
      pose('Land', 0.5, 0, 0, -0.1, 0.25),
    ],
  },
  {
    slug: 'plyo-split-jump',
    name: 'Split jumps',
    kind: 'plyometric',
    equipment: 'none',
    summary: 'Lunge, jump, swap legs in the air, land in the opposite lunge.',
    cues: [
      'This is the scissor action from a jump smash — treat it like technique.',
      'Back knee tracks down, not forward over the toes.',
      'Land on the whole front foot and absorb before the next jump.',
      'Chest stays up throughout; the torso does not pitch forward.',
    ],
    faults: [
      'Shortening the lunge as you tire so the legs barely swap.',
      'Crashing the back knee into the floor.',
    ],
    substitute: 'Step back into the lunge instead of jumping if the knees need a break.',
    recommendedReps: '3 rounds of 10 (5 each leg), landing softly every time.',
    poses: [
      pose('Lunge', 0.8, 0, 0, -0.5, 1, 1),
      pose('Swap', 0.15, 0.8, 0.2, 0.8, 0.3),
      pose('Land', 0.8, 0, 0, -0.3, 1, 1),
    ],
  },
  {
    slug: 'plyo-lateral-bound',
    name: 'Lateral bounds',
    kind: 'plyometric',
    equipment: 'none',
    summary: 'Push sideways off one leg, land on the other, hold the landing a beat.',
    cues: [
      'This is the push that gets you to a wide net shot. Drive sideways, not up.',
      'Land on one leg and stick it for a beat before bounding back.',
      'Let the hip and knee bend absorb the landing — do not fight it.',
    ],
    faults: [
      'Bouncing straight back without controlling the landing.',
      'Jumping upwards instead of across.',
    ],
    substitute: 'Shorten the bound in a tight space. Distance is adjustable, quality is not.',
    recommendedReps: '3 rounds of 10 (5 each side), holding the landing for a beat.',
    poses: [
      pose('Load', 0.75, 0, 0, -0.6, 0.6),
      pose('Bound', 0.25, 0.5, 0, 0.7, 1),
      pose('Stick', 0.7, 0, 0, 0, 0.8, 0.6),
    ],
  },
  {
    slug: 'plyo-step-jump',
    name: 'Step jumps',
    kind: 'plyometric',
    equipment: 'step',
    summary: 'Jump up onto a low step or box, stand tall, step back down.',
    cues: [
      'Step down, never jump down — the landing is where injuries come from.',
      'Land quietly on the box with soft knees and the whole foot on it.',
      'Pick a height you can clear comfortably when tired, not when fresh.',
    ],
    faults: [
      'Choosing a box that is too high and scraping the shins.',
      'Jumping back down to save time.',
    ],
    substitute: 'No box? Jump squats train the same drive without the trip hazard.',
    recommendedReps: '3 rounds of 8–10, stepping down rather than jumping down.',
    poses: [
      pose('Load', 0.8, 0, 0, -0.8, 0.3),
      pose('Up', 0.2, 0.65, 0.35, 0.9, 0.2),
      pose('Stand', 0.15, 0.2, 0, 0.1, 0.2),
    ],
  },

  {
    slug: 'shadow-lunge',
    name: 'Net lunges',
    kind: 'bodyweight',
    equipment: 'none',
    summary: 'Alternating forward lunges with a shadow net shot at full reach.',
    cues: [
      'Racket leg leads and the racket arm reaches with it.',
      'Drive back out with the front leg — the back leg is a brake.',
      'Knee over the ankle, chest up, eyes forward.',
    ],
    faults: [
      'Letting the front knee travel past the toes.',
      'Standing up out of the lunge before pushing back.',
    ],
    substitute: null,
    recommendedReps: '3 rounds of 30 seconds, alternating corners.',
    poses: [
      pose('Ready', 0.3, 0, 0, 0.2, 0.2),
      pose('Lunge', 0.85, 0, 0, 1, 1, 1),
      pose('Recover', 0.5, 0, 0, 0.5, 0.55, 0.5),
    ],
  },
  {
    slug: 'core-plank-reach',
    name: 'Plank shoulder taps',
    kind: 'bodyweight',
    equipment: 'none',
    summary: 'High plank, tap the opposite shoulder, keep the hips still.',
    cues: [
      'Widen the feet — a wider base makes the hips easier to keep level.',
      'Move slowly. The point is resisting rotation, not counting taps.',
      'Squeeze the glutes and brace as if about to take a hit to the stomach.',
    ],
    faults: [
      'Rocking the hips side to side, which removes the entire challenge.',
      'Racing through the taps.',
    ],
    substitute: 'Drop to your knees and keep the hips level rather than sagging.',
    recommendedReps: '3 rounds of 30–40 seconds, hips level throughout.',
    poses: [
      pose('Plank', 0.95, 0, 0.15, -0.35, 0.7),
      pose('Tap', 0.95, 0, 0.15, 0.85, 0.7),
      pose('Return', 0.95, 0, 0.15, -0.35, 0.7),
    ],
  },
]

export function findExercise(slug: string): Exercise | undefined {
  return EXERCISES.find((exercise) => exercise.slug === slug)
}
