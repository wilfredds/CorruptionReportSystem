import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { AppRole } from './rbac';

/**
 * Server-side session guards.
 *
 * THIS is the security boundary — not the middleware. Every server action,
 * route handler and page calls one of these before it touches data, because a
 * request can be aimed straight at an endpoint without ever rendering a page.
 */

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: AppRole;
  locale: string;
  policyAccepted: boolean;
}

/** The signed-in user, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? session.user.username,
    username: session.user.username,
    role: session.user.role,
    locale: session.user.locale,
    policyAccepted: session.user.policyAccepted,
  };
}

/** Thrown by the `require*` helpers used inside server actions. */
export class AuthorizationError extends Error {
  constructor(
    public readonly kind: 'unauthenticated' | 'forbidden',
    message = kind,
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * For PAGES: redirect somewhere friendly rather than showing an error.
 */
export async function requirePageUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

export async function requirePageAdmin(): Promise<SessionUser> {
  const user = await requirePageUser();
  if (user.role !== 'ADMIN') redirect('/dashboard?denied=1');
  return user;
}

/**
 * For SERVER ACTIONS and ROUTE HANDLERS: throw, so the caller can turn it into
 * a plain-language message instead of a redirect mid-mutation.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError('unauthenticated');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new AuthorizationError('forbidden');
  return user;
}

/** Require a specific capability from lib/rbac's `can` map. */
export async function requireCapability(
  check: (role: AppRole | undefined) => boolean,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!check(user.role)) throw new AuthorizationError('forbidden');
  return user;
}

/** The shape every server action returns, so forms can handle results uniformly. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; messageKey?: string }
  | { ok: false; messageKey: string; fieldErrors?: Record<string, string> };

/**
 * Wrap a server action body so an authorization failure or an unexpected crash
 * becomes a friendly message key instead of a stack trace on the user's screen.
 */
export async function guarded<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false,
        messageKey: error.kind === 'unauthenticated' ? 'errors.forbidden' : 'errors.forbidden',
      };
    }
    // Next.js signals redirect/notFound by throwing — let those through.
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as { digest?: unknown }).digest === 'string' &&
      ((error as { digest: string }).digest.startsWith('NEXT_REDIRECT') ||
        (error as { digest: string }).digest === 'NEXT_NOT_FOUND')
    ) {
      throw error;
    }
    console.error('[action] unhandled error', error);
    return { ok: false, messageKey: 'common.unknownError' };
  }
}
