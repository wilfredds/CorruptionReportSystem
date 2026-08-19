#!/usr/bin/env node
// Syntax check for the two static sites' JavaScript.
//
// corruption-reporting-system-final, bike-guide-app and portfolio have no build
// step, so nothing sits between a typo and production. A syntax error in a module means the
// browser silently drops the whole script — the page renders, the behaviour
// just never attaches, which is easy to miss in review.
//
// This parses every standalone .js file and every inline <script> block without
// executing any of it. `new vm.SourceTextModule(src)` compiles the source and
// throws on invalid syntax; evaluation is a separate step that is never called.
//
// Deliberately dependency-free — Node stdlib only, so CI needs no install.
//
// NOTE: do not replace this with `node --check`. That command exits 0 even on a
// syntactically invalid file, so it validates nothing. This was verified.
//
// Usage: node --experimental-vm-modules .github/scripts/check-static-js.mjs [dirs...]

import vm from 'node:vm';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error('usage: check-static-js.mjs <dir> [dir...]');
  process.exit(2);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Compile as an ES module. Throws on a syntax error. */
function checkModule(src) {
  new vm.SourceTextModule(src);
}

/** Compile as a classic script. Throws on a syntax error. */
function checkScript(src) {
  new vm.Script(src);
}

let checked = 0;
let failed = 0;

function report(label, fn) {
  checked++;
  try {
    fn();
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${label}`);
    console.log(`        ${err.message}`);
  }
}

for (const root of roots) {
  for (const file of walk(root)) {
    const rel = relative(process.cwd(), file);

    if (file.endsWith('.js') || file.endsWith('.mjs')) {
      const src = readFileSync(file, 'utf8');
      // Decide module vs classic script by looking for top-level import/export
      // rather than by trying one and falling back to the other. A fallback
      // reports the *second* failure, so a genuine syntax error in a module
      // surfaces as the misleading "Cannot use import statement outside a
      // module" instead of pointing at the actual mistake.
      const isModule = /^\s*(import|export)[\s{*]/m.test(src);
      report(rel, () => (isModule ? checkModule(src) : checkScript(src)));
      continue;
    }

    if (!file.endsWith('.html')) continue;

    const html = readFileSync(file, 'utf8');
    const tagRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    let m;
    let idx = 0;
    while ((m = tagRe.exec(html)) !== null) {
      const attrs = m[1] || '';
      const body = m[2] || '';
      // Skip <script src="..."> — nothing inline to parse.
      if (/\bsrc\s*=/i.test(attrs)) continue;
      // Skip non-JS payloads such as application/ld+json.
      if (/\btype\s*=\s*["']?(?!module|text\/javascript|application\/javascript)[^"'\s>]+/i.test(attrs)) continue;
      if (body.trim() === '') continue;

      const isModule = /\btype\s*=\s*["']?module/i.test(attrs);
      const label = `${rel} <script${isModule ? ' type=module' : ''}> #${idx++}`;
      report(label, () => (isModule ? checkModule(body) : checkScript(body)));
    }
  }
}

console.log(`\n  ${checked - failed}/${checked} JavaScript blocks parsed cleanly`);
process.exit(failed ? 1 : 0);
