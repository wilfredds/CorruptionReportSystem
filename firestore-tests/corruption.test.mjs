// Rules tests for corruption-reporting-system-final/firestore.rules
import { readFileSync } from 'node:fs';
import assert from 'node:assert';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, addDoc, collection, updateDoc, deleteDoc,
  getDocs, serverTimestamp,
} from 'firebase/firestore';

const RULES = new URL('../corruption-reporting-system-final/firestore.rules', import.meta.url);

const results = [];
async function check(name, fn) {
  try { await fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name, e.message]); }
}

const testEnv = await initializeTestEnvironment({
  projectId: 'corruption-rules-test',
  firestore: { rules: readFileSync(RULES, 'utf8'), host: '127.0.0.1', port: 8080 },
});

await testEnv.clearFirestore();

// Seed: one admin UID in the allowlist, plus an existing report and stats doc.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'admins', 'admin-uid'), { email: 'admin@example.com' });
  await setDoc(doc(db, 'reports', 'existing'), {
    name: 'Reporter', contactNumber: '0900', department: 'Public Works',
    location: 'Manila', description: 'Something happened', status: 'Pending',
    date: '2026-08-17',
  });
  await setDoc(doc(db, 'meta', 'publicStats'), { reportCount: 1 });
});

const anon = testEnv.unauthenticatedContext().firestore();
const signedIn = testEnv.authenticatedContext('some-user').firestore();
const admin = testEnv.authenticatedContext('admin-uid').firestore();

const validReport = () => ({
  name: 'Anonymous', contactNumber: 'Not provided', department: 'Public Works',
  location: 'Cebu', description: 'A detailed description', status: 'Pending',
  date: '2026-08-17', timestamp: serverTimestamp(),
});

// --- the core promise: anyone may report, nobody may snoop -------------------

await check('anonymous CAN submit a report', () =>
  assertSucceeds(addDoc(collection(anon, 'reports'), validReport())));

await check('anonymous CANNOT read reports', () =>
  assertFails(getDoc(doc(anon, 'reports', 'existing'))));

await check('anonymous CANNOT list reports', () =>
  assertFails(getDocs(collection(anon, 'reports'))));

await check('signed-in non-admin CANNOT read reports', () =>
  assertFails(getDoc(doc(signedIn, 'reports', 'existing'))));

await check('admin CAN read a report', () =>
  assertSucceeds(getDoc(doc(admin, 'reports', 'existing'))));

await check('admin CAN list reports', () =>
  assertSucceeds(getDocs(collection(admin, 'reports'))));

// --- the admins allowlist stays private -------------------------------------

await check('anonymous CANNOT read the admins allowlist', () =>
  assertFails(getDocs(collection(anon, 'admins'))));

await check('admin CANNOT read the admins allowlist either', () =>
  assertFails(getDoc(doc(admin, 'admins', 'admin-uid'))));

await check('nobody can add themselves as an admin', () =>
  assertFails(setDoc(doc(signedIn, 'admins', 'some-user'), { email: 'x' })));

// --- submission shape is pinned ---------------------------------------------

await check('report CANNOT be created pre-set to Resolved', () =>
  assertFails(addDoc(collection(anon, 'reports'), { ...validReport(), status: 'Resolved' })));

await check('report CANNOT use a client-chosen timestamp', () =>
  assertFails(addDoc(collection(anon, 'reports'), { ...validReport(), timestamp: new Date(2020, 1, 1) })));

await check('report CANNOT carry unexpected fields', () =>
  assertFails(addDoc(collection(anon, 'reports'), { ...validReport(), isAdmin: true })));

await check('report CANNOT have an empty description', () =>
  assertFails(addDoc(collection(anon, 'reports'), { ...validReport(), description: '' })));

await check('report CANNOT carry a 20k-character description', () =>
  assertFails(addDoc(collection(anon, 'reports'), { ...validReport(), description: 'x'.repeat(20000) })));

await check('report CANNOT omit the department', () => {
  const r = validReport(); delete r.department;
  return assertFails(addDoc(collection(anon, 'reports'), r));
});

// --- admin triage is limited to status --------------------------------------

await check('admin CAN move status to Under Review', () =>
  assertSucceeds(updateDoc(doc(admin, 'reports', 'existing'), { status: 'Under Review' })));

await check('admin CANNOT set an arbitrary status', () =>
  assertFails(updateDoc(doc(admin, 'reports', 'existing'), { status: 'Whatever' })));

await check('admin CANNOT rewrite the description (evidence integrity)', () =>
  assertFails(updateDoc(doc(admin, 'reports', 'existing'), { description: 'tampered' })));

await check('admin CANNOT edit the reporter name', () =>
  assertFails(updateDoc(doc(admin, 'reports', 'existing'), { name: 'someone else' })));

await check('anonymous CANNOT update a report', () =>
  assertFails(updateDoc(doc(anon, 'reports', 'existing'), { status: 'Resolved' })));

await check('anonymous CANNOT delete a report', () =>
  assertFails(deleteDoc(doc(anon, 'reports', 'existing'))));

await check('admin CAN delete a report', () =>
  assertSucceeds(deleteDoc(doc(admin, 'reports', 'existing'))));

// --- public stats ------------------------------------------------------------

await check('anonymous CAN read public stats', () =>
  assertSucceeds(getDoc(doc(anon, 'meta', 'publicStats'))));

await check('anonymous CANNOT write public stats', () =>
  assertFails(setDoc(doc(anon, 'meta', 'publicStats'), { reportCount: 9999 })));

// --- catch-all ---------------------------------------------------------------

await check('arbitrary collections are denied', () =>
  assertFails(setDoc(doc(anon, 'somethingElse', 'x'), { a: 1 })));

await testEnv.cleanup();

let failed = 0;
for (const [status, name, err] of results) {
  if (status === 'FAIL') { failed++; console.log(`  ✗ ${name}\n      ${err}`); }
  else console.log(`  ✓ ${name}`);
}
console.log(`\n  ${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
