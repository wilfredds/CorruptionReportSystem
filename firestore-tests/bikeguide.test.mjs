// Rules tests for bike-guide-app/firestore.rules
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, addDoc, collection, updateDoc, deleteDoc,
  getDocs, serverTimestamp,
} from 'firebase/firestore';

const RULES = new URL('../bike-guide-app/firestore.rules', import.meta.url);

const results = [];
async function check(name, fn) {
  try { await fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name, e.message]); }
}

const testEnv = await initializeTestEnvironment({
  projectId: 'bikeguide-rules-test',
  firestore: { rules: readFileSync(RULES, 'utf8'), host: '127.0.0.1', port: 8080 },
});

await testEnv.clearFirestore();

const ALICE = 'alice-uid';
const BOB = 'bob-uid';
const LEGACY = 'legacy-uuid-alice';

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  // Alice's authenticated account, claiming her old device ID.
  await setDoc(doc(db, 'users', ALICE), { createdAt: '2026-08-17', legacyId: LEGACY });
  await setDoc(doc(db, 'users', ALICE, 'rides', 'r1'), { distanceKm: 10 });
  // Bob has an account with no legacy claim.
  await setDoc(doc(db, 'users', BOB), { createdAt: '2026-08-17' });
  // Alice's pre-auth data, still at the old path.
  await setDoc(doc(db, 'users', LEGACY, 'rides', 'old1'), { distanceKm: 42 });
  await setDoc(doc(db, 'users', LEGACY, 'challenge', 'day_01'), { day: 1, completed: true });
  await setDoc(doc(db, 'premiumUsers', LEGACY), { activated: true });
  await setDoc(doc(db, 'premiumUsers', ALICE), { activated: true });
  await setDoc(doc(db, 'premiumRequests', 'req1'), { deviceId: ALICE, gcashRef: 'ABC', status: 'pending' });
});

const anon = testEnv.unauthenticatedContext().firestore();
const alice = testEnv.authenticatedContext(ALICE).firestore();
const bob = testEnv.authenticatedContext(BOB).firestore();

// --- ownership is now actually enforced ------------------------------------

await check('unauthenticated CANNOT read anyone\'s rides', () =>
  assertFails(getDoc(doc(anon, 'users', ALICE, 'rides', 'r1'))));

await check('unauthenticated CANNOT write rides', () =>
  assertFails(setDoc(doc(anon, 'users', ALICE, 'rides', 'r2'), { distanceKm: 1 })));

await check('owner CAN read own ride', () =>
  assertSucceeds(getDoc(doc(alice, 'users', ALICE, 'rides', 'r1'))));

await check('owner CAN list own rides', () =>
  assertSucceeds(getDocs(collection(alice, 'users', ALICE, 'rides'))));

await check('another user CANNOT read someone else\'s rides', () =>
  assertFails(getDoc(doc(bob, 'users', ALICE, 'rides', 'r1'))));

await check('another user CANNOT list someone else\'s rides', () =>
  assertFails(getDocs(collection(bob, 'users', ALICE, 'rides'))));

await check('another user CANNOT write into someone else\'s rides', () =>
  assertFails(setDoc(doc(bob, 'users', ALICE, 'rides', 'evil'), { distanceKm: 1 })));

await check('another user CANNOT delete someone else\'s ride', () =>
  assertFails(deleteDoc(doc(bob, 'users', ALICE, 'rides', 'r1'))));

await check('owner CAN log a ride', () =>
  assertSucceeds(addDoc(collection(alice, 'users', ALICE, 'rides'),
    { distanceKm: 5, durationMinutes: 20, timestamp: serverTimestamp() })));

await check('CANNOT store a 5k-character ride note', () =>
  assertFails(addDoc(collection(alice, 'users', ALICE, 'rides'),
    { notes: 'x'.repeat(5000) })));

await check('owner CAN mark a challenge day complete', () =>
  assertSucceeds(setDoc(doc(alice, 'users', ALICE, 'challenge', 'day_02'),
    { day: 2, completed: true })));

await check('another user CANNOT mark someone else\'s challenge day', () =>
  assertFails(setDoc(doc(bob, 'users', ALICE, 'challenge', 'day_03'),
    { day: 3, completed: true })));

// --- enumeration -------------------------------------------------------------

await check('CANNOT enumerate the users collection', () =>
  assertFails(getDocs(collection(alice, 'users'))));

