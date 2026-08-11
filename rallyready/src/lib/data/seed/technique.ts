import type { DrillCategory, DrillLocation, SkillLevel } from '../types'

/**
 * The technique reference (§4 Phase 5).
 *
 * The brief asks for a curated library "so you never have to go hunting on
 * YouTube". Curating third-party clips means vouching for them — that the link
 * resolves, that the channel is who it claims to be, and that the coaching is
 * sound. None of that can be checked from here, and a library of unverified
 * links is worse than none: it looks vetted and is not.
 *
 * So the reference is written rather than linked. Every topic below explains
 * one thing a solo player can actually work on, names the faults that make it
 * go wrong, and points at the drills that train it. `reference` is left on the
 * type for a curator who can vet clips properly; the UI renders it when it is
 * there.
 */

/** Whether a topic can be practised alone, or genuinely needs a feeder. */
export type PracticeMode = 'solo' | 'partner'

export interface TechniqueSection {
  heading: string
  body: string[]
}

export interface ExternalReference {
  title: string
  /** The organisation or coach responsible for it — always shown. */
  source: string
  url: string
}

export interface TechniqueTopic {
  slug: string
  title: string
  /** One sentence, shown on the card. */
  summary: string
  category: DrillCategory
  level: SkillLevel
  practiceMode: PracticeMode
  location: DrillLocation
  /** Honest reading time, used by the duration filter like a drill's length. */
  readMinutes: number
  sections: TechniqueSection[]
  cues: string[]
  faults: string[]
  /** Drills that train this, by slug. */
  drills: string[]
  reference?: ExternalReference
}

