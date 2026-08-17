# Bike Guide PH — working notes

A cycling companion PWA for Filipino beginner-to-intermediate riders: gear
shifting guidance, Philippine routes, ride tracking and a 30-day challenge.

**Stack:** static HTML/CSS/JS, no build step, no package manager. Installable
PWA (`manifest.json` + `sw.js`). Firebase loaded from CDN.

## Commands

None — no `package.json`, no bundler, no tests, no CI. Serve the folder:

```bash
python3 -m http.server 8000
```

Use a real server rather than `file://`: the service worker will not register
and ES module imports fail otherwise.

## Layout

Multi-page, one HTML file per feature — no router, no framework:

`index.html` `dashboard.html` `tracker.html` `record.html` `routes.html`
`maintenance.html` `gear-guide.html` `knowledge.html` `safety.html`
`warmup.html` `diet.html` `carbon.html` `challenge.html` `motivation.html`
`premium.html` `offline.html`

`js/` (~1100 lines total) — `app.js`, `ui.js` (227 lines), `tracker.js`,
`recorder.js`, `routes.js`, `bike-doctor.js`, `gear-simulator.js`,
`carbon.js`, `challenge.js`, `premium.js`, `firebase-config.js`

Unlike the corruption reporting project, **these JS files have real content**.

## PWA specifics

- `sw.js` is the service worker; `offline.html` is the offline fallback.
- **Bump the cache name in `sw.js` when you change cached assets**, otherwise
  returning users keep the old files indefinitely. This is the single most
  common way to ship a change that appears not to work.
- Test in a browser with the service worker active, not just a hard reload.
  The vendored `webapp-testing` skill can drive Playwright against a local
  server for this.

## Firebase

`js/firebase-config.js` initialises Firebase from a CDN module. The web API key
is a public identifier, not a secret — `firestore.rules` is what protects data.

Collections in use: `users/{deviceId}/rides`, `users/{deviceId}/challenge`,
`premiumRequests`, `premiumUsers/{deviceId}`.

### The identity model is weak — know this before changing rules

There is **no authentication**. A user is a `bikeUserId`, a `crypto.randomUUID()`
generated in the browser (`index.html`) and kept in localStorage. The rules
engine cannot verify it: a caller picks whichever ID it likes. So the rules
**cannot enforce ownership**, and no amount of rewriting them will change that.

What they do achieve:

- **no enumeration** — `list` is denied on `users` and `premiumUsers`, so
  nobody can walk the collection and harvest everyone's data. Given the
  identity model this is the single most valuable restriction available.
- **premium cannot be self-granted** — `premiumUsers` is read-only to clients.
  If a client could write there it would just set `activated: true`.
- **payment references are write-only** — `premiumRequests` accepts a create
  and denies every read, so GCash references cannot be read back out.
- writes are shape-checked, and unknown collections are denied.

Security therefore rests on the UUID being unguessable: a capability URL. Much
better than open, but not authentication.

**The real fix is Firebase Anonymous Auth** (`signInAnonymously`), which gives a
genuine `request.auth.uid` that rules can compare against the document path. It
is a small code change with one real catch: existing users' localStorage IDs
will not match their new auth UID, so their ride history is orphaned unless it
is migrated. That is a product decision, not a mechanical one.

### Testing and deploying rules

Covered by 18 assertions in `../firestore-tests/bikeguide.test.mjs`:

```bash
cd ../firestore-tests && npm install && npm run test:bikeguide
```

Add a denial test before loosening a rule. Deployment is manual and not
automated — until `firebase deploy --only firestore:rules` is run, the rules in
this repo are not the rules in production.

## Scope note

`premium.html` implies a paid tier. Payment is manual: the user submits a GCash
reference, and an admin flips `premiumUsers/{deviceId}.activated` from the
console. There is no payment-provider integration and no automated verification
that the reference is real.
