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

`js/firebase-config.js` initialises Firebase from a CDN module. As with the
sibling project, the web API key is a public identifier rather than a secret —
but there are **no `firestore.rules` in this project**, so server-side access
control is unverified. Check before storing anything user-specific.

## Scope note

`premium.html` implies a paid tier. There is no payment integration in this
codebase; treat it as a placeholder unless told otherwise.
