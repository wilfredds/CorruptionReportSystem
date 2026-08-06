'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { requireAdmin, guarded, type ActionResult } from '@/lib/session';
import { createUserSchema, resetPasswordSchema, fieldErrors } from '@/lib/validation';
import { hashPassword } from '@/lib/password';

/**
 * User management — ADMIN only, re-checked on every call.
 *
 * Plaintext passwords never leave this module: they are hashed immediately and
 * are never written to the audit log or the server console.
 */

export async function createUserAction(input: {
  name: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
}): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireAdmin();

    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        messageKey: 'errors.requiredField',
        fieldErrors: fieldErrors(parsed.error),
      };
    }

    try {
      const user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          username: parsed.data.username,
          role: parsed.data.role,
          passwordHash: await hashPassword(parsed.data.password),
          // The admin knows this password, so it is a one-time key: the new
          // user must set their own before they can use the system.
          mustChangePassword: true,
        },
        select: { id: true, username: true, role: true },
      });

      await audit({
        userId: admin.id,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: user.id,
        // The password is deliberately absent from this record.
        metadata: { username: user.username, role: user.role },
      });

      revalidatePath('/users');
      return { ok: true, data: { id: user.id }, messageKey: 'users.created' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { ok: false, messageKey: 'users.usernameTaken' };
      }
      throw error;
    }
  });
}

export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireAdmin();

    // Locking yourself out of the only admin account is not a recoverable state.
    if (userId === admin.id && !isActive) {
      return { ok: false, messageKey: 'users.cannotDeactivateSelf' };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        // Re-enabling an account also clears any stale lockout.
        ...(isActive ? { failedLoginAttempts: 0, lockedUntil: null } : {}),
        // Turning an account off must take effect NOW, not whenever their
        // 30-minute token happens to expire. Bumping this invalidates every
        // session they already hold (checked in lib/session.ts).
        ...(isActive ? {} : { tokenVersion: { increment: 1 } }),
      },
      select: { id: true, username: true },
    });

    await audit({
      userId: admin.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      metadata: { username: user.username, isActive },
    });

    revalidatePath('/users');
    return { ok: true, messageKey: isActive ? 'users.activated' : 'users.deactivated' };
  });
}

export async function resetPasswordAction(input: {
  userId: string;
  password: string;
}): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireAdmin();

    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        messageKey: 'errors.requiredField',
        fieldErrors: fieldErrors(parsed.error),
      };
    }

    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        // A fresh password clears the lockout so they can log straight in.
        failedLoginAttempts: 0,
        lockedUntil: null,
        // Anyone holding a session on the old password is signed out.
        tokenVersion: { increment: 1 },
        // An admin picked this password, so the owner of the account has to
        // replace it with one only they know before doing anything else.
        mustChangePassword: true,
      },
      select: { id: true, username: true },
    });

    await audit({
      userId: admin.id,
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user.id,
      metadata: { username: user.username },
    });

    revalidatePath('/users');
    return { ok: true, messageKey: 'users.passwordReset' };
  });
}

/** Clear a lockout early, when the owner knows the person is legitimate. */
export async function unlockUserAction(userId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireAdmin();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
      select: { id: true, username: true },
    });

    await audit({
      userId: admin.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      metadata: { username: user.username, unlocked: true },
    });

    revalidatePath('/users');
    return { ok: true, messageKey: 'users.unlocked' };
  });
}
