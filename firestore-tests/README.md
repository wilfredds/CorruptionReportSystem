# Firestore rules tests

Tests for the security rules of the two static Firebase projects:

- `../corruption-reporting-system-final/firestore.rules`
- `../bike-guide-app/firestore.rules`

Neither site needs this directory to run — it is optional tooling, kept out of
those projects so they stay build-free.

## Running

Needs Node and a JDK (the Firestore emulator is a Java process).

```bash
cd firestore-tests
npm install
npm test
```

`npm test` boots the emulator, loads each rules file, exercises it as an
anonymous visitor, a signed-in non-admin and an admin, then shuts down.

Run one suite at a time with `npm run test:corruption` or
`npm run test:bikeguide`.

## Why bother

These rules are the only thing standing between the public internet and the
data — the Firebase web API keys in both projects are public identifiers, not
secrets. A rules file is easy to loosen by accident and the failure is silent:
nothing errors, data just becomes readable. The tests assert the negative cases
(*this must be denied*) that manual clicking never covers.

Current coverage:

| Suite | Assertions |
|---|---|
| `corruption.test.mjs` | 25 |
| `bikeguide.test.mjs` | 35 |

## Adding a rule

Add the denial test first — a rule with no failing test proves nothing. Both
files use a tiny `check(name, fn)` helper wrapping `assertSucceeds` /
`assertFails`, so a new case is one call.
