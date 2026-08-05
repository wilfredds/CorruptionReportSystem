import bcrypt from 'bcryptjs';

/**
 * bcrypt cost factor. The policy requires >= 10; 12 is the current default and
 * still comfortably fast on Vercel's serverless runtime.
 */
export const BCRYPT_COST = 12;

/** Hash a plaintext password. The plaintext is never stored or logged. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/** Constant-time-ish comparison via bcrypt. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * A dummy hash compared against when the username does not exist, so that a
 * wrong username and a wrong password take roughly the same amount of time and
 * cannot be told apart by an attacker.
 */
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.9Y5t6bKlYb7NnLp3fRzTLDBP6L1YvNW';

export async function burnTime(): Promise<void> {
  await bcrypt.compare('not-a-real-password', DUMMY_HASH);
}

/** The password rules, in one place, used by Zod and shown to the user. */
export const PASSWORD_RULES = {
  minLength: 8,
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  symbol: /[^A-Za-z0-9]/,
} as const;

export interface PasswordCheck {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  symbol: boolean;
  valid: boolean;
}

/** Evaluate every rule at once — used for the live checklist in the UI. */
export function checkPassword(value: string): PasswordCheck {
  const result = {
    length: value.length >= PASSWORD_RULES.minLength,
    upper: PASSWORD_RULES.upper.test(value),
    lower: PASSWORD_RULES.lower.test(value),
    number: PASSWORD_RULES.number.test(value),
    symbol: PASSWORD_RULES.symbol.test(value),
  };
  return { ...result, valid: Object.values(result).every(Boolean) };
}

/** Generate a strong temporary password that satisfies every rule. */
export function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = upper + lower + digits + symbols;

  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 14) chars.push(pick(all));

  // Fisher-Yates so the guaranteed characters are not always in front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
