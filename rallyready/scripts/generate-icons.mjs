/**
 * Generates the PWA icon set + favicon from one shared geometry description,
 * with no native image tooling required (pure Node: zlib + a tiny rasteriser).
 *
 *   node scripts/generate-icons.mjs
 *
 * Everything is expressed in a normalised 0..1 unit square so the PNG raster
 * and the SVG favicon are guaranteed to be the same mark.
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const INK = [0x0b, 0x0f, 0x14]
const VOLT = [0xc6, 0xf2, 0x4e]

/* ---------------------------------------------------------------- geometry */

// A shuttlecock: cork ball + feather skirt flaring upwards.
const CORK = { cx: 0.5, cy: 0.715, r: 0.145 }
const SKIRT_BOTTOM_Y = 0.665
const SKIRT_BOTTOM_HALF = 0.125
const SKIRT_TOP_Y = 0.215
const SKIRT_TOP_HALF = 0.285
const SKIRT_TOP_BOW = 0.055 // how much the feather crown arcs upward

/** Outline of the feather skirt, with a gently bowed top edge. */
function skirtPolygon() {
  const pts = [
    [0.5 - SKIRT_BOTTOM_HALF, SKIRT_BOTTOM_Y],
    [0.5 - SKIRT_TOP_HALF, SKIRT_TOP_Y],
  ]
  const STEPS = 24
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS
    const x = 0.5 - SKIRT_TOP_HALF + t * (SKIRT_TOP_HALF * 2)
    // Parabolic bow: highest in the middle of the crown.
    const y = SKIRT_TOP_Y - SKIRT_TOP_BOW * (1 - Math.pow(2 * t - 1, 2))
    pts.push([x, y])
  }
  pts.push([0.5 + SKIRT_TOP_HALF, SKIRT_TOP_Y], [0.5 + SKIRT_BOTTOM_HALF, SKIRT_BOTTOM_Y])
  return pts
}

/** Feather separations: thin cut-outs radiating from just above the cork. */
function featherLines() {
  // Start on the cork's top edge so the cuts never bite into the ball.
  const from = [0.5, CORK.cy - CORK.r - 0.005]
  return [-0.62, -0.21, 0.21, 0.62].map((k) => ({
    from,
    to: [0.5 + k * SKIRT_TOP_HALF, SKIRT_TOP_Y + 0.03],
  }))
}

/* --------------------------------------------------------------- rasteriser */

class Raster {
  constructor(size, ss = 4) {
    this.size = size
    this.ss = ss
    this.w = size * ss
    this.h = size * ss
    this.buf = new Uint8ClampedArray(this.w * this.h * 3)
  }

  fill(rgb) {
    for (let i = 0; i < this.w * this.h; i++) {
      this.buf[i * 3] = rgb[0]
      this.buf[i * 3 + 1] = rgb[1]
      this.buf[i * 3 + 2] = rgb[2]
    }
  }

