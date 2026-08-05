'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { loginSchema } from '@/lib/validation';
import { verifyCredentials, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth-logic';
import { getClientIp } from '@/lib/audit';
import { hit, reset, LOCKOUT_MINUTES } from '@/lib/rate-limit';

/**
 * The login server action.
 *
 * Order of business:
 *   1. Validate the shape of the input with Zod.
 *   2. Rate-limit by IP (best-effort, per instance).
 *   3. Verify the credentials read-only, so we can tell the user *why* it
 *      failed in plain language.
 *   4. Count the failure (and lock the account at 5) or clear the counters.
 *   5. Only on success, hand over to Auth.js to mint the session cookie.
 *
 * Next.js verifies the Origin header against the Host header on every Server
 * Action call, which is what protects this endpoint from cross-site POSTs.
 */

export interface LoginState {
  error?: string;
  /** Interpolation values for the error message (e.g. minutes remaining). */
  values?: Record<string, string | number>;
  attemptsLeft?: number;
}

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'login.errorInvalid' };
  }

  const { username, password } = parsed.data;
  const ip = await getClientIp();

  const limited = hit(`login:${ip ?? 'unknown'}`);
  if (!limited.allowed) {
    return { error: 'login.errorTooMany' };
  }

  const result = await verifyCredentials(username, password);

  if (!result.ok) {
    const outcome = await recordFailedLogin(username, ip, result.reason);

    if (result.reason === 'locked') {
      return {
        error: 'login.errorLocked',
        values: { minutes: result.minutesRemaining },
      };
    }
    if (outcome.locked) {
      return { error: 'login.errorLocked', values: { minutes: LOCKOUT_MINUTES } };
    }
    if (result.reason === 'inactive') {
      return { error: 'login.errorInactive' };
    }
    return { error: 'login.errorInvalid', attemptsLeft: outcome.attemptsRemaining };
  }

  await recordSuccessfulLogin(result.user.id, ip);
  reset(`login:${ip ?? 'unknown'}`);

  try {
    // `authorize` re-verifies everything; this call is what issues the cookie.
    await signIn('credentials', { username, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'login.errorGeneric' };
    }
    throw error;
  }

  return {};
}
