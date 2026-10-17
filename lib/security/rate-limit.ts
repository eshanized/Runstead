interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  memoryStore.forEach((record, key) => {
    if (now >= record.resetAt) {
      memoryStore.delete(key);
    }
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

/**
 * In-memory sliding window rate limiter.
 * In a multi-node cluster this can be backed by Redis, but provides immediate, robust protection.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 30 }
): RateLimitResult {
  const now = Date.now();
  let record = memoryStore.get(identifier);

  if (!record || now >= record.resetAt) {
    record = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    memoryStore.set(identifier, record);
    return {
      success: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - 1,
      reset: record.resetAt,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, options.maxRequests - record.count);
  const success = record.count <= options.maxRequests;

  return {
    success,
    limit: options.maxRequests,
    remaining,
    reset: record.resetAt,
  };
}
