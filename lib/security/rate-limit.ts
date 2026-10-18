import { createHash } from 'node:crypto';
import { prisma } from '../db/client.ts';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Local-only limiter for unit tests and developer mode.
setInterval(() => {
  const now = Date.now();
  memoryStore.forEach((record, key) => {
    if (now >= record.resetAt) memoryStore.delete(key);
  });
}, 300_000).unref();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function localCheck(identifier: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  let record = memoryStore.get(identifier);

  if (!record || now >= record.resetAt) {
    record = { count: 1, resetAt: now + options.windowMs };
    memoryStore.set(identifier, record);
  } else {
    record.count += 1;
  }

  return {
    success: record.count <= options.maxRequests,
    limit: options.maxRequests,
    remaining: Math.max(0, options.maxRequests - record.count),
    reset: record.resetAt,
  };
}

/**
 * Local/test-only synchronous limiter retained for existing unit tests.
 * Production routes must use checkRateLimitAsync so limits are shared across
 * serverless instances and fail closed if the database limiter is unavailable.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 30 }
): RateLimitResult {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Use checkRateLimitAsync for production rate limiting.');
  }
  return localCheck(identifier, options);
}

/**
 * Resolve the client IP from the rightmost forwarding entry, which should be
 * added by the trusted ingress proxy. Deployments must configure the ingress
 * to overwrite/append this header; do not trust arbitrary client-provided IPs.
 */
export function getRateLimitClientAddress(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const entries = forwarded.split(',').map((entry) => entry.trim()).filter(Boolean);
    if (entries.length > 0) return entries[entries.length - 1].slice(0, 128);
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  return realIp ? realIp.slice(0, 128) : 'unknown';
}

/**
 * Shared PostgreSQL fixed-window limiter. The upsert is atomic across app
 * instances. If production persistence is unavailable, the sensitive request
 * is denied instead of falling back to a process-local map.
 */
export async function checkRateLimitAsync(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 30 }
): Promise<RateLimitResult> {
  if (process.env.NODE_ENV !== 'production') {
    return localCheck(identifier, options);
  }

  const key = createHash('sha256').update(identifier).digest('hex');
  const resetFallback = Date.now() + options.windowMs;

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; window_ends_at: Date }>>`
      INSERT INTO "rate_limit_buckets" ("key", "count", "window_ends_at", "updated_at")
      VALUES (
        ${key},
        1,
        NOW() + (${options.windowMs} * INTERVAL '1 millisecond'),
        NOW()
      )
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "rate_limit_buckets"."window_ends_at" <= NOW() THEN 1
          ELSE "rate_limit_buckets"."count" + 1
        END,
        "window_ends_at" = CASE
          WHEN "rate_limit_buckets"."window_ends_at" <= NOW()
            THEN NOW() + (${options.windowMs} * INTERVAL '1 millisecond')
          ELSE "rate_limit_buckets"."window_ends_at"
        END,
        "updated_at" = NOW()
      RETURNING "count", "window_ends_at"
    `;

    const row = rows[0];
    if (!row) throw new Error('Rate limiter did not return a bucket');

    return {
      success: row.count <= options.maxRequests,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - row.count),
      reset: new Date(row.window_ends_at).getTime(),
    };
  } catch {
    return {
      success: false,
      limit: options.maxRequests,
      remaining: 0,
      reset: resetFallback,
    };
  }
}