await check('CANNOT read another user\'s profile', () =>
  assertFails(getDoc(doc(bob, 'users', ALICE))));

await check('owner CAN read own profile', () =>
  assertSucceeds(getDoc(doc(alice, 'users', ALICE))));

// --- the migration bridge ----------------------------------------------------

await check('legacy claimant CAN read their old rides', () =>
  assertSucceeds(getDocs(collection(alice, 'users', LEGACY, 'rides'))));

await check('legacy claimant CAN read their old challenge progress', () =>
  assertSucceeds(getDocs(collection(alice, 'users', LEGACY, 'challenge'))));

await check('legacy claimant CAN delete the old copy after migrating', () =>
  assertSucceeds(deleteDoc(doc(alice, 'users', LEGACY, 'challenge', 'day_01'))));

await check('a user with NO legacy claim CANNOT read that legacy data', () =>
  assertFails(getDocs(collection(bob, 'users', LEGACY, 'rides'))));

await check('unauthenticated CANNOT read legacy data', () =>
  assertFails(getDocs(collection(anon, 'users', LEGACY, 'rides'))));

await check('legacy claimant CANNOT write into the legacy subtree', () =>
  assertFails(setDoc(doc(alice, 'users', LEGACY, 'rides', 'injected'), { distanceKm: 1 })));

await check('legacyId is write-once — cannot be repointed at another victim', () =>
  assertFails(updateDoc(doc(alice, 'users', ALICE), { legacyId: 'someone-elses-uuid' })));

await check('a new profile CANNOT carry unexpected fields', () =>
  assertFails(setDoc(doc(bob, 'users', BOB), { createdAt: 'x', isAdmin: true })));

// --- premium cannot be self-granted -----------------------------------------

await check('owner CAN check own premium status', () =>
  assertSucceeds(getDoc(doc(alice, 'premiumUsers', ALICE))));

await check('legacy claimant CAN check premium bought under the old ID', () =>
  assertSucceeds(getDoc(doc(alice, 'premiumUsers', LEGACY))));

await check('another user CANNOT read someone else\'s premium record', () =>
  assertFails(getDoc(doc(bob, 'premiumUsers', ALICE))));

await check('CANNOT grant itself premium', () =>
  assertFails(setDoc(doc(alice, 'premiumUsers', ALICE), { activated: true })));

await check('CANNOT enumerate premiumUsers', () =>
  assertFails(getDocs(collection(alice, 'premiumUsers'))));

// --- payment references are write-only ---------------------------------------

await check('signed-in user CAN submit a premium request', () =>
  assertSucceeds(addDoc(collection(alice, 'premiumRequests'),
    { deviceId: ALICE, gcashRef: 'REF123', amount: 79, status: 'pending', submittedAt: serverTimestamp() })));

await check('CANNOT file a request under another user\'s id', () =>
  assertFails(addDoc(collection(bob, 'premiumRequests'),
    { deviceId: ALICE, gcashRef: 'REF123', amount: 79, status: 'pending', submittedAt: serverTimestamp() })));

await check('unauthenticated CANNOT submit a premium request', () =>
  assertFails(addDoc(collection(anon, 'premiumRequests'),
    { deviceId: 'whoever', gcashRef: 'REF', status: 'pending', submittedAt: serverTimestamp() })));

await check('CANNOT submit a pre-approved premium request', () =>
  assertFails(addDoc(collection(alice, 'premiumRequests'),
    { deviceId: ALICE, gcashRef: 'REF123', amount: 79, status: 'approved', submittedAt: serverTimestamp() })));

await check('CANNOT read back premium requests (GCash refs)', () =>
  assertFails(getDoc(doc(alice, 'premiumRequests', 'req1'))));

await check('CANNOT approve a premium request', () =>
  assertFails(updateDoc(doc(alice, 'premiumRequests', 'req1'), { status: 'approved' })));

// --- catch-all ---------------------------------------------------------------

await check('arbitrary collections are denied', () =>
  assertFails(setDoc(doc(alice, 'whatever', 'x'), { a: 1 })));

await testEnv.cleanup();

let failed = 0;
for (const [status, name, err] of results) {
  if (status === 'FAIL') { failed++; console.log(`  ✗ ${name}\n      ${err}`); }
  else console.log(`  ✓ ${name}`);
}
console.log(`\n  ${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
