import { prisma } from './prisma';
import { verifyPassword, burnTime } from './password';
import { audit } from './audit';
import { LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from './rate-limit';

/**
 * The credential rules, kept out of the NextAuth config so that both the
 * `authorize` callback and the login server action can use them without
 * duplicating the logic — and without double-counting failed attempts.
 *
 * Division of labour:
 *   * `verifyCredentials` is READ-ONLY. It is what `authorize` calls, so any
 *     request that reaches the NextAuth endpoint directly is still checked for
 *     an inactive account, an active lockout, and the correct password.
 *   * `recordFailedLogin` / `recordSuccessfulLogin` mutate the counters and
 *     write the audit rows. Only the login server action calls them, exactly
 *     once per attempt.
 */

export type CredentialFailure =
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'inactive' }
  | { ok: false; reason: 'locked'; minutesRemaining: number };

export type CredentialResult =
  | {
      ok: true;
      user: { id: string; name: string; username: string; role: 'ADMIN' | 'STAFF'; locale: string };
    }
  | CredentialFailure;

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<CredentialResult> {
  const normalised = username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalised },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      locale: true,
      passwordHash: true,
      isActive: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    // Spend roughly the same time as a real bcrypt comparison so that a missing
    // username cannot be distinguished from a wrong password by timing.
    await burnTime();
    return { ok: false, reason: 'invalid' };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesRemaining = Math.max(
      1,
      Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000),
    );
    return { ok: false, reason: 'locked', minutesRemaining };
  }

  if (!user.isActive) {
    await burnTime();
    return { ok: false, reason: 'inactive' };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) return { ok: false, reason: 'invalid' };

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      locale: user.locale,
    },
  };
}

export interface FailedLoginOutcome {
  locked: boolean;
  attemptsRemaining: number;
  lockoutMinutes: number;
}

/**
 * Count one wrong password against the account, locking it once the limit is
 * reached, and write the audit trail. Safe to call for a username that does not
 * exist — the failure is still logged, just without a user id.
 */
export async function recordFailedLogin(
  username: string,
  ipAddress: string | null,
  reason: 'invalid' | 'inactive' | 'locked',
): Promise<FailedLoginOutcome> {
  const normalised = username.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { username: normalised },
    select: { id: true, failedLoginAttempts: true },
  });

  if (!user) {
    await audit({
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: null,
      metadata: { username: normalised, reason: 'unknown_username' },
      ipAddress,
    });
    return { locked: false, attemptsRemaining: MAX_FAILED_LOGINS, lockoutMinutes: LOCKOUT_MINUTES };
  }

  // A wrong password against an already-locked or disabled account should not
  // push the counter any further; just record the attempt.
  if (reason !== 'invalid') {
    await audit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: user.id,
      metadata: { username: normalised, reason },
      ipAddress,
    });
    return { locked: reason === 'locked', attemptsRemaining: 0, lockoutMinutes: LOCKOUT_MINUTES };
  }

  const attempts = user.failedLoginAttempts + 1;
  const shouldLock = attempts >= MAX_FAILED_LOGINS;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: attempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
    },
  });

  await audit({
    userId: user.id,
    action: 'LOGIN_FAILED',
    entity: 'User',
    entityId: user.id,
    metadata: { username: normalised, reason: 'wrong_password', attempts },
    ipAddress,
  });

  if (shouldLock) {
    await audit({
      userId: user.id,
      action: 'ACCOUNT_LOCKED',
      entity: 'User',
      entityId: user.id,
      metadata: { username: normalised, minutes: LOCKOUT_MINUTES },
      ipAddress,
    });
  }

  return {
    locked: shouldLock,
    attemptsRemaining: Math.max(0, MAX_FAILED_LOGINS - attempts),
    lockoutMinutes: LOCKOUT_MINUTES,
  };
}

/** Clear the failure counters and stamp the successful login. */
export async function recordSuccessfulLogin(
  userId: string,
  ipAddress: string | null,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await audit({ userId, action: 'LOGIN', entity: 'User', entityId: userId, ipAddress });
}
