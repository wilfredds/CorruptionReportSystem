/**
 * A small fixed-window rate limiter for the login route.
 *
 * IMPORTANT — what this does and does not protect:
 *   * The counter lives in the memory of a single server instance. On Vercel,
 *     several instances may serve requests, so this alone is not a hard global
 *     limit. It is a cheap first line of defence against a burst from one IP.
 *   * The real, durable protection is the per-account lockout stored on the
 *     User row (failedLoginAttempts / lockedUntil). That one is shared by every
 *     instance because it lives in Postgres.
 *
 * To make the IP limit global too, swap `hit()` for a Redis INCR with EXPIRE
 * (e.g. Upstash) — the call signature is designed to stay the same.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Login attempts allowed per IP inside the window. */
export const LOGIN_RATE_LIMIT = 10;
/** Length of the window, in milliseconds. */
export const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000;

/** After this many consecutive wrong passwords the account itself is locked. */
export const MAX_FAILED_LOGINS = 5;
/** How long the account stays locked. */
export const LOCKOUT_MINUTES = 15;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function sweep(now: number) {
  // Keep the map from growing without bound on a long-lived instance.
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function hit(
  key: string,
  limit = LOGIN_RATE_LIMIT,
  windowMs = LOGIN_RATE_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Forget a key — called after a successful login so one good login clears the slate. */
export function reset(key: string): void {
  buckets.delete(key);
}
