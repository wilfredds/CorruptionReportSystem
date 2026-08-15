import type { GripSpec } from '@/lib/data/seed/technique'
import { cn } from '@/lib/utils'

/**
 * How to hold the racket, in two panels: the racket itself, and the handle in
 * cross-section with the relevant bevels picked out.
 *
 * The cross-section alone is how every coaching manual draws a grip — and on
 * its own it is a hexagon with a squiggle next to it. Manuals get away with it
 * because there is a photograph of a hand on the facing page. So the racket is
 * drawn too: it anchors what you are looking down, and it carries a second real
 * instruction (hold it low) that the cross-section cannot show.
 *
 * The bevel itself is highlighted rather than a floating marker being placed
 * near it. "This edge" is unambiguous in a way that a symbol hovering in the
 * vicinity of two edges is not.
 */

const W = 172
const H = 132

const CENTRE = { x: 124, y: 40 }
/** Circumradius of the handle octagon. */
const R = 24

const rad = (deg: number) => (deg * Math.PI) / 180

function pointAt(angleDeg: number, radius: number, origin = CENTRE) {
  return {
    x: origin.x + radius * Math.cos(rad(angleDeg)),
    y: origin.y + radius * Math.sin(rad(angleDeg)),
  }
}

/** Vertex `i` of the octagon, arranged so bevel 0 is flat on top. */
const vertex = (i: number) => pointAt(-112.5 + i * 45, R)

/** The two ends of bevel `i`. Bevel 0 is the top; the rest run clockwise. */
function bevelEdge(bevel: number) {
  const i = ((bevel % 8) + 8) % 8
  return { a: vertex(i), b: vertex(i + 1) }
}

function octagonPath(): string {
  return `${Array.from({ length: 8 }, (_, i) => vertex(i))
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')} Z`
}

interface GripDiagramProps {
  grip: GripSpec
  className?: string
}

export function GripDiagram({ grip, className }: GripDiagramProps) {
  const v = bevelEdge(grip.vBevel)
  const thumb = grip.thumbBevel === null ? null : bevelEdge(grip.thumbBevel)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={`Looking down the handle from the butt cap. The web between thumb and index sits on bevel ${
        grip.vBevel + 1
      }${
        grip.thumbBevel === null
          ? ', with the thumb wrapped around the handle'
          : `, and the thumb lies flat on bevel ${grip.thumbBevel + 1}`
      }. ${grip.faceNote}. Hold low on the handle.`}
    >
      {/* ------------------------------------------------ the racket itself */}
      <g className="stroke-foreground" fill="none" strokeWidth="2.2">
        <ellipse cx="34" cy="30" rx="17" ry="22" className="fill-court-surface" />
        {/* A suggestion of strings, which is what makes it read as a racket
            rather than as a balloon on a stick. */}
        <g className="stroke-court-line" strokeWidth="1.1">
          <line x1="27" y1="10" x2="27" y2="50" />
          <line x1="41" y1="10" x2="41" y2="50" />
          <line x1="18" y1="24" x2="50" y2="24" />
          <line x1="18" y1="36" x2="50" y2="36" />
        </g>
        <path d="M 26 50 L 34 60 L 42 50" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="34" y1="58" x2="34" y2="74" strokeWidth="2.8" strokeLinecap="round" />
        <rect x="29" y="72" width="10" height="34" rx="4" className="fill-secondary" />
      </g>

      {/* Where on the handle the hand goes — low, for the longer lever. */}
      <rect
        x="26.5"
        y="86"
        width="15"
        height="21"
        rx="6"
        className="fill-primary/20 stroke-primary"
        strokeWidth="2"
      />
      <text
        x="34"
        y={H - 16}
        textAnchor="middle"
        className="fill-primary text-[7.5px] font-bold tracking-wide"
      >
        HOLD LOW
      </text>
      <text
        x="34"
        y={H - 6}
        textAnchor="middle"
        className="fill-muted-foreground text-[7px] font-medium"
      >
        longer lever
      </text>

      {/* ------------------------------------------- the handle in section */}
      <path
        d={octagonPath()}
        className="fill-secondary stroke-foreground"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* The bevel the web of the hand sits on. */}
      <line
        x1={v.a.x}
        y1={v.a.y}
        x2={v.b.x}
        y2={v.b.y}
        className="stroke-primary"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* The bevel the thumb presses, when the grip asks for it flat. */}
      {thumb && (
        <line
          x1={thumb.a.x}
          y1={thumb.a.y}
          x2={thumb.b.x}
          y2={thumb.b.y}
          className="stroke-sprint"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      )}

      {/* Below the octagon, not inside it — in the middle it collided with the
          very bevels it was there to explain. */}
      <text
        x={CENTRE.x}
        y={CENTRE.y + R + 13}
        textAnchor="middle"
        className="fill-muted-foreground text-[6.5px] font-semibold tracking-wide"
      >
        LOOKING DOWN
      </text>
      <text
        x={CENTRE.x}
        y={CENTRE.y + R + 22}
        textAnchor="middle"
        className="fill-muted-foreground text-[6.5px] font-semibold tracking-wide"
      >
        THE HANDLE
      </text>

      {/* ------------------------------------------------------------ key */}
      {/* The face note is not repeated here — it is printed as a caption under
          the whole panel, where it has a full line and cannot run off the edge. */}
      <g>
        <line
          x1="76"
          y1={H - 26}
          x2="88"
          y2={H - 26}
          className="stroke-primary"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <text x="93" y={H - 23} className="fill-foreground text-[7.5px] font-semibold">
          V of the hand
        </text>

        <line
          x1="76"
          y1={H - 10}
          x2="88"
          y2={H - 10}
          className={thumb ? 'stroke-sprint' : 'stroke-border'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={thumb ? undefined : '3 3'}
        />
        <text x="93" y={H - 7} className="fill-foreground text-[7.5px] font-semibold">
          {thumb ? 'Thumb flat' : 'Thumb wraps'}
        </text>
      </g>
    </svg>
  )
}
