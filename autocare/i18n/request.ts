import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE, defaultLocale, fallbackLocale, isSupportedLocale } from './locales';

type Messages = Record<string, unknown>;

/**
 * Merge a translation file over the English base so that a locale file which is
 * only partially translated still renders — every missing key falls back to
 * English instead of throwing.
 */
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      out[key] = deepMerge(existing as Messages, value as Messages);
    } else if (value !== undefined && value !== '') {
      out[key] = value;
    }
  }
  return out;
}

async function loadMessages(locale: string): Promise<Messages> {
  const mod = await import(`../messages/${locale}.json`);
  return mod.default as Messages;
}

/**
 * AutoCare uses next-intl WITHOUT locale path segments: the URL stays clean
 * (`/jobs/new`, not `/fil/jobs/new`) and the language comes from a cookie that
 * is kept in sync with the signed-in user's saved preference.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const base = await loadMessages(fallbackLocale);
  const messages = locale === fallbackLocale ? base : deepMerge(base, await loadMessages(locale));

  return {
    locale,
    messages,
    // Money and dates always render with Philippine conventions for the shop,
    // but digit grouping follows the chosen language.
    formats: {
      number: {
        peso: { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 },
      },
    },
    timeZone: process.env.SHOP_TIMEZONE || 'Asia/Manila',
    now: new Date(),
    getMessageFallback({ key, namespace }) {
      return namespace ? `${namespace}.${key}` : key;
    },
    onError() {
      // Missing keys already fall back to English via deepMerge. Staying silent
      // here keeps a half-translated locale from spamming the server log.
    },
  };
});
