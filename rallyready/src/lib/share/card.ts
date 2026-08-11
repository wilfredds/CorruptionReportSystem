/**
 * Draws a session as a shareable image.
 *
 * Rendered on a canvas rather than assembled from a screenshot so it looks
 * composed rather than cropped, and so it works offline like everything else.
 * 1080×1350 is the 4:5 portrait that Instagram, Facebook and Messenger all
 * accept without re-cropping.
 */

export interface ShareCardData {
  drillName: string
  durationLabel: string
  rounds: number
  calls: number
  /** Average seconds between calls, already formatted, or null for a circuit. */
  paceLabel: string | null
  streakWeeks: number
  dateLabel: string
}

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

/** Matches the app's dark palette so a shared card is recognisably the app. */
const INK = '#0b0f14'
const VOLT = '#bef264'
const WHITE = '#f8fafc'
const MUTED = '#94a3b8'
const LINE = '#1e293b'

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Wraps to at most two lines and ellipsises the rest — a drill name is short,
 * but a user-named one need not be.
 */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    } else {
      line = candidate
    }
  }
  if (lines.length < maxLines && line) lines.push(line)

  let last = lines[lines.length - 1] ?? ''
  if (lines.length === maxLines && ctx.measureText(last).width > maxWidth) {
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1)
    }
    lines[lines.length - 1] = `${last}…`
  }

  lines.forEach((entry, index) => ctx.fillText(entry, x, y + index * lineHeight))
  return lines.length
}

function stat(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
) {
  ctx.fillStyle = '#0f172a'
  roundedRect(ctx, x, y, w, 190, 28)
  ctx.fill()
  ctx.strokeStyle = LINE
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = MUTED
  ctx.font = '500 30px Inter, system-ui, sans-serif'
  ctx.fillText(label.toUpperCase(), x + 34, y + 62)

  ctx.fillStyle = WHITE
  ctx.font = '800 76px Inter, system-ui, sans-serif'
  ctx.fillText(value, x + 34, y + 142)
}

export function drawShareCard(canvas: HTMLCanvasElement, data: ShareCardData): void {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = INK
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  // A soft volt wash behind the headline, echoing the app's featured card.
  const glow = ctx.createRadialGradient(CARD_WIDTH / 2, 260, 40, CARD_WIDTH / 2, 260, 720)
  glow.addColorStop(0, 'rgba(190, 242, 100, 0.16)')
  glow.addColorStop(1, 'rgba(190, 242, 100, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_WIDTH, 900)

  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = VOLT
  ctx.font = '800 34px Inter, system-ui, sans-serif'
  ctx.fillText('RALLYREADY', 80, 130)

  ctx.fillStyle = MUTED
  ctx.font = '500 32px Inter, system-ui, sans-serif'
  ctx.fillText(data.dateLabel, 80, 186)

  ctx.fillStyle = WHITE
  ctx.font = '800 92px Inter, system-ui, sans-serif'
  const lines = drawWrapped(ctx, data.drillName, 80, 340, CARD_WIDTH - 160, 104, 2)

  const top = 340 + lines * 104 + 40
  const gap = 32
  const half = (CARD_WIDTH - 160 - gap) / 2

  stat(ctx, 'Time', data.durationLabel, 80, top, half)
  stat(
    ctx,
    data.calls > 0 ? 'Rounds' : 'Exercises',
    String(data.rounds),
    80 + half + gap,
    top,
    half,
  )

  const second = top + 190 + gap
  if (data.calls > 0) {
    stat(ctx, 'Calls', String(data.calls), 80, second, half)
    stat(ctx, 'Avg interval', data.paceLabel ?? '—', 80 + half + gap, second, half)
  } else {
    stat(ctx, 'Week streak', String(data.streakWeeks), 80, second, half)
    stat(ctx, 'Trained', 'Solo', 80 + half + gap, second, half)
  }

  // Footer: the streak is the bit worth bragging about.
  const footerY = CARD_HEIGHT - 150
  ctx.fillStyle = LINE
  ctx.fillRect(80, footerY - 70, CARD_WIDTH - 160, 2)

  ctx.fillStyle = VOLT
  ctx.font = '800 44px Inter, system-ui, sans-serif'
  ctx.fillText(
    data.streakWeeks > 0
      ? `${data.streakWeeks} ${data.streakWeeks === 1 ? 'week' : 'weeks'} in a row`
      : 'Session logged',
    80,
    footerY,
  )

  ctx.fillStyle = MUTED
  ctx.font = '500 30px Inter, system-ui, sans-serif'
  ctx.fillText('Solo badminton training', 80, footerY + 52)
}

export async function renderShareCard(data: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  drawShareCard(canvas, data)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

/** True when the browser can put an image into the OS share sheet. */
export function canShareImages(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) return false
  try {
    const probe = new File([new Blob([''], { type: 'image/png' })], 'probe.png', {
      type: 'image/png',
    })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}