export const TECHNIQUE_TOPICS: TechniqueTopic[] = [
  {
    slug: 'the-split-step',
    title: 'The split step',
    summary:
      'The small hop that turns standing still into being ready to move. Get its timing right and everything else in your footwork gets easier.',
    category: 'footwork',
    level: 'beginner',
    practiceMode: 'solo',
    location: 'anywhere',
    readMinutes: 4,
    sections: [
      {
        heading: 'What it is',
        body: [
          'A small hop that lands just as your opponent strikes the shuttle. You leave the ground from a narrow stance and land slightly wider, with your weight on the balls of both feet and your knees soft.',
          'The landing is the point. Absorbing it loads your legs like a spring, and a loaded leg pushes off far faster than a straight one. Standing flat-footed and then trying to start is the single most expensive habit in club badminton: you lose roughly half a second before you have moved at all, which on a fast exchange is the whole rally.',
        ],
      },
      {
        heading: 'Timing it',
        body: [
          'Land as the shuttle is struck, not before and not after. Too early and you land, settle, and have to reload — you get the hop without the spring. Too late and you are still in the air when you should already be moving, which is worse than not hopping at all.',
          'The cue that works for most players is to watch the racket rather than the shuttle. The racket tells you when contact is coming; the shuttle only tells you it has already happened.',
        ],
      },
      {
        heading: 'Practising it alone',
        body: [
          'This is exactly what the split-step tick in RallyReady is for. Turn it on and set the lead time to around 0.35s: you hear a tick, then the call. Your job is to land on the tick and push off on the call.',
          'Start slower than feels useful. The habit is a timing habit, and timing is learned at a speed where you can actually be accurate. Once you are landing on the tick without thinking, shorten the interval rather than the lead.',
        ],
      },
    ],
    cues: [
      'Land as the racket meets the shuttle, not when you see where it is going.',
      'Low and wide, not high — you are loading a spring, not jumping a rope.',
      'Balls of the feet. Heels should not touch down on the landing.',
      'Knees soft and tracking over the toes so the legs absorb the landing.',
    ],
    faults: [
      'Hopping early, landing, and settling — the load is gone before you need it.',
      'Jumping too high, which costs more time in the air than it buys in power.',
      'Landing with feet together, which gives you no base to push against.',
      'Splitting on every shot regardless — split when your opponent strikes, not on a metronome of your own.',
    ],
    drills: ['four-corner-footwork', 'six-corner-shadow', 'deception-reaction'],
  },
  {
    slug: 'base-and-recovery',
    title: 'Base, and recovering through it',
    summary:
      'Base is not a spot you stand on. It moves with the rally, and you pass through it rather than parking on it.',
    category: 'footwork',
    level: 'beginner',
    practiceMode: 'solo',
    location: 'court',
    readMinutes: 4,
    sections: [
      {
        heading: 'Base is a bet, not a place',
        body: [
          'The middle of the court is only the right place to stand when every reply is equally likely. It rarely is. After you play a straight clear to your opponent’s rear forehand corner, the fastest replies come back down that line — so your base shifts a step towards it.',
          'Good singles players look like they are guessing well. Mostly they are just standing where their own shot made the reply likely.',
        ],
      },
      {
        heading: 'Through, not to',
        body: [
          'Recovering "to" base means travelling back, stopping, and waiting. Recovering "through" base means arriving with the split step, so the last movement of the recovery is the first movement of the next shot.',
          'The practical difference is that a player who stops at base has to start again from zero. On the app’s board, treat the base marker as somewhere you pass through on the way to being ready — the recovery is not finished until you have split.',
        ],
      },
      {
        heading: 'Recovering from the corners',
        body: [
          'From the net, push back off the front leg — the same leg that braked the lunge. From the rear corners, the recovery starts in the air during the shot, not after you land.',
          'Do not drift past base. Overrunning the middle is as slow as stopping short of it, and it usually happens because the player is watching their own shot rather than moving on it.',
        ],
      },
    ],
    cues: [
      'Base shifts towards the corner you just hit to.',
      'Arrive with a split step — the recovery is not over until you have landed loaded.',
      'Push back off the leg that braked you, not off both feet.',
      'Move on your shot, not after watching it.',
    ],
    faults: [
      'Standing dead centre regardless of where the shuttle went.',
      'Stopping at base and waiting flat-footed.',
      'Drifting past the middle and getting caught wrong-footed.',
      'Turning to watch your own shot before you start recovering.',
    ],
    drills: ['six-corner-shadow', 'four-corner-footwork', 'match-rhythm-intervals'],
  },
  {
    slug: 'chasse-and-crossover',
    title: 'Chassé, crossover and when to use each',
    summary:
      'Two ways of travelling, with different costs. Picking the wrong one for the corner is why the last step so often feels rushed.',
    category: 'footwork',
    level: 'intermediate',
    practiceMode: 'solo',
    location: 'court',
    readMinutes: 5,
    sections: [
      {
        heading: 'The chassé',
        body: [
          'Side, together, side — the feet never cross. It keeps your hips square to the net, it is easy to stop out of, and it lets you change your mind halfway. That controllability is why it is the default for travelling sideways and for the first part of the journey to the rear.',
          'The cost is ground covered per step. A chassé is not the fastest way to cross a long distance, so it is a poor choice for a full-court sprint to a deep corner.',
        ],
      },
      {
        heading: 'The crossover',
        body: [
          'One foot passes the other, as in running. It covers far more ground per step, which is what you want when the shuttle is deep and wide and you are behind on it.',
          'The cost is that it turns your body side-on and commits you to the direction. Recovering out of a crossover takes an extra beat, so use it to cover distance and switch back to a chassé for the last step, where you need to brake and set your feet.',
        ],
      },
      {
        heading: 'Travelling to the rear',
        body: [
          'Turn the hips first, then travel. Most players who "cannot get behind the shuttle" are actually facing the net the whole way and shuffling backwards, which is both slow and how you end up hitting the shuttle from behind your head.',
          'Chassé back with the hips already turned, then take the shot with a scissor or a jump. Never cross the feet while facing the net and moving backwards — it is the classic way to trip yourself or turn an ankle.',
        ],
      },
    ],
    cues: [
      'Chassé to control, crossover to cover ground.',
      'Turn the hips before you travel to the rear, not when you get there.',
      'Whatever you used to travel, the last step is a braking step with the feet set.',
      'Stay low through the middle of the journey — rising costs you the next push.',
    ],
    faults: [
      'Shuffling backwards square to the net and hitting the shuttle from behind the head.',
      'Crossing the feet while moving backwards.',
      'Chasséing the whole way to a deep corner and arriving late.',
      'Standing tall between steps, which unloads the legs on every stride.',
    ],
    drills: ['six-corner-shadow', 'rear-court-scissor', 'four-corner-footwork'],
  },
  {
    slug: 'the-net-lunge',
    title: 'The net lunge',
    summary:
      'The longest step you will take, taken under control. Done well it is fast and safe; done badly it is the most common way club players hurt a knee.',
    category: 'net',
    level: 'beginner',
    practiceMode: 'solo',
    location: 'court',
    readMinutes: 4,
    sections: [
      {
        heading: 'The shape',
        body: [
          'The racket leg goes forward. Contact the floor heel first and roll through the foot — that rolling contact is what lets you brake gradually instead of all at once. The knee tracks over the middle of the foot and should not travel far past the toes.',
          'Keep the chest up and the back straight. The non-racket arm goes back and out; it is not decoration, it is the counterweight that keeps the lunge balanced and stops you falling into the net.',
        ],
      },
      {
        heading: 'Braking and pushing back',
        body: [
          'A lunge you cannot stop is a lunge you cannot recover from. The brake is the front leg, and it needs to be strong enough that stopping is a choice rather than a collision — which is why split jumps and lunges appear in the conditioning circuits.',
          'The recovery is a push off the front leg, driving back through the same line you came in on. If you have to take a small step to gather yourself first, the lunge was too long.',
        ],
      },
      {
        heading: 'Looking after the knee',
        body: [
          'Two things make a lunge dangerous: a knee that collapses inwards, and landing on a straight leg. Both put the load somewhere that is not the muscle.',
          'If your knee drifts inside your foot as you land, shorten the lunge and build the strength before you build the reach. Nothing in this app is worth an injury, and no drill is improved by lunging further than you can control.',
        ],
      },
    ],
    cues: [
      'Racket leg forward, heel down first, roll through the foot.',
      'Knee over the middle of the foot — never inside it.',
      'Chest up, non-racket arm back for balance.',
      'Push straight back off the front leg; do not gather first.',
    ],
    faults: [
      'The knee collapsing inwards on landing.',
      'Landing toes-first and braking entirely with the quad.',
      'Dropping the chest towards the floor, which makes the push back slow.',
      'Lunging further than you can stop, then stepping to recover.',
    ],
    drills: ['net-footwork', 'four-corner-footwork', 'plyometric-power-circuit'],
  },
  {
    slug: 'rear-court-scissor',
    title: 'The scissor jump',
    summary:
      'Swapping your legs in the air during a rear-court overhead. It is where the power comes from, and it starts the recovery before you land.',
    category: 'rear-court',
    level: 'intermediate',
    practiceMode: 'solo',
    location: 'court',
    readMinutes: 5,
    sections: [
      {
        heading: 'What is happening',
        body: [
          'Getting behind the shuttle leaves you with the racket-side foot back and your body side-on. The scissor is the swap: you push off the back leg, the legs cross over in the air, and you land with the non-racket foot behind and the racket-side leg swung through in front.',
          'That swap does two jobs at once. The rotation of the hips and shoulders through it is most of the power in the shot — an overhead hit with the arm alone is an arm-speed shot, and arms are not strong. And the swing-through of the racket-side leg is already the first step of the recovery, so you land facing the net and moving forwards.',
        ],
      },
      {
        heading: 'Getting there in time',
        body: [
          'The scissor only works from behind the shuttle. If you are underneath it, there is no room to rotate and the jump becomes a hop with no power in it.',
          'This is why the travel matters more than the jump. Turn the hips early, travel with the chassé, and take the shuttle in front of your racket shoulder rather than above or behind your head.',
        ],
      },
      {
        heading: 'Landing',
        body: [
          'Land on the non-racket leg with a soft knee, chest up, and let the racket-side leg carry you forwards. You should be travelling towards base as you land, not stopping and then starting.',
          'Landing square on both feet is the tell that the rotation did not happen. The shot will have been an arm shot, and the recovery will be a step slower than it needed to be.',
        ],
      },
    ],
    cues: [
      'Get behind the shuttle first — the jump cannot fix being underneath it.',
      'Contact in front of the racket shoulder, arm at full extension.',
      'Rotate hips and shoulders through the shot; the legs swap as part of that.',
      'Land on the non-racket leg already moving forwards.',
    ],
    faults: [
      'Taking the shuttle from behind the head, which kills both power and control.',
      'Jumping straight up without rotating — a jump that adds nothing.',
      'Landing square on both feet and having to start the recovery from a stop.',
      'Reaching with the arm instead of turning with the body.',
    ],
    drills: ['rear-court-scissor', 'six-corner-shadow', 'multifeed-shadow'],
  },
  {
    slug: 'grips',
    title: 'Grips, and changing between them',
    summary:
      'Four grips cover almost every shot. The skill is not holding them — it is swapping between them in the time you have.',
    category: 'net',
    level: 'beginner',
    practiceMode: 'solo',
    location: 'anywhere',
    readMinutes: 4,
    sections: [
      {
        heading: 'The four',
        body: [
          'Basic forehand: shake hands with the handle, so the V between thumb and index finger sits along the narrow edge. This is the default and where you return between shots.',
          'Backhand (thumb grip): the thumb lies flat along the wider bevel, giving you something to push against. This is what makes a backhand clear or a backhand net kill possible at all.',
          'Panhandle: the racket face is square in front of you, as if holding a frying pan. It is a specialist grip — net kills straight in front, and very little else.',
          'Bevel grip: between forehand and thumb grip, used for backhand rear-court shots and defensive drives on the backhand side.',
        ],
      },
      {
        heading: 'Holding it loosely',
        body: [
          'The grip should be relaxed for everything except the instant of contact, when the fingers squeeze. A tight grip through a whole rally does three bad things: it slows the racket, it removes the finger power that makes net shots delicate, and it tires the forearm out.',
          'If your forearm aches after a session and your legs do not, you are gripping too hard.',
        ],
      },
      {
        heading: 'Practising the change',
        body: [
          'You can do this on a sofa. Hold the racket in basic forehand, let it rotate in your fingers to the thumb grip, and back. Not a whole-hand release and regrasp — a rotation between the fingers and thumb.',
          'The reason to drill it away from the court is that in a rally you have no time to think about it, and thinking about it is what makes it slow.',
        ],
      },
    ],
    cues: [
      'Loose fingers, squeeze only at contact.',
      'Return to basic forehand between shots — it is the shortest distance to everywhere else.',
      'Rotate the racket in the fingers; do not release and regrasp.',
      'Thumb flat along the bevel for backhands, not wrapped around the handle.',
    ],
    faults: [
      'Gripping tightly for the whole rally and losing racket speed.',
      'Using panhandle for everything, which makes any overhead impossible.',
      'Wrapping the thumb around the grip on backhands — nothing to push against.',
      'Changing grip only after you start the swing.',
    ],
    drills: ['net-footwork', 'deception-reaction'],
  },
  {
    slug: 'net-technique',
    title: 'Net shots, kills and lifts',
    summary:
      'Everything at the net is decided by how early you take the shuttle. Height at contact is worth more than any refinement of the stroke.',
    category: 'net',
    level: 'intermediate',
    practiceMode: 'partner',
    location: 'court',
    readMinutes: 5,
    sections: [
      {
        heading: 'Take it early',
        body: [
          'The single biggest difference between a good net player and an average one is the height at which they make contact. Taken above the tape, you can kill it, push it flat, or play it tight, and your opponent has to guess. Taken below the tape, your only honest option is to lift, and they know it.',
          'Everything else on this page is secondary to arriving early enough to take it high.',
        ],
      },
      {
        heading: 'The kill',
        body: [
          'A net kill is a punch, not a swing. Racket up and in front before you need it, no backswing worth the name, and the power comes from the fingers and a short forearm rotation. A big swing at the net is slower and usually goes into the tape.',
          'On the backhand side, this is where the thumb grip earns its keep. Panhandle works for a shuttle directly in front of you and nowhere else.',
        ],
      },
      {
        heading: 'The tight net shot',
        body: [
          'Contact as close to the tape as you can reach, with a relaxed grip and almost no racket movement — you are placing the shuttle, not hitting it. Slicing across the base of the shuttle makes it tumble, which buys you time because a tumbling shuttle cannot be taken cleanly until it settles.',
          'The lift, when you are forced into one, should be either very high and to the back or flat and fast — a lift to the middle of the court at medium height is the most attackable shot in badminton.',
        ],
      },
      {
        heading: 'Practising it alone',
        body: [
          'The movement and the racket preparation shadow perfectly well — that is what the net footwork drill is for. The touch does not: judging a tumble needs a real shuttle and someone to feed it.',
          'If you have a wall and a shuttle, gentle repeated taps at close range will teach your fingers something. If you have a partner for ten minutes, spend it here rather than on clears.',
        ],
      },
    ],
    cues: [
      'Racket up and in front before you arrive, not as you arrive.',
      'Contact above the tape whenever it is physically possible.',
      'Kill with the fingers and a short punch, never a backswing.',
      'Relaxed grip for the tight net shot — you are placing, not hitting.',
    ],
    faults: [
      'Reaching down for the shuttle instead of moving to take it early.',
      'A full swing at a net kill, which sends it into the tape.',
      'Lifting to mid-court at medium height.',
      'Standing up out of the lunge before the shot has finished.',
    ],
    drills: ['net-footwork', 'four-corner-footwork'],
  },
  {
    slug: 'deception-and-holding',
    title: 'Deception and holding the shot',
    summary:
      'Deception is not a trick swing. It is arriving early enough to wait, with every shot looking the same until it is too late.',
    category: 'footwork',
    level: 'advanced',
    practiceMode: 'solo',
    location: 'court',
    readMinutes: 4,
    sections: [
      {
        heading: 'The preparation has to match',
        body: [
          'If your clear, drop and smash have the same preparation, your opponent cannot commit until contact. If your drop is telegraphed by a slower arm from the moment you start, no amount of wrist at the end will disguise it.',
          'This is why shadow work matters for deception: you are rehearsing an identical preparation for shots that end differently.',
        ],
      },
      {
        heading: 'Holding',
        body: [
          'Holding means arriving early and then deliberately delaying the contact. It only exists as an option if your movement bought you time — which makes deception a footwork skill before it is a racket skill.',
          'Against a good opponent the hold does most of the work by itself. They split-step expecting contact, land, and are committed. The shot that follows barely has to be clever.',
        ],
      },
      {
        heading: 'Training the response',
        body: [
          'The other half of deception is not being deceived. That is what the deception mode in the drills trains: a fake call, then the real one, forcing a second split step.',
          'The fake is deliberately indistinguishable from a real call. A fake you can hear coming trains nothing — you would just learn to ignore the first call, which is the opposite of the habit you want.',
        ],
      },
    ],
    cues: [
      'Same preparation for clear, drop and smash — decide late, not early.',
      'Buy the time with your feet; the hold is only possible if you arrived early.',
      'Slice changes the speed without changing the swing.',
      'When you are the one deceived, split again rather than lunging at the first movement.',
    ],
    faults: [
      'Telegraphing by slowing the arm at the start of the swing.',
      'Trying to be deceptive from a late, rushed position.',
      'Over-using it — deception works because most shots are honest.',
      'Committing to the first movement you see and having no second push.',
    ],
    drills: ['deception-reaction', 'six-corner-shadow'],
  },
  {
    slug: 'warm-up-and-injury',
    title: 'Warming up, and the injuries to avoid',
    summary:
      'Badminton’s common injuries are predictable and mostly preventable. Five minutes of the right warm-up is worth more than any of the drills here.',
    category: 'conditioning',
    level: 'beginner',
    practiceMode: 'solo',
    location: 'anywhere',
    readMinutes: 5,
    sections: [
      {
        heading: 'What a warm-up is for',
        body: [
          'Raise the heart rate, move the joints you are about to load through their full range, and then do a few fast efforts so the first sharp movement of the session is not the first sharp movement of the day.',
          'Static stretching before you play does not prevent injury and can briefly reduce power. Save it for afterwards, if you like it. Before playing, keep moving.',
        ],
      },
      {
        heading: 'A five-minute version',
        body: [
          'Two minutes of easy movement — jogging on the spot, skipping, side steps. One minute of leg swings, hip circles, ankle rolls and shoulder circles. One minute of shadow movement to the corners at half pace. One minute of three or four short, sharp efforts: a few fast lunges, a couple of jumps, one quick corner sequence.',
          'The warm-up block built into every drill in this app is doing the last part of that job, not all of it.',
        ],
      },
      {
        heading: 'The usual suspects',
        body: [
          'Ankle sprains are the most common badminton injury by a distance, and they mostly happen on landing — on an uneven surface, on a shuttle, or out of a lunge you could not control. Ankle strength and balance work is the cheapest insurance in the sport.',
          'Achilles and patellar tendon problems come from load that rose faster than the tendon adapted. This is what deload weeks are actually for, and why the programs put one in every fourth week before you feel like you need it.',
          'Shoulder pain usually comes from repeated overheads with poor rotation — hitting with the arm instead of the body, which is the same fault as the one that costs you power.',
        ],
      },
      {
        heading: 'A caveat',
        body: [
          'This is general training information, not medical advice. Pain that is sharp, that persists, or that changes how you move is worth a professional opinion rather than another session.',
        ],
      },
    ],
    cues: [
      'Move to warm up; stretch afterwards if at all.',
      'Include a few fast efforts before the first fast effort that counts.',
      'Build load gradually — the tendon adapts slower than the muscle.',
      'Train ankle strength and balance deliberately, not by accident.',
    ],
    faults: [
      'Starting a session cold because the drill has a warm-up block in it.',
      'Adding intensity and volume in the same week.',
      'Training through tendon pain because it "warms up after ten minutes".',
      'Skipping deload weeks because you feel fine — feeling fine is when they work.',
    ],
    drills: ['agility-ladder-circuit', 'home-court-circuit'],
  },
  {
    slug: 'how-to-train-solo',
    title: 'How to train solo without wasting the time',
    summary:
      'What to do, how often, and how hard — plus the honest limits of what shadow work can teach you.',
    category: 'conditioning',
    level: 'beginner',
    practiceMode: 'solo',
    location: 'anywhere',
    readMinutes: 5,
    sections: [
      {
        heading: 'How often',
        body: [
          'Two to four sessions a week is where almost everyone should sit. One is not enough to change anything; five or six only works if most of them are easy, which is rarely what happens when someone decides to train five times a week.',
          'If you also play matches, count those. A club night is a training session as far as your legs are concerned.',
        ],
      },
      {
        heading: 'How hard',
        body: [
          'Most sessions should be comfortably hard — you could speak in the rests. One or two a week should be genuinely difficult. If every session is difficult, you are not training, you are just accumulating fatigue, and it shows up as your movement getting worse over a block rather than better.',
          'The programs in this app do that split for you, which is most of what a program is for.',
        ],
      },
      {
        heading: 'Quality is the whole point',
        body: [
          'Shadow footwork trains a movement pattern. That means it can just as easily train a bad one. When the movement gets scrappy — feet crossing, chest dropping, recovery skipped — the useful part of the session is over, regardless of how many rounds are left.',
          'Stopping a round early because the quality went is a good decision, not a failed session. The app counts what you did rather than what you planned.',
        ],
      },
      {
        heading: 'What solo work cannot teach you',
        body: [
          'Timing against a real shuttle, reading an opponent’s preparation, and touch at the net. Those need a shuttle and, for the last two, another person.',
          'What solo work is unusually good at is movement quality, the split step, work capacity and speed — the things that most limit a returning club player, and the things that are hardest to fix during a match. Use the court time you do get for the parts that need a partner.',
        ],
      },
      {
        heading: 'Knowing whether it is working',
        body: [
          'Take the benchmark every four to six weeks, not more often. It is a hard test and doing it constantly turns a measurement into a workout.',
          'Between benchmarks, the pace chart on the Progress screen is the honest signal: it shows the average interval you actually sustained, per session. Weeks of training that do not move it are weeks worth changing something about.',
        ],
      },
    ],
    cues: [
      'Two to four sessions a week, counting matches.',
      'Most sessions comfortably hard, one or two genuinely hard.',
      'Stop the round when the movement quality goes, not when the timer does.',
      'Benchmark every four to six weeks; use the pace chart in between.',
    ],
    faults: [
      'Training hard every session and calling the resulting fatigue progress.',
      'Grinding out rounds with sloppy footwork and rehearsing the sloppiness.',
      'Benchmarking every week and reading the noise as change.',
      'Spending scarce court time on things you could have shadowed at home.',
    ],
    drills: ['six-corner-shadow', 'match-rhythm-intervals', 'four-corner-footwork'],
  },
]

export function findTechniqueTopic(slug: string): TechniqueTopic | undefined {
  return TECHNIQUE_TOPICS.find((topic) => topic.slug === slug)
}

/** The topics that teach a given drill, so the technique can sit next to it. */
export function topicsForDrill(drillSlug: string): TechniqueTopic[] {
  return TECHNIQUE_TOPICS.filter((topic) => topic.drills.includes(drillSlug))
}
