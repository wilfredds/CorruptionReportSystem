'use server';

import { signOut } from '@/auth';
import { audit } from '@/lib/audit';
import { getSessionUser } from '@/lib/session';

export async function signOutAction(): Promise<void> {
  const user = await getSessionUser();
  if (user) {
    await audit({ userId: user.id, action: 'LOGOUT', entity: 'User', entityId: user.id });
  }
  await signOut({ redirectTo: '/login' });
}
