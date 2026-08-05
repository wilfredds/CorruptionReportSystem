/**
 * The locale registry.
 *
 * TO ADD A NEW LANGUAGE:
 *   1. Copy `messages/en.json` to `messages/<code>.json` and translate it.
 *   2. Add one entry to the `locales` array below.
 * That is the whole procedure — no other file needs to change. Any key you have
 * not translated yet automatically falls back to English (see i18n/request.ts),
 * so a partially translated file is safe to ship.
 */

export interface LocaleDefinition {
  /** The code used in the cookie, on the User record, and as the filename. */
  code: string;
  /** The language's own name, shown in the switcher (never translated). */
  nativeName: string;
  /** English name, for admin screens. */
  englishName: string;
  /** BCP-47 tag used for Intl number/date formatting. */
  intlTag: string;
  /** Text direction. */
  dir: 'ltr' | 'rtl';
}

export const locales: LocaleDefinition[] = [
  { code: 'fil', nativeName: 'Filipino', englishName: 'Filipino', intlTag: 'fil-PH', dir: 'ltr' },
  { code: 'en', nativeName: 'English', englishName: 'English', intlTag: 'en-PH', dir: 'ltr' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', intlTag: 'es-ES', dir: 'ltr' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', intlTag: 'ja-JP', dir: 'ltr' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean', intlTag: 'ko-KR', dir: 'ltr' },
  { code: 'zh', nativeName: '中文', englishName: 'Chinese (Simplified)', intlTag: 'zh-CN', dir: 'ltr' },
];

export const defaultLocale = 'fil';

/** The language every other language falls back to, key by key. */
export const fallbackLocale = 'en';

export const localeCodes = locales.map((l) => l.code);

export function isSupportedLocale(value: unknown): value is string {
  return typeof value === 'string' && localeCodes.includes(value);
}

export function resolveLocale(value: unknown): string {
  return isSupportedLocale(value) ? value : defaultLocale;
}

export function getLocaleDefinition(code: string): LocaleDefinition {
  return locales.find((l) => l.code === code) ?? locales[0];
}

/** The BCP-47 tag to hand to Intl.NumberFormat / Intl.DateTimeFormat. */
export function intlTagFor(code: string): string {
  return getLocaleDefinition(resolveLocale(code)).intlTag;
}

/** Name of the cookie that remembers the visitor's language choice. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';
