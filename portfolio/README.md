# portfolio

Personal portfolio site for Francis Wilfred Antiporda, covering the five
projects in this repository.

**Stack:** static HTML, CSS and JavaScript. No build step, no bundler, no
package manager — same discipline as `bike-guide-app` and
`corruption-reporting-system-final`.

## Running it

```bash
cd portfolio
python3 -m http.server 8090   # then open http://localhost:8090
```

A plain static server is enough. Nothing here needs Node.

## Layout

```
portfolio/
├── index.html              # the whole one-page site: hero, about, skills,
│                           #   projects, timeline, contact
├── resume.html             # printable résumé (Print → Save as PDF)
├── projects/               # one case-study page per project
│   ├── autocare.html
│   ├── rallyready.html
│   ├── cyclemind-ai.html
│   ├── bike-guide-ph.html
│   └── corruption-watch-ph.html
├── css/style.css           # every style, one file, custom properties at the top
├── js/
│   ├── boot.js             # adds .js to <html> before paint (see CSP note)
│   └── site.js             # typing effect, counters, reveal, active nav link
├── assets/img/             # portrait, avatar, project screenshots
└── vercel.json             # clean URLs, cache headers, CSP
```

## Things worth knowing before editing

- **Everything is progressive enhancement.** Every word on the page is in the
  HTML. `site.js` only animates what is already there, so the site reads fine
  with JavaScript off or broken.
- **No inline `<script>` or `style` attributes, on purpose.** The
  Content-Security-Policy in `vercel.json` forbids both, which is why the
  one-line `boot.js` exists instead of an inline script in `<head>`. If you add
  an inline script or a `style="..."` attribute, it will be blocked in
  production — put it in `site.js` or `style.css` instead.
- **The screenshots are composites**, generated from the running apps at
  1200×750 on the site's own background so all five cards match. They live in
  `assets/img/shot-*.jpg`. To regenerate one, screenshot the app and paste it
  onto a `#0b0e0b` canvas at that size.
- **`cyclemind_ai` has no screenshot.** There is no Flutter SDK in the
  development environment, so its card shows a stylised placeholder rather than
  a mock-up of a screen nobody ran. Drop a real screenshot in and swap the
  `.card-shot.is-empty` block for an `<img>` when one exists.
- **Fonts come from Google Fonts.** Both faces have real fallbacks
  (`ui-monospace` and `system-ui`), so a blocked CDN changes the typography but
  not the layout.

## Deploying to Vercel

Import the repository, then set **Root Directory** to `portfolio`. Framework
preset: **Other**. There is no build command and no output directory to set —
Vercel serves the folder as-is and picks up `vercel.json` for headers and clean
URLs.

## CI

`.github/workflows/static-sites-ci.yml` parses every JavaScript file and inline
`<script>` block in this folder on each push and pull request. It catches
syntax errors, not behaviour.
