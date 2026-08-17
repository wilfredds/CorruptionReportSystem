# Vendored Claude skills

These skills are copied ("vendored") from upstream repositories rather than
installed as plugins, so they are available in remote/web Claude Code sessions
and to anyone who clones this repo. They do **not** auto-update — re-pull and
re-review when you want newer versions.

## Provenance

| Skills | Upstream | License | Pinned at |
|---|---|---|---|
| `ui-ux-pro-max`, `ui-styling`, `design`, `design-system`, `brand`, `banner-design`, `slides` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | MIT | `a38d04c` |
| `frontend-design`, `webapp-testing` | [anthropics/skills](https://github.com/anthropics/skills) | Apache-2.0 | see each `LICENSE.txt` |
| `brainstorming`, `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `receiving-code-review`, `requesting-code-review`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `using-superpowers`, `verification-before-completion`, `writing-plans`, `writing-skills` | [obra/superpowers](https://github.com/obra/superpowers) | MIT | — |

## Runtime requirements

### ui-ux-pro-max

Python 3, standard library only. No install step.

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard" --stack shadcn
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "civic trust" -d color
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "reporting portal" --design-system
```

Useful stacks here: `shadcn`, `nextjs`, `react` (autocare, rallyready),
`html-tailwind` (bike-guide-app, corruption-reporting-system-final).
Coverage for `flutter` (cyclemind_ai) is sparse — queries often return no match.

### webapp-testing

Needs the **Python** Playwright binding, which is not preinstalled. The version
must match the Chromium build shipped in the environment (`1194`), so pin it:

```bash
pip install "playwright==1.56.0"
```

Do **not** run `playwright install` — the browsers are already at
`$PLAYWRIGHT_BROWSERS_PATH` (`/opt/pw-browsers`). Installing an unpinned
Playwright pulls 1.62.0, which looks for Chromium build `1234` and fails.

Node's Playwright (1.56.1) is already available via `npx playwright` if you
prefer the JS API.

### superpowers

Vendored as plain skills. Upstream ships a session-start hook that
auto-announces the skill set; that hook is **not** installed here, so invoke the
skills explicitly. For local (non-remote) use, the plugin install is cleaner:

```
/plugin install superpowers@claude-plugins-official
```
