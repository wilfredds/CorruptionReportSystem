'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { LOCALE_COOKIE, isSupportedLocale } from '@/i18n/locales';

/**
 * Remember the visitor's language.
 *
 * Anyone (even at the login screen) may set the cookie. Only a signed-in user
 * has the choice written to their User record as well — `signedIn` is a hint
 * from the client, but the session is what actually decides.
 */
export async function setLocaleAction(locale: string, _signedIn: boolean): Promise<void> {
  if (!isSupportedLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false, // read by the client only to highlight the active choice
    secure: process.env.NODE_ENV === 'production',
  });

  const user = await getSessionUser();
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { locale } });
  }
}
