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
- `admin.html` (~670 lines) — review interface
- `css/style.css` · `assets/images/`

## Firebase and security

`js/firebase-config.js` contains a real Firebase web config. That is normal —
Firebase web API keys are public identifiers, not secrets, and are meant to
ship to the browser. They are **not** an access control mechanism.

What actually protects the data is Firestore security rules, and **there are no
`firestore.rules` in this project**. Before this handles real reports, rules
need to exist and be deployed: unauthenticated users should be able to create a
report and nothing else, and reads should be restricted to admins. Assume the
current configuration is open until proven otherwise.

The UI tells users their report is "encrypted and stored securely". Nothing in
this codebase encrypts anything. Either implement it or correct the copy —
this is a promise made to people reporting corruption, so the gap matters more
than usual.

## Design work

For UI changes, the vendored design skill has a directly relevant palette:

```bash
python3 ../.claude/skills/ui-ux-pro-max/scripts/search.py "civic trust government" -d color
python3 ../.claude/skills/ui-ux-pro-max/scripts/search.py "report form" --stack html-tailwind
```

Note this project uses plain CSS, not Tailwind, so treat `html-tailwind`
results as guidance to translate rather than code to paste.
