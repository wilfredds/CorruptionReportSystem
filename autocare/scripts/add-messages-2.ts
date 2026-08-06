/**
 * Corrects the wording of `account.otherDevicesNote` in every locale, and
 * removes `login.passwordChangedNotice`.
 *
 * Both date from a wrong diagnosis: a browser test was clicking the app bar's
 * Log out button instead of the form's own Save button, which looked like
 * "changing your password signs this browser out too". It does not — the form
 * refreshes the session token, and only the OTHER devices are signed out. The
 * note now says that, and the login-page banner that explained the imaginary
 * sign-out is gone.
 *
 * Kept as a script rather than six hand edits so every locale is guaranteed to
 * end up with the same set of keys — a key missing from one language is a
 * runtime error in that language only, which is exactly the sort of bug that
 * reaches production. Re-running is safe.
 *
 *   npx tsx scripts/add-messages-2.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Bundle = Record<string, Record<string, unknown>>;

/** Namespace -> key -> text, per locale. These values always win. */
const CORRECTIONS: Record<string, Record<string, Record<string, string>>> = {
  en: {
    account: {
      otherDevicesNote:
        'Changing your password signs you out on every other phone or computer. You stay signed in here.',
    },
  },
  fil: {
    account: {
      otherDevicesNote:
        'Kapag pinalitan ninyo ang password, mala-log out po ang lahat ng ibang telepono at kompyuter. Dito po ay mananatili kayong naka-log in.',
    },
  },
  es: {
    account: {
      otherDevicesNote:
        'Al cambiar su contraseña se cerrará la sesión en todos los demás teléfonos y ordenadores. Aquí seguirá con la sesión iniciada.',
    },
  },
  ja: {
    account: {
      otherDevicesNote:
        'パスワードを変更すると、他のすべての端末からログアウトされます。この端末はログインしたままです。',
    },
  },
  ko: {
    account: {
      otherDevicesNote:
        '비밀번호를 변경하면 다른 모든 기기에서 로그아웃됩니다. 이 기기는 로그인 상태로 유지됩니다.',
    },
  },
  zh: {
    account: {
      otherDevicesNote:
        '更改密码后，其他所有手机和电脑都会退出登录。本设备将保持登录状态。',
    },
  },
};

/** Keys that should no longer exist anywhere. */
const REMOVALS: [namespace: string, key: string][] = [['login', 'passwordChangedNotice']];

for (const locale of Object.keys(CORRECTIONS)) {
  const path = join(process.cwd(), 'messages', `${locale}.json`);
  const bundle = JSON.parse(readFileSync(path, 'utf8')) as Bundle;

  for (const [namespace, entries] of Object.entries(CORRECTIONS[locale])) {
    bundle[namespace] ??= {};
    for (const [key, value] of Object.entries(entries)) bundle[namespace][key] = value;
  }

  for (const [namespace, key] of REMOVALS) {
    if (bundle[namespace]) delete bundle[namespace][key];
  }

  writeFileSync(path, JSON.stringify(bundle, null, 2) + '\n', 'utf8');
  const count = Object.values(bundle).reduce(
    (n, ns) => n + Object.keys(ns as object).length,
    0,
  );
  console.log(`${locale}: ${count} keys`);
}
