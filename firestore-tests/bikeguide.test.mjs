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

const UID = 'device-uuid-1';

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users', UID, 'rides', 'ride1'), { distance: 10 });
  await setDoc(doc(db, 'premiumUsers', UID), { activated: true });
  await setDoc(doc(db, 'premiumRequests', 'req1'), { deviceId: UID, gcashRef: 'ABC', status: 'pending' });
});

const anon = testEnv.unauthenticatedContext().firestore();

// --- ride data ---------------------------------------------------------------

await check('can read own ride by known device id', () =>
  assertSucceeds(getDoc(doc(anon, 'users', UID, 'rides', 'ride1'))));

await check('can log a ride with a server timestamp', () =>
  assertSucceeds(addDoc(collection(anon, 'users', UID, 'rides'),
    { distance: 5, duration: 20, timestamp: serverTimestamp() })));

await check('CANNOT log a ride with a client-chosen timestamp', () =>
  assertFails(addDoc(collection(anon, 'users', UID, 'rides'),
    { distance: 5, timestamp: new Date(2020, 1, 1) })));

await check('CANNOT store a 5k-character note on a ride', () =>
  assertFails(addDoc(collection(anon, 'users', UID, 'rides'),
    { notes: 'x'.repeat(5000), timestamp: serverTimestamp() })));

await check('can delete own ride', () =>
  assertSucceeds(deleteDoc(doc(anon, 'users', UID, 'rides', 'ride1'))));

await check('challenge day accepts a boolean completion', () =>
  assertSucceeds(setDoc(doc(anon, 'users', UID, 'challenge', 'day_01'), { completed: true })));

// --- enumeration is what actually matters here -------------------------------

await check('CANNOT enumerate the users collection', () =>
  assertFails(getDocs(collection(anon, 'users'))));

await check('CANNOT read the unused parent user document', () =>
  assertFails(getDoc(doc(anon, 'users', UID))));

await check('CANNOT enumerate premiumUsers', () =>
  assertFails(getDocs(collection(anon, 'premiumUsers'))));

// --- premium cannot be self-granted ------------------------------------------

await check('can check own premium status', () =>
  assertSucceeds(getDoc(doc(anon, 'premiumUsers', UID))));

await check('CANNOT grant itself premium', () =>
  assertFails(setDoc(doc(anon, 'premiumUsers', 'device-uuid-2'), { activated: true })));

await check('CANNOT flip an existing premium record', () =>
  assertFails(updateDoc(doc(anon, 'premiumUsers', UID), { activated: true })));

// --- payment references are write-only ---------------------------------------

await check('can submit a premium request', () =>
  assertSucceeds(addDoc(collection(anon, 'premiumRequests'),
    { deviceId: UID, gcashRef: 'REF123', amount: 79, status: 'pending', submittedAt: serverTimestamp() })));

await check('CANNOT submit a pre-approved premium request', () =>
  assertFails(addDoc(collection(anon, 'premiumRequests'),
    { deviceId: UID, gcashRef: 'REF123', amount: 79, status: 'approved', submittedAt: serverTimestamp() })));

await check('CANNOT read back premium requests (GCash refs)', () =>
  assertFails(getDoc(doc(anon, 'premiumRequests', 'req1'))));

await check('CANNOT list premium requests', () =>
  assertFails(getDocs(collection(anon, 'premiumRequests'))));

await check('CANNOT approve a premium request', () =>
  assertFails(updateDoc(doc(anon, 'premiumRequests', 'req1'), { status: 'approved' })));

// --- catch-all ---------------------------------------------------------------

await check('arbitrary collections are denied', () =>
  assertFails(setDoc(doc(anon, 'whatever', 'x'), { a: 1 })));

await testEnv.cleanup();

let failed = 0;
for (const [status, name, err] of results) {
  if (status === 'FAIL') { failed++; console.log(`  ✗ ${name}\n      ${err}`); }
  else console.log(`  ✓ ${name}`);
}
console.log(`\n  ${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
