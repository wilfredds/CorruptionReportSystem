# Corruption Reporting System — working notes

A public corruption reporting site: citizens submit a department and a
description (optionally anonymously), and an admin page reviews submissions.

**Stack:** static HTML/CSS/JS, no build step, no package manager. Firebase
(Firestore) loaded from the gstatic CDN as ES modules.

## Commands

There are none. No `package.json`, no bundler, no tests, no CI. Open the HTML
directly or serve the folder:

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

Because it is served over `file://` or a plain static server and uses ES module
imports, **use a local server rather than opening `index.html` directly** —
module imports fail on `file://`.

To verify UI changes in a session, the vendored `webapp-testing` skill drives
Playwright against that local server.

## Layout — read this before editing

The file layout is misleading:

- `js/app.js` and `js/admin.js` are **empty files (0 bytes)**. They are stubs.
- All actual behaviour lives in **inline `<script>` blocks** inside
  `index.html` (from roughly line 918) and `admin.html`.
- `js/firebase-config.js` is the only JS file with content — it initialises
  Firebase and exports Firestore.

So: to change behaviour, edit the inline script in the HTML, not the empty
files. If you move logic out into `app.js`/`admin.js`, that is an improvement,
but do it deliberately and wire up the `<script type="module">` tags.

- `index.html` (~1200 lines) — public report form plus an inline help/chat
  responder
- `admin.html` (~670 lines) — review interface, Firebase Auth login
- `firestore.rules` — the actual access control; see below
- `css/style.css` · `assets/images/`

### The homepage report counter

`loadReportsCount()` reads `meta/publicStats`, not the `reports` collection. It
used to call `getDocs(collection(db, 'reports'))` and use `snapshot.size`, which
downloaded every report — names, contact numbers, descriptions — into any
visitor's browser just to render a number.

Nothing populates `meta/publicStats` yet, so the counter shows `—`. Making it
live needs a Cloud Function incrementing `reportCount` on report creation. Do
not "fix" it by reading the reports collection again.

## Firebase and security

`js/firebase-config.js` contains a real Firebase web config. That is normal —
Firebase web API keys are public identifiers, not secrets, and are meant to
ship to the browser. They are **not** an access control mechanism.

What protects the data is `firestore.rules`. In short:

- **anyone may create a report**, anonymously, with a pinned document shape —
  a submitter cannot set their own status or attach extra fields
- **nobody may read a report except an admin**; reports name both the accused
  and, optionally, the reporter
- **admins may only change `status`** — the description, name and contact
  number are evidence and are immutable after submission
- the `admins` allowlist is **unreadable by every client**. `exists()` in rules
  is a server-side lookup, so membership is checked without shipping the list
- `meta/publicStats` is the one publicly readable document, for the homepage
  counter

Rules are covered by 25 assertions in `../firestore-tests/corruption.test.mjs`.
Run them with `cd ../firestore-tests && npm install && npm run test:corruption`.
**Add a denial test before loosening any rule.**

### Admin authentication

Admins sign in with **Firebase Authentication**, via
`signInWithEmailAndPassword` in `admin.html`.

Setup, in order — the dashboard has no working login until all three are done:

1. **Enable the Email/Password provider.** Firebase console → Authentication →
   Sign-in method → Email/Password → Enable. Without this, no admin user can be
   created and every sign-in attempt fails.
2. **Create the user.** Authentication → Users → Add user. Copy the generated
   **UID**.
3. **Add the allowlist entry.** Create a document in `admins` whose **ID is that
   UID**. The body may be empty; an `email` field helps auditing. Repeat 2–3 per
   admin.

Never store a password in Firestore. Firebase Auth holds credentials; `admins`
holds only UIDs.

This replaced an earlier scheme that downloaded the whole `admins` collection
and compared passwords in client-side JavaScript — which exposed every admin
password to anyone who opened devtools, and let the dashboard be unlocked by
setting a `sessionStorage` flag. If you are tempted to add a "quick" client-side
check again, don't: hiding UI is cosmetic, and only the rules actually gate data.

### Deploying rules

Not automated. `firebase.json` points the CLI at `firestore.rules` and
`.firebaserc` pins the project to `corruption-reporting-system`, so from this
directory:

```bash
firebase login          # once, per machine
firebase deploy --only firestore:rules
```

Do this **after** the admin setup above. Deploying first locks admins out of a
dashboard they cannot yet sign in to.

Until the deploy is run, the rules in this repo are **not** the rules in
production.

### Honest copy

The site previously told users their report was "encrypted with military-grade
security" and that "we don't track IP addresses". Neither was true. The copy now
describes what actually happens: HTTPS in transit, encrypted at rest, readable
by administrators. Keep it that way — these are promises made to people
reporting corruption, who may be taking a real risk.

## Design work

For UI changes, the vendored design skill has a directly relevant palette:

```bash
python3 ../.claude/skills/ui-ux-pro-max/scripts/search.py "civic trust government" -d color
python3 ../.claude/skills/ui-ux-pro-max/scripts/search.py "report form" --stack html-tailwind
```

Note this project uses plain CSS, not Tailwind, so treat `html-tailwind`
results as guidance to translate rather than code to paste.
