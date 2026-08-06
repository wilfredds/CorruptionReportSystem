import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { canAccessPath, isPublicPath } from './lib/rbac';
import { buildCsp, makeNonce } from './lib/security-headers';

/**
 * Route protection, first pass.
 *
 * Runs on the Edge runtime, so it is built from `auth.config.ts` only — no
 * Prisma, no bcrypt. It reads the role straight off the signed JWT.
 *
 * This is a convenience layer: it sends people somewhere sensible instead of
 * letting them load a page they cannot use. It is NOT the security boundary.
 * Every server action and route handler re-checks the session and role itself
 * (see lib/session.ts), because a request can always be aimed directly at an
 * endpoint without passing through a page render.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  /**
   * A fresh nonce for this one response. It goes out on the CSP header and,
   * via the request headers, back into Next.js — which stamps it onto the
   * bootstrap scripts it injects. Nothing without this value may execute.
   */
  const nonce = makeNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development');

  /** Continue to the page, handing the nonce down to the renderer. */
  const proceed = () => {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-nonce', nonce);
    // Next.js reads the nonce out of this request header itself.
    requestHeaders.set('Content-Security-Policy', csp);
    return NextResponse.next({ request: { headers: requestHeaders } });
  };

  /** Every exit from this function goes through here, so nothing escapes unheadered. */
  const send = (response: NextResponse) => {
    response.headers.set('Content-Security-Policy', csp);
    return response;
  };

  const redirect = (to: URL) => send(NextResponse.redirect(to));

  // Signed-in users have no business on the login page.
  if (pathname === '/login' && session) {
    return redirect(new URL('/dashboard', req.nextUrl));
  }

  if (isPublicPath(pathname)) return send(proceed());

  if (!session) {
    const loginUrl = new URL('/login', req.nextUrl);
    // Remember where they were headed so we can send them back after login.
    if (pathname !== '/') loginUrl.searchParams.set('next', `${pathname}${search}`);
    return redirect(loginUrl);
  }

  // The Acceptable Use Policy must be acknowledged before anything else.
  if (!session.user?.policyAccepted && pathname !== '/policy') {
    return redirect(new URL('/policy?first=1', req.nextUrl));
  }

  // A password the admin chose (or a seeded one) has to be replaced before the
  // account can be used. /account is the only reachable page until then.
  if (session.user?.mustChangePassword && pathname !== '/account') {
    return redirect(new URL('/account?forced=1', req.nextUrl));
  }

  if (!canAccessPath(role, pathname)) {
    return redirect(new URL('/dashboard?denied=1', req.nextUrl));
  }

  return send(proceed());
});

export const config = {
  /**
   * Run on every path except Next.js internals, the auth endpoints themselves,
   * and static files.
   */
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
};
