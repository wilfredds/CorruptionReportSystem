/**
 * Content-Security-Policy, built per request around a one-time nonce.
 *
 * Why not a static header in next.config.mjs? Because a static policy has to
 * say `script-src 'unsafe-inline'` to let Next.js boot, and `'unsafe-inline'`
 * is the single directive that makes a CSP stop being an XSS defence: any
 * markup an attacker manages to inject would execute. So the policy is built
 * here instead, once per request, with a random nonce that Next.js stamps onto
 * its own bootstrap scripts and nothing else can guess.
 *
 * `'strict-dynamic'` then lets those trusted scripts pull in the webpack
 * chunks they need without us having to enumerate every chunk URL.
 *
 * Runs on the Edge runtime, so it uses Web Crypto only — no node:crypto.
 */

/** 128 bits of randomness, base64 — comfortably beyond guessing. */
export function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",

    // The nonce is the whole point. In development the Next.js dev server uses
    // eval for hot reloading and injects scripts we do not control, so the
    // policy is relaxed there and there only — a production build never is.
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,

    // Styles stay 'unsafe-inline'. React writes `style={{…}}` as a real style
    // attribute, which no nonce can cover (that is style-src-attr, and support
    // is uneven). An injected style is a defacement risk, not code execution.
    "style-src 'self' 'unsafe-inline'",

    // data: for the inline SVG icons, blob: for the generated PDF receipt.
    "img-src 'self' data: blob:",
    "font-src 'self' data:",

    // The app talks to nothing but itself. No analytics, no CDN, no telemetry —
    // the shop's customer and money data never leaves the server.
    isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",

    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    // Deliberately NOT 'upgrade-insecure-requests'. Strict-Transport-Security
    // already forces HTTPS on any real deployment, and the directive rewrites
    // even same-origin requests to https:// — which silently breaks the app if
    // it is ever served over plain HTTP on a shop's local network. Verified:
    // it turned every page navigation into ERR_SSL_PROTOCOL_ERROR under test.
  ].join('; ');
}

/**
 * The headers that do NOT vary per request — X-Frame-Options, HSTS, the
 * Cross-Origin-* isolation set — live in next.config.mjs and are applied to
 * every path, including the static assets and auth endpoints that middleware
 * skips. Keeping each header to a single source avoids the browser seeing two
 * copies and enforcing the intersection.
 */
