import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { buildCsp } from "../src/lib/csp.ts";

/**
 * The Content-Security-Policy, as a regression guard.
 *
 * A CSP is easy to weaken by accident and impossible to notice: the site keeps
 * working, gets a little easier to work on, and quietly stops defending itself.
 * `'unsafe-inline'` in `script-src` is one character of diff and undoes the
 * whole point. These tests exist so that stops being a silent change.
 */

const NONCE = "dGVzdC1ub25jZQ==";

/** Pulls one directive out of the policy string. */
function directive(csp: string, name: string): string | null {
  const found = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part === name || part.startsWith(`${name} `));
  return found ?? null;
}

describe("script-src", () => {
  const csp = buildCsp(NONCE);
  const scriptSrc = directive(csp, "script-src")!;

  test("carries this response's nonce", () => {
    assert.ok(scriptSrc.includes(`'nonce-${NONCE}'`));
  });

  test("never allows inline scripts", () => {
    // The one that matters. If this ever passes with 'unsafe-inline' present,
    // an injected <script> runs and the nonce was decoration.
    assert.ok(!scriptSrc.includes("'unsafe-inline'"), scriptSrc);
  });

  test("never allows eval", () => {
    assert.ok(!scriptSrc.includes("'unsafe-eval'"), scriptSrc);
  });

  test("uses strict-dynamic so bundle chunks inherit trust", () => {
    assert.ok(scriptSrc.includes("'strict-dynamic'"));
  });
});

describe("the directives that stop the classics", () => {
  const csp = buildCsp(NONCE);

  test("nobody may frame us — no clickjacking the staff portal", () => {
    assert.equal(directive(csp, "frame-ancestors"), "frame-ancestors 'none'");
  });

  test("no plugins", () => {
    assert.equal(directive(csp, "object-src"), "object-src 'none'");
  });

  test("an injected <base> cannot repoint every relative URL", () => {
    assert.equal(directive(csp, "base-uri"), "base-uri 'self'");
  });

  test("an injected form cannot post a guest's details elsewhere", () => {
    assert.equal(directive(csp, "form-action"), "form-action 'self'");
  });

  test("everything falls back to same-origin", () => {
    assert.equal(directive(csp, "default-src"), "default-src 'self'");
  });

  test("http subresources are upgraded", () => {
    assert.ok(directive(csp, "upgrade-insecure-requests"));
  });

  test("fonts are self-hosted, so no third party learns who visits", () => {
    assert.equal(directive(csp, "font-src"), "font-src 'self'");
  });
});

describe("Turnstile changes the policy only when it is configured", () => {
  const off = buildCsp(NONCE, false);
  const on = buildCsp(NONCE, true);

  test("no Cloudflare anywhere when it is off", () => {
    assert.ok(!off.includes("cloudflare"), off);
  });

  test("frames are refused outright when it is off", () => {
    assert.equal(directive(off, "frame-src"), "frame-src 'none'");
  });

  test("frame-src names Cloudflare when it is on, for the challenge iframe", () => {
    assert.equal(directive(on, "frame-src"), "frame-src https://challenges.cloudflare.com");
  });

  test("connect-src names Cloudflare when it is on", () => {
    assert.ok(directive(on, "connect-src")!.includes("https://challenges.cloudflare.com"));
  });

  test("script-src does NOT name Cloudflare, because that would do nothing", () => {
    // With 'strict-dynamic' present, browsers ignore host allowlists in
    // script-src entirely. The widget script is allowed because it carries our
    // nonce; listing the host would be a comforting no-op.
    assert.ok(!directive(on, "script-src")!.includes("cloudflare"), directive(on, "script-src")!);
  });

  test("turning it on does not loosen anything else", () => {
    for (const name of ["default-src", "script-src", "object-src", "base-uri", "form-action", "frame-ancestors"]) {
      assert.equal(directive(on, name), directive(off, name), `${name} should be unchanged`);
    }
  });
});

describe("Supabase access", () => {
  test("connect-src allows the database and its realtime socket, and no more", () => {
    const connectSrc = directive(buildCsp(NONCE), "connect-src")!;
    assert.equal(connectSrc, "connect-src 'self' https://*.supabase.co wss://*.supabase.co");
  });
});
