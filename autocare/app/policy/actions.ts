'use server';

import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { requireUser, guarded, type ActionResult } from '@/lib/session';

/** Record that the signed-in user has read and accepted the policy. */
export async function acceptPolicyAction(): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUser();

    await prisma.user.update({
      where: { id: user.id },
      data: { policyAcceptedAt: new Date() },
    });

    await audit({
      action: 'ACCEPT_POLICY',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
    });

    return { ok: true, messageKey: 'policy.acknowledged' };
  });
}
