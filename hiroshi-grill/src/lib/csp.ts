/** Cloudflare's origin for the Turnstile widget and its iframe. */
const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

/**
 * Content-Security-Policy, issued per request with a nonce.
 *
 * WHY THIS FILE EXISTS
 * The obvious way to ship a CSP is a static header in next.config.ts. That is
 * what this project did first, and it broke the site: `script-src 'self'`
 * blocks *inline* scripts, and the App Router boots React from a handful of
 * inline `<script>` tags. The browser refused them, hydration never ran, and
 * every interactive component — including the reservation form — was dead HTML.
 *
 * The wrong fix is `script-src 'self' 'unsafe-inline'`, which switches off the
 * single most valuable thing a CSP does. The right fix is a **nonce**: a fresh
 * random token minted for every response and stamped on the scripts we trust.
 * An injected `<script>` cannot guess this request's token, so it stays blocked
 * while ours run.
 *
 * Next.js reads the nonce out of the CSP on the *request* headers and applies
 * it to the tags it generates, which is why the header is set twice below.
 *
 * THE TRADE-OFF, STATED PLAINLY
 * A nonce must be unique per response, so pages using one cannot be served from
 * a build-time static cache — they render per request. For a site this size on
 * Vercel that is a few milliseconds, and it buys a CSP with no `unsafe-` escape
 * hatch in `script-src`. If the landing page ever needs to be fully static
 * again, the alternative is to drop the nonce and allow `'unsafe-inline'`
 * scripts — a real weakening, not a free lunch.
 */
export function buildCsp(nonce: string, turnstileEnabled = false): string {
  return [
    "default-src 'self'",

    /* 'strict-dynamic' says: trust a script carrying this nonce, and trust
       whatever *that* script loads. It is what lets Next's bootstrap pull in
       the rest of the bundle without us listing every chunk. Browsers that
       understand it ignore the 'self' beside it; older ones fall back to
       'self', so both are listed. */
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,

    /* Styles still need 'unsafe-inline': React writes inline style attributes
       and Next inlines the stylesheet on first paint. Inline *styles* cannot
       execute code, so this is a far smaller concession than inline scripts —
       the worst it enables is visual mischief on an already-compromised page. */
    "style-src 'self' 'unsafe-inline'",

    "img-src 'self' data: blob:",
    "font-src 'self'",

    /* Where the browser may send data. Supabase is listed ahead of milestone 2;
       the wss:// entry is for realtime updates on the staff dashboard. */
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${
      turnstileEnabled ? ` ${TURNSTILE_ORIGIN}` : ""
    }`,

    /**
     * Who may be embedded in an iframe by us.
     *
     * Turnstile renders its challenge in one, so Cloudflare has to be named
     * here — and note that `frame-src` IS an ordinary host list, unlike
     * `script-src`, where the `'strict-dynamic'` above makes host entries
     * inert. Listing Cloudflare in script-src would have achieved exactly
     * nothing; the widget script is trusted because it carries our nonce, and
     * everything it loads inherits that trust.
     *
     * Added only when Turnstile is actually configured. A policy that permits
     * things the site does not use is a policy doing less work than it could.
     */
    turnstileEnabled ? `frame-src ${TURNSTILE_ORIGIN}` : "frame-src 'none'",

    "object-src 'none'",
    "base-uri 'self'",

    /* form-action 'self' stops an injected form from posting a guest's details
       to someone else's server. */
    "form-action 'self'",

    /* Nobody may embed us in an iframe — no clickjacking the staff portal. */
    "frame-ancestors 'none'",

    "upgrade-insecure-requests",
  ].join("; ");
}
