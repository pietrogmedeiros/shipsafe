// Tiny in-memory rate limiter. Fixed-window counter keyed by an arbitrary
// string (e.g. "signup:1.2.3.4"). Good enough for the single EasyPanel
// instance ShipSafe runs on; it does NOT span multiple instances and resets on
// restart. If we ever scale horizontally, back this with ES or Redis.

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window rolls over
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded under attack.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number; // ms until the window resets (0 when allowed)
}

/**
 * Allow up to `limit` hits per `windowMs` for a given key.
 * Returns whether this hit is allowed and how long until reset.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (b.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { allowed: true, remaining: limit - b.count, retryAfterMs: 0 };
}

/** Best-effort client IP from proxy headers (EasyPanel/Contabo sits behind a proxy). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
