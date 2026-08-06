'use server';

import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { requireUser, guarded, type ActionResult } from '@/lib/session';
import { changeOwnPasswordSchema, fieldErrors } from '@/lib/validation';
import { hashPassword, verifyPassword } from '@/lib/password';

/**
 * Changing your own password.
 *
 * This closes two gaps at once. Before, only an ADMIN could set someone
 * else's password, so a user who thought theirs had been seen had no way to
 * replace it themselves — and the seeded owner accounts kept the password
 * printed in the README until an admin intervened.
 *
 * The current password is required, so someone who walks up to an unlocked
 * phone cannot lock the real owner out of their own account.
 */
export async function changeOwnPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult<{ tokenVersion: number }>> {
  const result = await guarded(async () => {
    const me = await requireUser();

    const parsed = changeOwnPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        messageKey: 'errors.requiredField',
        fieldErrors: fieldErrors(parsed.error),
      };
    }

    const row = await prisma.user.findUnique({
      where: { id: me.id },
      select: { passwordHash: true },
    });
    if (!row) return { ok: false, messageKey: 'errors.forbidden' };

    const ok = await verifyPassword(parsed.data.currentPassword, row.passwordHash);
    if (!ok) {
      return { ok: false, messageKey: 'account.wrongCurrentPassword' };
    }

    // Refuse a no-op change: it would give a false sense of having rotated.
    if (await verifyPassword(parsed.data.newPassword, row.passwordHash)) {
      return { ok: false, messageKey: 'account.sameAsOld' };
    }

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: {
        passwordHash: await hashPassword(parsed.data.newPassword),
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        // Invalidates every session issued for this account, on every device.
        tokenVersion: { increment: 1 },
      },
      select: { tokenVersion: true },
    });

    await audit({
      userId: me.id,
      action: 'CHANGE_OWN_PASSWORD',
      entity: 'User',
      entityId: me.id,
      metadata: { username: me.username },
    });

    return {
      ok: true,
      data: { tokenVersion: updated.tokenVersion },
      messageKey: 'account.passwordChanged',
    };
  });

  return result;
}
