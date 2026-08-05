'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { requireAdmin, requireUser, guarded, type ActionResult } from '@/lib/session';
import { shopSettingsSchema, localeSchema, fieldErrors } from '@/lib/validation';
import { SHOP_SETTINGS_ID } from '@/lib/settings';
import { LOCALE_COOKIE } from '@/i18n/locales';

/** Shop details printed on every receipt. ADMIN only. */
export async function saveShopSettingsAction(input: {
  name: string;
  address: string;
  phone: string;
  email?: string;
  footer?: string;
}): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireAdmin();

    const parsed = shopSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        messageKey: 'errors.requiredField',
        fieldErrors: fieldErrors(parsed.error),
      };
    }

    await prisma.shopSetting.upsert({
      where: { id: SHOP_SETTINGS_ID },
      create: { id: SHOP_SETTINGS_ID, ...parsed.data },
      update: parsed.data,
    });

    await audit({
      userId: admin.id,
      action: 'UPDATE_SETTINGS',
      entity: 'ShopSetting',
      entityId: SHOP_SETTINGS_ID,
      metadata: { name: parsed.data.name },
    });

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { ok: true, messageKey: 'settings.saved' };
  });
}

/**
 * A user's own language. Any signed-in user may change their own — this is not
 * an admin action, it just also lives on the Settings page.
 */
export async function saveMyLocaleAction(locale: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUser();

    const parsed = localeSchema.safeParse({ locale });
    if (!parsed.success) return { ok: false, messageKey: 'common.unknownError' };

    await prisma.user.update({
      where: { id: user.id },
      data: { locale: parsed.data.locale },
    });

    const store = await cookies();
    store.set(LOCALE_COOKIE, parsed.data.locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    revalidatePath('/', 'layout');
    return { ok: true, messageKey: 'settings.saved' };
  });
}