  #px(x, y, rgb) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 3
    this.buf[i] = rgb[0]
    this.buf[i + 1] = rgb[1]
    this.buf[i + 2] = rgb[2]
  }

  /** Paints every pixel whose centre satisfies `inside(x, y)` (unit coords). */
  #shade(inside, rgb, bounds) {
    const x0 = Math.max(0, Math.floor(bounds[0] * this.w))
    const y0 = Math.max(0, Math.floor(bounds[1] * this.h))
    const x1 = Math.min(this.w, Math.ceil(bounds[2] * this.w))
    const y1 = Math.min(this.h, Math.ceil(bounds[3] * this.h))
    for (let py = y0; py < y1; py++) {
      const uy = (py + 0.5) / this.h
      for (let px = x0; px < x1; px++) {
        const ux = (px + 0.5) / this.w
        if (inside(ux, uy)) this.#px(px, py, rgb)
      }
    }
  }

  roundRect(x, y, w, h, r, rgb) {
    this.#shade(
      (ux, uy) => {
        if (ux < x || uy < y || ux > x + w || uy > y + h) return false
        const dx = Math.max(x + r - ux, 0, ux - (x + w - r))
        const dy = Math.max(y + r - uy, 0, uy - (y + h - r))
        return dx * dx + dy * dy <= r * r
      },
      rgb,
      [x, y, x + w, y + h],
    )
  }

  circle(cx, cy, r, rgb) {
    this.#shade((ux, uy) => (ux - cx) ** 2 + (uy - cy) ** 2 <= r * r, rgb, [
      cx - r,
      cy - r,
      cx + r,
      cy + r,
    ])
  }

  polygon(points, rgb) {
    const xs = points.map((p) => p[0])
    const ys = points.map((p) => p[1])
    const inside = (ux, uy) => {
      let hit = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i]
        const [xj, yj] = points[j]
        if (yi > uy !== yj > uy && ux < ((xj - xi) * (uy - yi)) / (yj - yi) + xi) hit = !hit
      }
      return hit
    }
    this.#shade(inside, rgb, [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)])
  }

  /** Round-capped thick line. */
  line(from, to, width, rgb) {
    const [ax, ay] = from
    const [bx, by] = to
    const hw = width / 2
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    this.#shade(
      (ux, uy) => {
        const t =
          len2 === 0 ? 0 : Math.max(0, Math.min(1, ((ux - ax) * dx + (uy - ay) * dy) / len2))
        const px = ax + t * dx
        const py = ay + t * dy
        return (ux - px) ** 2 + (uy - py) ** 2 <= hw * hw
      },
      rgb,
      [Math.min(ax, bx) - hw, Math.min(ay, by) - hw, Math.max(ax, bx) + hw, Math.max(ay, by) + hw],
    )
  }

  /** Box-downsample the supersampled buffer to the target size. */
  resolve() {
    const { size, ss } = this
    const out = new Uint8ClampedArray(size * size * 3)
    const n = ss * ss
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let r = 0
        let g = 0
        let b = 0
        for (let sy = 0; sy < ss; sy++) {
          for (let sx = 0; sx < ss; sx++) {
            const i = ((y * ss + sy) * this.w + (x * ss + sx)) * 3
            r += this.buf[i]
            g += this.buf[i + 1]
            b += this.buf[i + 2]
          }
        }
        const o = (y * size + x) * 3
        out[o] = r / n
        out[o + 1] = g / n
        out[o + 2] = b / n
      }
    }
    return out
  }
}

/* -------------------------------------------------------------- PNG writer */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(rgb, size) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0 // filter: none
    Buffer.from(rgb.buffer, y * size * 3, size * 3).copy(raw, y * (size * 3 + 1) + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ compose */

/**
 * Background is always full-bleed ink — every launcher applies its own mask,
 * and PNG truecolour has no alpha channel to round the corners with anyway.
 *
 * @param size  output pixel size
 * @param inset how far the mark is pulled in (maskable icons need a safe zone)
 */
function renderIcon(size, { inset = 0.12 } = {}) {
  const r = new Raster(size, size <= 64 ? 8 : 4)
  r.fill(INK)

  const scale = 1 - inset * 2
  const map = ([x, y]) => [0.5 + (x - 0.5) * scale, 0.5 + (y - 0.5) * scale]
  const mapR = (v) => v * scale

  r.polygon(skirtPolygon().map(map), VOLT)
  const [ccx, ccy] = map([CORK.cx, CORK.cy])
  r.circle(ccx, ccy, mapR(CORK.r), VOLT)
  for (const { from, to } of featherLines()) {
    r.line(map(from), map(to), mapR(0.028), INK)
  }
  return encodePng(r.resolve(), size)
}

function renderSvg() {
  const pts = skirtPolygon()
    .map(([x, y]) => `${(x * 64).toFixed(2)},${(y * 64).toFixed(2)}`)
    .join(' ')
  const feathers = featherLines()
    .map(
      ({ from, to }) =>
        `<line x1="${(from[0] * 64).toFixed(2)}" y1="${(from[1] * 64).toFixed(2)}" ` +
        `x2="${(to[0] * 64).toFixed(2)}" y2="${(to[1] * 64).toFixed(2)}" ` +
        `stroke="#0B0F14" stroke-width="${(0.028 * 64).toFixed(2)}" stroke-linecap="round"/>`,
    )
    .join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="RallyReady">
  <rect width="64" height="64" rx="14" fill="#0B0F14"/>
  <polygon points="${pts}" fill="#C6F24E"/>
  <circle cx="${(CORK.cx * 64).toFixed(2)}" cy="${(CORK.cy * 64).toFixed(2)}" r="${(CORK.r * 64).toFixed(2)}" fill="#C6F24E"/>
  ${feathers}
</svg>
`
}

mkdirSync(OUT, { recursive: true })
const targets = [
  ['pwa-192x192.png', renderIcon(192)],
  ['pwa-512x512.png', renderIcon(512)],
  ['pwa-maskable-512x512.png', renderIcon(512, { inset: 0.24 })],
  ['apple-touch-icon.png', renderIcon(180, { inset: 0.16 })],
  ['favicon.svg', renderSvg()],
]
for (const [name, data] of targets) {
  writeFileSync(join(OUT, name), data)
  console.log(`wrote public/${name}`)
}
