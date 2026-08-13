import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hardenedCookieOptions } from "./lib/supabase/cookie-options";

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
function buildCsp(nonce: string): string {
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
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",

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

/** Paths that require a signed-in staff member. */
function isProtected(pathname: string): boolean {
  return pathname === "/portal/dashboard" || pathname.startsWith("/portal/dashboard/");
}

export async function proxy(request: NextRequest) {
  /* crypto.randomUUID() is available in the Edge runtime and is
     cryptographically random — Math.random() would be guessable and therefore
     worthless as a nonce. */
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  /* Pass the policy inward on the request so Next can read the nonce and stamp
     it onto the script tags it renders, plus the bare nonce on `x-nonce` for
     the root layout to put on our own inline JSON-LD tag. */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-nonce", nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  /**
   * Keep the Supabase session alive.
   *
   * Access tokens are short-lived and have to be exchanged for fresh ones,
   * which means writing new cookies. Server components are not allowed to set
   * cookies — so if this did not happen here, staff sessions would expire
   * mid-shift and the portal would start bouncing people to the login page for
   * no visible reason. Middleware is the one place in the App Router that can
   * both read the request and set cookies on the way back.
   *
   * `getUser()`, not `getSession()`: this call is what revalidates the token
   * with the Auth server. `getSession()` would hand back whatever the cookie
   * claims, unverified, which is worthless as a basis for the redirect below.
   */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /* Guarded, because the public site must keep working before Supabase is
     configured. Without this check the whole restaurant — menu, hours, the
     reservation form — would 500 on a missing environment variable. The portal
     is the only part that actually needs auth. */
  if (url && anonKey) {
    try {
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            /* Refreshed cookies go onto the REQUEST as well as the response, so
               the server components rendering further down this same pass see
               the new session rather than the stale one. */
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            response = NextResponse.next({ request: { headers: requestHeaders } });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, hardenedCookieOptions(options));
            }
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user && isProtected(request.nextUrl.pathname)) {
        const signIn = new URL("/portal", request.url);
        signIn.searchParams.set("next", request.nextUrl.pathname);

        /* The redirect gets its own response object, so any cookies the refresh
           just set have to be copied across or the browser loses them and the
           next request starts from an even staler session. */
        const redirect = NextResponse.redirect(signIn);
        for (const cookie of response.cookies.getAll()) {
          redirect.cookies.set(cookie);
        }
        redirect.headers.set("content-security-policy", csp);
        return redirect;
      }
    } catch (error) {
      /* A failure here must not take the site down. The page itself calls
         requireStaff(), which fails closed on its own — so the worst case is
         that someone reaches the dashboard route and is bounced one step later
         instead of one step earlier. */
      console.error("[proxy] session refresh failed:", error);
    }
  }

  /* And outward on the response so the browser actually enforces it. */
  response.headers.set("content-security-policy", csp);

  return response;
}

export const config = {
  /*
   * Skip the static asset paths. They are plain files with no scripts to
   * protect, and running this on every image would be pure overhead. The
   * negative lookahead is the pattern Next documents for exactly this.
   */
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
