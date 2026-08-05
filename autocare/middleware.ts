import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { canAccessPath, isPublicPath } from './lib/rbac';

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

  // Signed-in users have no business on the login page.
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL('/login', req.nextUrl);
    // Remember where they were headed so we can send them back after login.
    if (pathname !== '/') loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // The Acceptable Use Policy must be acknowledged before anything else.
  if (!session.user?.policyAccepted && pathname !== '/policy') {
    return NextResponse.redirect(new URL('/policy?first=1', req.nextUrl));
  }

  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL('/dashboard?denied=1', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  /**
   * Run on every path except Next.js internals, the auth endpoints themselves,
   * and static files.
   */
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
};
