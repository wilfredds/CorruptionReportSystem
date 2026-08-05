/**
 * Integration checks for the login security controls.
 *
 * These drive `lib/auth-logic.ts` directly — the same module the login server
 * action calls — against a real database, and assert the behaviour the security
 * policy promises: five failures lock the account for 15 minutes, a locked
 * account rejects even the correct password, and every attempt is audited.
 *
 * Needs a running database (DATABASE_URL). Run with:
 *   npx tsx tests/security.test.ts
 */

import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  verifyCredentials,
  recordFailedLogin,
  recordSuccessfulLogin,
} from '../lib/auth-logic.ts';
import { MAX_FAILED_LOGINS, LOCKOUT_MINUTES } from '../lib/rate-limit.ts';
import { checkPassword } from '../lib/password.ts';
import { passwordSchema } from '../lib/validation.ts';

const prisma = new PrismaClient();

const USERNAME = 'testing-lockout';
const GOOD = 'LockTest#2026';
const BAD = 'wrong-password';

let passed = 0;
let failed = 0;

async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}`);
    console.log(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function resetUser() {
  await prisma.user.upsert({
    where: { username: USERNAME },
    create: {
      name: 'Lockout Test',
      username: USERNAME,
      role: 'STAFF',
      passwordHash: await bcrypt.hash(GOOD, 12),
    },
    update: {
      passwordHash: await bcrypt.hash(GOOD, 12),
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

async function main() {
  console.log('\nSecurity policy checks\n');

  await resetUser();

  await check('the password policy rejects weak passwords', () => {
    for (const weak of ['short1!A', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoSymbols123', 'NoDigits!!Aa']) {
      const viaZod = passwordSchema.safeParse(weak).success;
      const viaChecklist = checkPassword(weak).valid;
      assert.equal(viaZod, viaChecklist, `client and server disagree about "${weak}"`);
    }
    assert.equal(passwordSchema.safeParse('Sh0rt!1').success, false, 'must be >= 8 chars');
    assert.equal(passwordSchema.safeParse(GOOD).success, true, 'a compliant password must pass');
  });

  await check('the correct password is accepted', async () => {
    const result = await verifyCredentials(USERNAME, GOOD);
    assert.equal(result.ok, true);
  });

  await check('a wrong password is rejected', async () => {
    const result = await verifyCredentials(USERNAME, BAD);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'invalid');
  });

  await check('an unknown username is rejected without leaking that it is unknown', async () => {
    const result = await verifyCredentials('no-such-person', BAD);
    assert.equal(result.ok, false);
    // Same reason code as a wrong password, so the two are indistinguishable.
    if (!result.ok) assert.equal(result.reason, 'invalid');
  });

  await check(`${MAX_FAILED_LOGINS} consecutive failures lock the account`, async () => {
    await resetUser();
    for (let attempt = 1; attempt <= MAX_FAILED_LOGINS; attempt++) {
      const result = await verifyCredentials(USERNAME, BAD);
      assert.equal(result.ok, false);
      const outcome = await recordFailedLogin(USERNAME, '10.0.0.1', 'invalid');
      if (attempt < MAX_FAILED_LOGINS) {
        assert.equal(outcome.locked, false, `locked too early at attempt ${attempt}`);
      } else {
        assert.equal(outcome.locked, true, 'should be locked on the final attempt');
      }
    }

    const user = await prisma.user.findUnique({ where: { username: USERNAME } });
    assert.ok(user?.lockedUntil, 'lockedUntil must be set');
    assert.equal(user?.failedLoginAttempts, MAX_FAILED_LOGINS);

    const minutes = (user!.lockedUntil!.getTime() - Date.now()) / 60_000;
    assert.ok(
      minutes > LOCKOUT_MINUTES - 1 && minutes <= LOCKOUT_MINUTES,
      `lockout should last about ${LOCKOUT_MINUTES} minutes, got ${minutes.toFixed(1)}`,
    );
  });

  await check('a locked account rejects even the CORRECT password', async () => {
    const result = await verifyCredentials(USERNAME, GOOD);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'locked');
  });

  await check('every failure and the lockout itself are written to the audit log', async () => {
    const failures = await prisma.auditLog.count({
      where: { action: 'LOGIN_FAILED', metadata: { path: ['username'], equals: USERNAME } },
    });
    assert.ok(failures >= MAX_FAILED_LOGINS, `expected >= ${MAX_FAILED_LOGINS} rows, got ${failures}`);

    const locks = await prisma.auditLog.count({
      where: { action: 'ACCOUNT_LOCKED', metadata: { path: ['username'], equals: USERNAME } },
    });
    assert.ok(locks >= 1, 'the lockout must be audited');
  });

  await check('a successful login clears the counters and is audited', async () => {
    await resetUser();
    const result = await verifyCredentials(USERNAME, GOOD);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    await recordSuccessfulLogin(result.user.id, '10.0.0.1');

    const user = await prisma.user.findUnique({ where: { id: result.user.id } });
    assert.equal(user?.failedLoginAttempts, 0);
    assert.equal(user?.lockedUntil, null);
    assert.ok(user?.lastLoginAt, 'lastLoginAt must be stamped');

    const logins = await prisma.auditLog.count({
      where: { action: 'LOGIN', userId: result.user.id },
    });
    assert.ok(logins >= 1, 'the login must be audited');
  });

  await check('a deactivated account cannot log in', async () => {
    await prisma.user.update({ where: { username: USERNAME }, data: { isActive: false } });
    const result = await verifyCredentials(USERNAME, GOOD);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'inactive');
    await prisma.user.update({ where: { username: USERNAME }, data: { isActive: true } });
  });

  await check('passwords are stored only as bcrypt hashes', async () => {
    const user = await prisma.user.findUnique({ where: { username: USERNAME } });
    assert.ok(user?.passwordHash.startsWith('$2'), 'must be a bcrypt hash');
    assert.ok(!user!.passwordHash.includes(GOOD), 'the plaintext must not appear anywhere');
    const cost = Number(user!.passwordHash.split('$')[2]);
    assert.ok(cost >= 10, `bcrypt cost must be >= 10, got ${cost}`);
  });

  await check('no audit row ever contains a plaintext password', async () => {
    const rows = await prisma.auditLog.findMany({ select: { metadata: true } });
    const blob = JSON.stringify(rows);
    assert.ok(!blob.includes(GOOD), 'a password leaked into the audit log');
    assert.ok(!blob.includes(BAD), 'an attempted password leaked into the audit log');
  });

  // Clean up the fixture account.
  await prisma.user.deleteMany({ where: { username: USERNAME } });

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
